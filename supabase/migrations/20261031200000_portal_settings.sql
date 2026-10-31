-- Client portal settings: profile, contact, preferences, and billing details.
-- Login secrets stay in existing columns. These fields are written only by the service role
-- after the portal session is checked.

ALTER TABLE public.portal_users
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_bytes bytea,
  ADD COLUMN IF NOT EXISTS avatar_content_type text,
  ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pending_email text,
  ADD COLUMN IF NOT EXISTS secondary_email text,
  ADD COLUMN IF NOT EXISTS secondary_email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS billing_contact_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_business_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

ALTER TABLE public.portal_users
  DROP CONSTRAINT IF EXISTS portal_users_avatar_size_check;

ALTER TABLE public.portal_users
  ADD CONSTRAINT portal_users_avatar_size_check
  CHECK (avatar_bytes IS NULL OR octet_length(avatar_bytes) <= 2000000);
