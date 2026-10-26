-- CRM foundation. Additive. Existing storage_records rows are not modified.

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id text NOT NULL DEFAULT 'master',
  display_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  legacy_record_id text,
  possible_duplicate_of uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX clients_legacy_record_id_key
  ON public.clients (legacy_record_id)
  WHERE legacy_record_id IS NOT NULL;

CREATE INDEX clients_profile_idx ON public.clients (profile_id);

CREATE TABLE public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX client_contacts_email_per_client
  ON public.client_contacts (client_id, lower(email))
  WHERE email <> '';

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  profile_id text NOT NULL DEFAULT 'master',
  title text NOT NULL,
  service_interest text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN (
      'website', 'phone', 'referral', 'email', 'social', 'existing_client', 'manual'
    )),
  landing_page text NOT NULL DEFAULT '',
  campaign text NOT NULL DEFAULT '',
  preferred_contact text NOT NULL DEFAULT '',
  budget_range text NOT NULL DEFAULT '',
  desired_timeline text NOT NULL DEFAULT '',
  owner_profile_id text NOT NULL DEFAULT 'master',
  stage text NOT NULL DEFAULT 'new_lead'
    CHECK (stage IN (
      'new_lead',
      'qualification',
      'discovery',
      'quote_preparation',
      'quote_sent',
      'negotiation',
      'accepted_pending',
      'closed_won',
      'closed_lost'
    )),
  next_action text NOT NULL DEFAULT '',
  follow_up_on date,
  estimated_value_cents bigint NOT NULL DEFAULT 0 CHECK (estimated_value_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  archived_at timestamptz,
  archive_reason text NOT NULL DEFAULT '',
  no_deposit_exception boolean NOT NULL DEFAULT false,
  no_deposit_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX opportunities_profile_stage_idx
  ON public.opportunities (profile_id, stage);

CREATE TABLE public.opportunity_stage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
  actor text NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX opportunity_stage_events_opp_idx
  ON public.opportunity_stage_events (opportunity_id, created_at);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.opportunities (id) ON DELETE CASCADE,
  project_id uuid,
  profile_id text NOT NULL DEFAULT 'master',
  kind text NOT NULL CHECK (kind IN ('note', 'call', 'email', 'task')),
  body text NOT NULL DEFAULT '',
  due_on date,
  assignee_profile_id text,
  completed_at timestamptz,
  client_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_profile_due_idx ON public.activities (profile_id, due_on);

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_entity_idx
  ON public.audit_events (entity_type, entity_id, created_at);

CREATE TABLE public.lead_intake_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  ip_address text NOT NULL DEFAULT '',
  opportunity_id uuid REFERENCES public.opportunities (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_intake_requests_ip_idx
  ON public.lead_intake_requests (ip_address, created_at);

CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER opportunities_set_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_stage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_intake_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.clients,
  public.client_contacts,
  public.opportunities,
  public.opportunity_stage_events,
  public.activities,
  public.audit_events,
  public.lead_intake_requests
TO service_role;
