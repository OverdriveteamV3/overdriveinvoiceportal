-- Public client accounts. Invite-only portal users keep a null password until they set one.

ALTER TABLE public.portal_users
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS password_hash text;
