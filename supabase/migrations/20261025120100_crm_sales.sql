-- Quotes, acceptance, orders, and agreements.

CREATE TABLE public.document_sequences (
  prefix text PRIMARY KEY,
  next_value integer NOT NULL CHECK (next_value > 0)
);

INSERT INTO public.document_sequences (prefix, next_value) VALUES
  ('QTE', 1000),
  ('INV', 1000);

CREATE TABLE public.quote_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  snapshot jsonb NOT NULL,
  total_cents bigint NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  deposit_type text NOT NULL DEFAULT 'percent'
    CHECK (deposit_type IN ('percent', 'fixed', 'milestone', 'none')),
  deposit_percent numeric NOT NULL DEFAULT 50,
  deposit_cents bigint NOT NULL DEFAULT 0 CHECK (deposit_cents >= 0),
  revision_allowance integer NOT NULL DEFAULT 3 CHECK (revision_allowance >= 0),
  expires_on date,
  scope_summary text NOT NULL DEFAULT '',
  exclusions text NOT NULL DEFAULT '',
  schedule_notes text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  legacy_record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, version_number)
);

CREATE TABLE public.quote_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id uuid NOT NULL UNIQUE REFERENCES public.quote_versions (id) ON DELETE RESTRICT,
  actor text NOT NULL,
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_acceptance_id uuid NOT NULL UNIQUE REFERENCES public.quote_acceptances (id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE RESTRICT,
  profile_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending_agreement'
    CHECK (status IN (
      'pending_agreement', 'pending_deposit', 'active', 'complete', 'cancelled'
    )),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  deposit_type text NOT NULL,
  deposit_required_cents bigint NOT NULL DEFAULT 0 CHECK (deposit_required_cents >= 0),
  document_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price_cents bigint NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0)
);

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'void')),
  accepted_at timestamptz,
  accepted_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.crm_next_document_number(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value integer;
BEGIN
  UPDATE public.document_sequences
  SET next_value = next_value + 1
  WHERE prefix = p_prefix
  RETURNING next_value - 1 INTO v_value;

  IF v_value IS NULL THEN
    RAISE EXCEPTION 'Unknown document prefix %', p_prefix;
  END IF;

  RETURN p_prefix || '-' || lpad(v_value::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_accept_quote(
  p_quote_version_id uuid,
  p_actor text,
  p_ip text,
  p_user_agent text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.quote_versions%ROWTYPE;
  v_opp public.opportunities%ROWTYPE;
  v_acceptance_id uuid;
  v_order_id uuid;
  v_existing uuid;
  v_deposit bigint;
  v_number text;
  v_item jsonb;
BEGIN
  SELECT * INTO v_quote
  FROM public.quote_versions
  WHERE id = p_quote_version_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote version not found';
  END IF;

  SELECT o.id INTO v_existing
  FROM public.quote_acceptances a
  JOIN public.orders o ON o.quote_acceptance_id = a.id
  WHERE a.quote_version_id = p_quote_version_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('orderId', v_existing, 'created', false);
  END IF;

  SELECT * INTO v_opp FROM public.opportunities WHERE id = v_quote.opportunity_id;

  IF v_quote.deposit_type = 'none' THEN
    v_deposit := 0;
  ELSIF v_quote.deposit_type = 'fixed' THEN
    v_deposit := v_quote.deposit_cents;
  ELSE
    v_deposit := round(v_quote.total_cents * v_quote.deposit_percent / 100.0);
  END IF;

  v_number := public.crm_next_document_number('INV');

  INSERT INTO public.quote_acceptances (
    quote_version_id, actor, ip_address, user_agent
  ) VALUES (
    p_quote_version_id, p_actor, coalesce(p_ip, ''), coalesce(p_user_agent, '')
  )
  RETURNING id INTO v_acceptance_id;

  INSERT INTO public.orders (
    quote_acceptance_id, opportunity_id, profile_id, status,
    total_cents, tax_cents, currency, deposit_type, deposit_required_cents,
    document_number
  ) VALUES (
    v_acceptance_id,
    v_quote.opportunity_id,
    v_opp.profile_id,
    CASE WHEN v_deposit = 0 THEN 'pending_agreement' ELSE 'pending_agreement' END,
    v_quote.total_cents,
    v_quote.tax_cents,
    v_quote.currency,
    v_quote.deposit_type,
    v_deposit,
    v_number
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(coalesce(v_quote.snapshot->'services', '[]'::jsonb))
  LOOP
    INSERT INTO public.order_lines (order_id, description, quantity, unit_price_cents)
    VALUES (
      v_order_id,
      coalesce(v_item->>'description', v_item->>'service', 'Line'),
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'unitPriceCents')::bigint, 0)
    );
  END LOOP;

  INSERT INTO public.agreements (order_id, status) VALUES (v_order_id, 'draft');

  IF v_opp.stage IS DISTINCT FROM 'accepted_pending'
     AND v_opp.stage NOT IN ('closed_won', 'closed_lost') THEN
    INSERT INTO public.opportunity_stage_events (
      opportunity_id, actor, from_stage, to_stage, reason
    ) VALUES (
      v_opp.id, p_actor, v_opp.stage, 'accepted_pending', 'Quote accepted'
    );
    UPDATE public.opportunities
    SET stage = 'accepted_pending', updated_at = now()
    WHERE id = v_opp.id;
  END IF;

  INSERT INTO public.audit_events (actor, action, entity_type, entity_id, summary)
  VALUES (
    p_actor,
    'quote_accepted',
    'order',
    v_order_id::text,
    jsonb_build_object('quoteVersionId', p_quote_version_id, 'created', true)
  );

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'acceptanceId', v_acceptance_id,
    'created', true
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT o.id INTO v_existing
    FROM public.quote_acceptances a
    JOIN public.orders o ON o.quote_acceptance_id = a.id
    WHERE a.quote_version_id = p_quote_version_id;
    RETURN jsonb_build_object('orderId', v_existing, 'created', false);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_next_document_number(text) FROM public;
REVOKE ALL ON FUNCTION public.crm_accept_quote(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_next_document_number(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_accept_quote(uuid, text, text, text) TO service_role;

ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.document_sequences,
  public.quote_versions,
  public.quote_acceptances,
  public.orders,
  public.order_lines,
  public.agreements
TO service_role;
