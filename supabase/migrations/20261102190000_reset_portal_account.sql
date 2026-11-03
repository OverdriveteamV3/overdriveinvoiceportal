-- Deletes one portal user's sole-owned jobs. Other portal users, clients,
-- and admin dashboards are left in place. The portal login row is kept.

CREATE OR REPLACE FUNCTION public.reset_portal_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_email text;
  v_project_ids uuid[] := '{}';
  v_order_ids uuid[] := '{}';
  v_invoice_ids uuid[] := '{}';
  v_payment_ids uuid[] := '{}';
  v_acceptance_ids uuid[] := '{}';
  v_opportunity_ids uuid[] := '{}';
BEGIN
  SELECT client_id, lower(btrim(email))
  INTO v_client_id, v_email
  FROM public.portal_users
  WHERE id = p_user_id;

  IF NOT FOUND OR v_client_id IS NULL THEN
    RAISE EXCEPTION 'Portal account not found';
  END IF;

  SELECT
    COALESCE(array_agg(p.id), '{}'),
    COALESCE(array_agg(p.order_id) FILTER (WHERE p.order_id IS NOT NULL), '{}')
  INTO v_project_ids, v_order_ids
  FROM public.projects p
  WHERE p.client_id = v_client_id
    AND EXISTS (
      SELECT 1
      FROM public.portal_memberships m
      WHERE m.project_id = p.id
        AND m.portal_user_id = p_user_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.portal_memberships m
      WHERE m.project_id = p.id
        AND m.portal_user_id <> p_user_id
    );

  IF cardinality(v_order_ids) > 0 THEN
    SELECT COALESCE(array_agg(i.id), '{}')
    INTO v_invoice_ids
    FROM public.invoices i
    WHERE i.order_id = ANY (v_order_ids);

    SELECT
      COALESCE(array_agg(DISTINCT o.quote_acceptance_id), '{}'),
      COALESCE(array_agg(DISTINCT o.opportunity_id), '{}')
    INTO v_acceptance_ids, v_opportunity_ids
    FROM public.orders o
    WHERE o.id = ANY (v_order_ids);
  END IF;

  IF cardinality(v_invoice_ids) > 0 THEN
    SELECT COALESCE(array_agg(DISTINCT a.payment_id), '{}')
    INTO v_payment_ids
    FROM public.payment_allocations a
    WHERE a.invoice_id = ANY (v_invoice_ids)
      AND NOT EXISTS (
        SELECT 1
        FROM public.payment_allocations other
        WHERE other.payment_id = a.payment_id
          AND NOT (other.invoice_id = ANY (v_invoice_ids))
      );
  END IF;

  IF cardinality(v_payment_ids) > 0 THEN
    DELETE FROM public.refunds
    WHERE payment_id = ANY (v_payment_ids);

    DELETE FROM public.payment_allocations
    WHERE payment_id = ANY (v_payment_ids);

    DELETE FROM public.payments
    WHERE id = ANY (v_payment_ids);
  END IF;

  IF cardinality(v_invoice_ids) > 0 THEN
    DELETE FROM public.payment_allocations
    WHERE invoice_id = ANY (v_invoice_ids);

    DELETE FROM public.invoices
    WHERE id = ANY (v_invoice_ids);
  END IF;

  IF cardinality(v_project_ids) > 0 THEN
    DELETE FROM public.projects
    WHERE id = ANY (v_project_ids);
  END IF;

  IF cardinality(v_order_ids) > 0 THEN
    DELETE FROM public.orders
    WHERE id = ANY (v_order_ids);
  END IF;

  IF cardinality(v_acceptance_ids) > 0 THEN
    DELETE FROM public.quote_acceptances
    WHERE id = ANY (v_acceptance_ids);
  END IF;

  IF cardinality(v_opportunity_ids) > 0 THEN
    DELETE FROM public.opportunities o
    WHERE o.id = ANY (v_opportunity_ids)
      AND NOT EXISTS (
        SELECT 1
        FROM public.orders ord
        WHERE ord.opportunity_id = o.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.quote_acceptances qa
        JOIN public.quote_versions qv ON qv.id = qa.quote_version_id
        WHERE qv.opportunity_id = o.id
      );
  END IF;

  DELETE FROM public.portal_memberships
  WHERE portal_user_id = p_user_id;

  IF v_email <> '' THEN
    DELETE FROM public.portal_invites
    WHERE lower(btrim(email)) = v_email;

    DELETE FROM public.support_threads
    WHERE lower(btrim(email)) = v_email;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_portal_account(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_portal_account(uuid) TO service_role;
