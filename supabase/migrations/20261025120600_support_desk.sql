-- Customer support desk. Additive. Existing rows are not modified.

CREATE TABLE IF NOT EXISTS public.support_desk (
  id text PRIMARY KEY,
  online boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.support_desk (id, online)
VALUES ('default', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  opportunity_id uuid REFERENCES public.opportunities (id) ON DELETE SET NULL,
  admin_unread boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads (id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('visitor', 'admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_messages_thread_idx
  ON public.support_messages (thread_id, created_at);

CREATE INDEX IF NOT EXISTS support_threads_updated_idx
  ON public.support_threads (updated_at DESC);

ALTER TABLE public.support_desk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.support_desk,
  public.support_threads,
  public.support_messages
TO service_role;
