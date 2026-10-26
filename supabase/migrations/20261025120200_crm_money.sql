-- Invoices, payments, allocations, refunds, and internal budgets.

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  profile_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('deposit', 'milestone', 'final', 'change')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'partial', 'paid', 'overdue', 'void')),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  due_on date,
  document_number text NOT NULL,
  legacy_record_id text,
  change_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL DEFAULT 0
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('stripe', 'manual')),
  provider_id text,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  method text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  received_on date,
  recorded_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payments_provider_id_key
  ON public.payments (provider, provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES public.invoices (id) ON DELETE RESTRICT,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id, invoice_id)
);

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE RESTRICT,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  provider_id text,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX refunds_provider_id_key
  ON public.refunds (provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE public.stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN (
    'design', 'development', 'contractors', 'software', 'hosting', 'other', 'labor'
  )),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  UNIQUE (project_id, category)
);

CREATE TABLE public.project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN (
    'design', 'development', 'contractors', 'software', 'hosting', 'other', 'labor'
  )),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  note text NOT NULL DEFAULT '',
  incurred_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  hours numeric NOT NULL CHECK (hours >= 0),
  rate_cents bigint,
  note text NOT NULL DEFAULT '',
  worked_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.crm_invoice_allocated(p_invoice_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(a.amount_cents), 0)::bigint
  FROM public.payment_allocations a
  JOIN public.payments p ON p.id = a.payment_id
  WHERE a.invoice_id = p_invoice_id
    AND p.status = 'succeeded';
$$;

