-- Projects, onboarding, revisions, files, and client portal access.

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE RESTRICT,
  profile_id text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'awaiting_onboarding'
    CHECK (stage IN (
      'awaiting_onboarding', 'ready_for_kickoff', 'scheduled', 'design', 'development',
      'internal_qa', 'client_review', 'revisions', 'awaiting_final_payment',
      'ready_to_launch', 'delivered', 'support', 'on_hold', 'cancelled'
    )),
  blocker text NOT NULL DEFAULT '',
  next_action text NOT NULL DEFAULT '',
  next_action_due date,
  revision_allowance integer NOT NULL DEFAULT 3 CHECK (revision_allowance >= 0),
  rounds_used integer NOT NULL DEFAULT 0 CHECK (rounds_used >= 0),
  kickoff_override_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activities
  ADD CONSTRAINT activities_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

ALTER TABLE public.project_budgets
  ADD CONSTRAINT project_budgets_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

ALTER TABLE public.project_costs
  ADD CONSTRAINT project_costs_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;

CREATE TABLE public.onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  item_key text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  state text NOT NULL DEFAULT 'not_requested'
    CHECK (state IN (
      'not_requested', 'requested', 'in_progress', 'complete', 'not_applicable'
    )),
  owner_profile_id text,
  due_on date,
  completed_at timestamptz,
  reference text NOT NULL DEFAULT '',
  UNIQUE (project_id, item_key)
);

CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title text NOT NULL,
  due_on date,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending', 'in_progress', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.revision_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'included' CHECK (kind IN ('included', 'defect')),
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN (
      'draft', 'submitted', 'clarification_needed', 'accepted', 'in_progress',
      'delivered', 'closed', 'rejected', 'withdrawn', 'duplicate'
    )),
  title text NOT NULL DEFAULT '',
  consumes_allowance boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX revision_rounds_one_open_consumer
  ON public.revision_rounds (project_id)
  WHERE consumes_allowance = true
    AND state IN ('accepted', 'in_progress', 'delivered');

CREATE TABLE public.revision_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.revision_rounds (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE RESTRICT,
  summary text NOT NULL,
  price_cents bigint NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  schedule_impact text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'invoiced')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_change_order_id_fkey
  FOREIGN KEY (change_order_id) REFERENCES public.change_orders (id) ON DELETE SET NULL;

CREATE TABLE public.crm_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'client')),
  content bytea NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8000000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX portal_users_email_key ON public.portal_users (lower(email));

