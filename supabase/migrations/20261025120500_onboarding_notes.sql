ALTER TABLE public.onboarding_items
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