CREATE OR REPLACE FUNCTION public.crm_refresh_invoice_status(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_allocated bigint;
  v_refunded bigint;
  v_net bigint;
BEGIN
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND OR v_invoice.status = 'void' OR v_invoice.status = 'draft' THEN
    RETURN;
  END IF;

  v_allocated := public.crm_invoice_allocated(p_invoice_id);
  SELECT coalesce(sum(r.amount_cents), 0)::bigint INTO v_refunded
  FROM public.refunds r
  JOIN public.payment_allocations a ON a.payment_id = r.payment_id
  WHERE a.invoice_id = p_invoice_id;

  v_net := greatest(0, v_allocated - v_refunded);

  UPDATE public.invoices
  SET status = CASE
    WHEN v_net >= v_invoice.total_cents THEN 'paid'
    WHEN v_net > 0 AND v_invoice.due_on IS NOT NULL AND v_invoice.due_on < CURRENT_DATE THEN 'overdue'
    WHEN v_net > 0 THEN 'partial'
    WHEN v_invoice.due_on IS NOT NULL AND v_invoice.due_on < CURRENT_DATE THEN 'overdue'
    ELSE 'issued'
  END
  WHERE id = p_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_allocate_payment(
  p_payment_id uuid,
  p_invoice_id uuid,
  p_amount_cents bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_allocated bigint;
  v_invoice_allocated bigint;
BEGIN
  IF p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Allocation amount must be positive';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;

  IF v_payment.status <> 'succeeded' THEN
    RAISE EXCEPTION 'Only succeeded payments can be allocated';
  END IF;
  IF v_invoice.status = 'void' OR v_invoice.status = 'draft' THEN
    RAISE EXCEPTION 'Invoice cannot accept a payment in its current state';
  END IF;
  IF v_payment.currency <> v_invoice.currency THEN
    RAISE EXCEPTION 'Currency mismatch';
  END IF;

  SELECT coalesce(sum(amount_cents), 0)::bigint INTO v_allocated
  FROM public.payment_allocations WHERE payment_id = p_payment_id;

  v_invoice_allocated := public.crm_invoice_allocated(p_invoice_id);

  IF v_allocated + p_amount_cents > v_payment.amount_cents THEN
    RAISE EXCEPTION 'Allocation exceeds the payment';
  END IF;
  IF v_invoice_allocated + p_amount_cents > v_invoice.total_cents THEN
    RAISE EXCEPTION 'Allocation exceeds the invoice balance';
  END IF;

  INSERT INTO public.payment_allocations (payment_id, invoice_id, amount_cents)
  VALUES (p_payment_id, p_invoice_id, p_amount_cents);

  PERFORM public.crm_refresh_invoice_status(p_invoice_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_ingest_stripe_event(
  p_event_id text,
  p_event_type text,
  p_invoice_id uuid,
  p_provider_payment_id text,
  p_amount_cents bigint,
  p_currency text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted text;
  v_payment_id uuid;
  v_invoice public.invoices%ROWTYPE;
  v_open bigint;
BEGIN
  INSERT INTO public.stripe_events (id, event_type)
  VALUES (p_event_id, p_event_type)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NULL THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('duplicate', false, 'ignored', 'invoice_missing');
  END IF;

  IF lower(p_currency) <> lower(v_invoice.currency) THEN
    RETURN jsonb_build_object('duplicate', false, 'ignored', 'currency_mismatch');
  END IF;

  SELECT id INTO v_payment_id
  FROM public.payments
  WHERE provider = 'stripe' AND provider_id = p_provider_payment_id;

  IF v_payment_id IS NULL THEN
    INSERT INTO public.payments (
      profile_id, provider, provider_id, amount_cents, currency, status, received_on, recorded_by
    ) VALUES (
      v_invoice.profile_id,
      'stripe',
      p_provider_payment_id,
      p_amount_cents,
      lower(p_currency),
      p_status,
      CURRENT_DATE,
      'stripe-webhook'
    )
    RETURNING id INTO v_payment_id;
  ELSE
    UPDATE public.payments
    SET status = p_status, amount_cents = p_amount_cents
    WHERE id = v_payment_id;
  END IF;

  IF p_status = 'succeeded' AND v_invoice.status NOT IN ('void', 'draft') THEN
    v_open := v_invoice.total_cents - public.crm_invoice_allocated(p_invoice_id);
    IF v_open > 0 THEN
      PERFORM public.crm_allocate_payment(
        v_payment_id,
        p_invoice_id,
        least(p_amount_cents, v_open)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('duplicate', false, 'paymentId', v_payment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_record_manual_payment(
  p_invoice_id uuid,
  p_amount_cents bigint,
  p_method text,
  p_received_on date,
  p_reference text,
  p_note text,
  p_actor text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_payment_id uuid;
  v_open bigint;
BEGIN
  IF p_amount_cents <= 0 OR length(trim(p_method)) = 0 OR length(trim(p_reference)) = 0 OR length(trim(p_note)) = 0 THEN
    RAISE EXCEPTION 'Method, amount, date, reference, and note are required';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  IF v_invoice.status IN ('draft', 'void') THEN
    RAISE EXCEPTION 'Issue the invoice before recording a payment';
  END IF;

  INSERT INTO public.payments (
    profile_id, provider, amount_cents, currency, status, method, reference, note, received_on, recorded_by
  ) VALUES (
    v_invoice.profile_id, 'manual', p_amount_cents, v_invoice.currency, 'succeeded',
    p_method, p_reference, p_note, p_received_on, p_actor
  )
  RETURNING id INTO v_payment_id;

  v_open := v_invoice.total_cents - public.crm_invoice_allocated(p_invoice_id);
  IF v_open > 0 THEN
    PERFORM public.crm_allocate_payment(v_payment_id, p_invoice_id, least(p_amount_cents, v_open));
  END IF;

  INSERT INTO public.audit_events (actor, action, entity_type, entity_id, summary)
  VALUES (
    p_actor, 'manual_payment', 'payment', v_payment_id::text,
    jsonb_build_object('invoiceId', p_invoice_id, 'amountCents', p_amount_cents, 'reference', p_reference)
  );

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_record_refund(
  p_payment_id uuid,
  p_amount_cents bigint,
  p_provider_id text,
  p_reason text,
  p_actor text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_refunded bigint;
  v_refund_id uuid;
  v_invoice_id uuid;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  SELECT coalesce(sum(amount_cents), 0)::bigint INTO v_refunded
  FROM public.refunds WHERE payment_id = p_payment_id;

  IF v_refunded + p_amount_cents > v_payment.amount_cents THEN
    RAISE EXCEPTION 'Refund exceeds the payment';
  END IF;

  INSERT INTO public.refunds (payment_id, amount_cents, provider_id, reason)
  VALUES (p_payment_id, p_amount_cents, nullif(p_provider_id, ''), coalesce(p_reason, ''))
  RETURNING id INTO v_refund_id;

  FOR v_invoice_id IN
    SELECT invoice_id FROM public.payment_allocations WHERE payment_id = p_payment_id
  LOOP
    PERFORM public.crm_refresh_invoice_status(v_invoice_id);
  END LOOP;

  INSERT INTO public.audit_events (actor, action, entity_type, entity_id, summary)
  VALUES (
    p_actor, 'refund', 'refund', v_refund_id::text,
    jsonb_build_object('paymentId', p_payment_id, 'amountCents', p_amount_cents)
  );

  RETURN v_refund_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_invoice_allocated(uuid) FROM public;
REVOKE ALL ON FUNCTION public.crm_refresh_invoice_status(uuid) FROM public;
REVOKE ALL ON FUNCTION public.crm_allocate_payment(uuid, uuid, bigint) FROM public;
REVOKE ALL ON FUNCTION public.crm_ingest_stripe_event(text, text, uuid, text, bigint, text, text) FROM public;
REVOKE ALL ON FUNCTION public.crm_record_manual_payment(uuid, bigint, text, date, text, text, text) FROM public;
CREATE OR REPLACE FUNCTION public.crm_prepare_billing(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_deposit_id uuid;
  v_final_id uuid;
  v_remainder bigint;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.invoices WHERE order_id = p_order_id AND kind = 'deposit'
  ) AND v_order.deposit_required_cents > 0 THEN
    INSERT INTO public.invoices (
      order_id, profile_id, kind, status, total_cents, currency, due_on, document_number
    ) VALUES (
      p_order_id,
      v_order.profile_id,
      'deposit',
      'draft',
      v_order.deposit_required_cents,
      v_order.currency,
      CURRENT_DATE + 7,
      public.crm_next_document_number('INV')
    )
    RETURNING id INTO v_deposit_id;

    INSERT INTO public.invoice_lines (invoice_id, description, quantity, unit_price_cents)
    VALUES (v_deposit_id, 'Project deposit', 1, v_order.deposit_required_cents);
  END IF;

  v_remainder := v_order.total_cents - v_order.deposit_required_cents;
  IF NOT EXISTS (
    SELECT 1 FROM public.invoices WHERE order_id = p_order_id AND kind = 'final'
  ) AND v_remainder > 0 THEN
    INSERT INTO public.invoices (
      order_id, profile_id, kind, status, total_cents, currency, document_number
    ) VALUES (
      p_order_id,
      v_order.profile_id,
      'final',
      'draft',
      v_remainder,
      v_order.currency,
      public.crm_next_document_number('INV')
    )
    RETURNING id INTO v_final_id;

    INSERT INTO public.invoice_lines (invoice_id, description, quantity, unit_price_cents)
    VALUES (v_final_id, 'Final balance', 1, v_remainder);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_prepare_billing(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_prepare_billing(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.crm_record_refund(uuid, bigint, text, text, text) FROM public;

GRANT EXECUTE ON FUNCTION public.crm_invoice_allocated(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_refresh_invoice_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_allocate_payment(uuid, uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_ingest_stripe_event(text, text, uuid, text, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_record_manual_payment(uuid, bigint, text, date, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_record_refund(uuid, bigint, text, text, text) TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.invoices,
  public.invoice_lines,
  public.payments,
  public.payment_allocations,
  public.refunds,
  public.stripe_events,
  public.project_budgets,
  public.project_costs,
  public.time_entries
TO service_role;
