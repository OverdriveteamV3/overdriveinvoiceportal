INSERT INTO public.document_sequences (prefix, next_value)
VALUES ('ORD', 1000)
ON CONFLICT (prefix) DO NOTHING;

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

  v_number := public.crm_next_document_number('ORD');

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
    'pending_agreement',
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

REVOKE ALL ON FUNCTION public.crm_accept_quote(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_accept_quote(uuid, text, text, text) TO service_role;
