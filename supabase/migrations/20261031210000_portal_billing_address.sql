ALTER TABLE public.portal_users
  ADD COLUMN IF NOT EXISTS billing_address_line1 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_address_line2 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_state text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_postal_code text NOT NULL DEFAULT '';
