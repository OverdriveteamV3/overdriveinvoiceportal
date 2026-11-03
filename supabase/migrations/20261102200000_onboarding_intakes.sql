-- Draft quote onboarding. The master-admin lead is created only after Finish.

CREATE TABLE IF NOT EXISTS public.onboarding_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature_name text NOT NULL DEFAULT '',
  signature_accepted_at timestamptz,
  signature_ip text NOT NULL DEFAULT '',
  stack jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_provider text NOT NULL DEFAULT '',
  payment_id text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT '',
  opportunity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_intakes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.onboarding_intakes TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-uploads', 'onboarding-uploads', false)
ON CONFLICT (id) DO NOTHING;