CREATE TABLE public.portal_memberships (
  portal_user_id uuid NOT NULL REFERENCES public.portal_users (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  PRIMARY KEY (portal_user_id, project_id)
);

CREATE TABLE public.portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  entity_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, entity_key)
);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.crm_open_project(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_opp public.opportunities%ROWTYPE;
  v_quote public.quote_versions%ROWTYPE;
  v_project_id uuid;
  v_item record;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT id INTO v_project_id FROM public.projects WHERE order_id = p_order_id;
  IF v_project_id IS NOT NULL THEN
    RETURN v_project_id;
  END IF;

  SELECT * INTO v_opp FROM public.opportunities WHERE id = v_order.opportunity_id;
  SELECT q.* INTO v_quote
  FROM public.quote_acceptances a
  JOIN public.quote_versions q ON q.id = a.quote_version_id
  WHERE a.id = v_order.quote_acceptance_id;

  INSERT INTO public.projects (
    order_id, profile_id, client_id, name, revision_allowance
  ) VALUES (
    p_order_id,
    v_order.profile_id,
    v_opp.client_id,
    v_opp.title,
    coalesce(v_quote.revision_allowance, 3)
  )
  RETURNING id INTO v_project_id;

  FOR v_item IN
    SELECT * FROM (VALUES
      ('accepted_quote', 'Accepted quote', true, 'complete'),
      ('signed_agreement', 'Signed agreement', true, 'not_requested'),
      ('confirmed_deposit', 'Confirmed required deposit', true, 'not_requested'),
      ('primary_contact', 'Primary client contact', true, 'not_requested'),
      ('goals', 'Goals and success criteria', true, 'not_requested'),
      ('brand_assets', 'Logo and brand assets', false, 'not_requested'),
      ('copy_images', 'Website copy and images', false, 'not_requested'),
      ('domain_access', 'Domain and hosting access', false, 'not_requested'),
      ('integration_access', 'Integration access', false, 'not_requested'),
      ('milestones', 'Delivery milestones', true, 'not_requested'),
      ('communication', 'Communication expectations', true, 'not_requested'),
      ('kickoff', 'Kickoff appointment', true, 'not_requested')
    ) AS template(item_key, label, required, state)
  LOOP
    INSERT INTO public.onboarding_items (project_id, item_key, label, required, state, completed_at)
    VALUES (
      v_project_id,
      v_item.item_key,
      v_item.label,
      v_item.required,
      v_item.state,
      CASE WHEN v_item.state = 'complete' THEN now() ELSE NULL END
    );
  END LOOP;

  RETURN v_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_accept_revision(
  p_round_id uuid,
  p_actor text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round public.revision_rounds%ROWTYPE;
  v_project public.projects%ROWTYPE;
BEGIN
  SELECT * INTO v_round FROM public.revision_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Revision round not found';
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = v_round.project_id FOR UPDATE;

  IF v_round.state IN ('accepted', 'in_progress', 'delivered', 'closed') THEN
    RETURN jsonb_build_object('roundsUsed', v_project.rounds_used, 'created', false);
  END IF;

  IF v_round.state NOT IN ('submitted', 'clarification_needed') THEN
    RAISE EXCEPTION 'Only a submitted round can be accepted';
  END IF;

  IF v_round.kind = 'included' AND v_project.rounds_used >= v_project.revision_allowance THEN
    RAISE EXCEPTION 'Included revision rounds are used';
  END IF;

  IF v_round.kind = 'included' THEN
    UPDATE public.projects
    SET rounds_used = rounds_used + 1
    WHERE id = v_project.id;
  END IF;

  UPDATE public.revision_rounds
  SET state = 'accepted',
      consumes_allowance = v_round.kind = 'included',
      updated_at = now()
  WHERE id = p_round_id;

  INSERT INTO public.audit_events (actor, action, entity_type, entity_id, summary)
  VALUES (
    p_actor, 'revision_accepted', 'revision_round', p_round_id::text,
    jsonb_build_object('kind', v_round.kind, 'projectId', v_project.id)
  );

  SELECT rounds_used INTO v_project.rounds_used FROM public.projects WHERE id = v_project.id;
  RETURN jsonb_build_object('roundsUsed', v_project.rounds_used, 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_restore_revision(
  p_round_id uuid,
  p_actor text,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round public.revision_rounds%ROWTYPE;
BEGIN
  IF length(trim(coalesce(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  SELECT * INTO v_round FROM public.revision_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND OR v_round.consumes_allowance = false THEN
    RETURN;
  END IF;

  UPDATE public.projects
  SET rounds_used = greatest(0, rounds_used - 1)
  WHERE id = v_round.project_id;

  UPDATE public.revision_rounds
  SET state = 'withdrawn', consumes_allowance = false, updated_at = now()
  WHERE id = p_round_id;

  INSERT INTO public.audit_events (actor, action, entity_type, entity_id, summary)
  VALUES (
    p_actor, 'revision_restored', 'revision_round', p_round_id::text,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_set_stage(
  p_opportunity_id uuid,
  p_stage text,
  p_actor text,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opp public.opportunities%ROWTYPE;
  v_deposit_required bigint;
  v_deposit_collected bigint;
  v_has_acceptance boolean;
  v_agreement_accepted boolean;
BEGIN
  SELECT * INTO v_opp FROM public.opportunities WHERE id = p_opportunity_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;

  IF p_stage = 'closed_won' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.quote_versions q
      JOIN public.quote_acceptances a ON a.quote_version_id = q.id
      WHERE q.opportunity_id = p_opportunity_id
    ) INTO v_has_acceptance;

    SELECT EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.agreements g ON g.order_id = o.id
      WHERE o.opportunity_id = p_opportunity_id AND g.status = 'accepted'
    ) INTO v_agreement_accepted;

    SELECT coalesce(max(o.deposit_required_cents), 0) INTO v_deposit_required
    FROM public.orders o
    WHERE o.opportunity_id = p_opportunity_id;

    SELECT coalesce(sum(a.amount_cents), 0)::bigint INTO v_deposit_collected
    FROM public.payment_allocations a
    JOIN public.payments p ON p.id = a.payment_id AND p.status = 'succeeded'
    JOIN public.invoices i ON i.id = a.invoice_id AND i.kind = 'deposit'
    JOIN public.orders o ON o.id = i.order_id
    WHERE o.opportunity_id = p_opportunity_id;

    IF NOT v_has_acceptance OR NOT v_agreement_accepted THEN
      RAISE EXCEPTION 'Accepted scope and an accepted agreement are required';
    END IF;
    IF NOT v_opp.no_deposit_exception AND v_deposit_collected < v_deposit_required THEN
      RAISE EXCEPTION 'Required deposit is not confirmed';
    END IF;
  END IF;

  IF v_opp.stage IS DISTINCT FROM p_stage THEN
    INSERT INTO public.opportunity_stage_events (
      opportunity_id, actor, from_stage, to_stage, reason
    ) VALUES (
      p_opportunity_id, p_actor, v_opp.stage, p_stage, coalesce(p_reason, '')
    );
    UPDATE public.opportunities SET stage = p_stage, updated_at = now()
    WHERE id = p_opportunity_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_open_project(uuid) FROM public;
REVOKE ALL ON FUNCTION public.crm_accept_revision(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.crm_restore_revision(uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.crm_set_stage(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.crm_open_project(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_accept_revision(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_restore_revision(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_set_stage(uuid, text, text, text) TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_sends ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.projects,
  public.onboarding_items,
  public.milestones,
  public.revision_rounds,
  public.revision_items,
  public.change_orders,
  public.crm_files,
  public.portal_users,
  public.portal_memberships,
  public.portal_invites,
  public.notification_sends
TO service_role;
