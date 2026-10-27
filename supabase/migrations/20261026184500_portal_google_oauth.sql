-- Google OAuth subjects for public client portal accounts.

ALTER TABLE public.portal_users
  ADD COLUMN IF NOT EXISTS google_sub text,
  ADD COLUMN IF NOT EXISTS auth_provider text;

CREATE UNIQUE INDEX IF NOT EXISTS portal_users_google_sub_key
  ON public.portal_users (google_sub)
  WHERE google_sub IS NOT NULL;
