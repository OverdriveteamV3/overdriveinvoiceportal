-- Google profile photo for portal accounts.

ALTER TABLE public.portal_users
  ADD COLUMN IF NOT EXISTS avatar_url text;
