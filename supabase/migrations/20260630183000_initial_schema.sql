-- Over Drive OS — initial Postgres schema
-- Mirrors src/lib/storage/dataBins.ts DatabaseSchema for Supabase migration.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

CREATE TYPE public.data_bin_id AS ENUM (
  'clients',
  'documents',
  'quotes',
  'drafts',
  'lineItems',
  'labor',
  'notes'
);

CREATE TYPE public.record_source AS ENUM (
  'invoice-app',
  'admin-demo',
  'sync'
);

-- ---------------------------------------------------------------------------
-- Admin profiles (db.adminProfiles)
-- ---------------------------------------------------------------------------

CREATE TABLE public.admin_profiles (
  id text PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  password_plain text,
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role = 'user'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admin_profiles_username_key ON public.admin_profiles (lower(username));

COMMENT ON COLUMN public.admin_profiles.password_plain IS
  'Optional plaintext copy for master admin visibility; matches legacy JSON store.';

-- ---------------------------------------------------------------------------
-- Master admin account settings (db.masterAccount singleton)
-- ---------------------------------------------------------------------------

CREATE TABLE public.master_account (
  id text PRIMARY KEY DEFAULT 'master' CHECK (id = 'master'),
  display_name text,
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  password_hash text,
  password_plain text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.master_account (id) VALUES ('master');

-- ---------------------------------------------------------------------------
-- Storage records (db.records)
-- ---------------------------------------------------------------------------

CREATE TABLE public.storage_records (
  id text PRIMARY KEY,
  profile_id text NOT NULL DEFAULT 'master',
  bin_id public.data_bin_id NOT NULL,
  label text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source public.record_source NOT NULL DEFAULT 'invoice-app',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX storage_records_profile_bin_idx
  ON public.storage_records (profile_id, bin_id);

CREATE INDEX storage_records_bin_updated_idx
  ON public.storage_records (bin_id, updated_at DESC);

CREATE INDEX storage_records_data_gin_idx
  ON public.storage_records USING gin (data);

-- ---------------------------------------------------------------------------
-- Soft-deleted records (db.deletedRecords)
-- ---------------------------------------------------------------------------

CREATE TABLE public.deleted_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id text NOT NULL,
  profile_id text NOT NULL,
  bin_id public.data_bin_id NOT NULL,
  label text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source public.record_source NOT NULL,
  record_created_at timestamptz NOT NULL,
  record_updated_at timestamptz NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deleted_records_profile_deleted_idx
  ON public.deleted_records (profile_id, deleted_at DESC);

CREATE INDEX deleted_records_record_id_idx
  ON public.deleted_records (record_id);

-- ---------------------------------------------------------------------------
-- App metadata (db.version, db.lastSyncedAt)
-- ---------------------------------------------------------------------------

CREATE TABLE public.app_state (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  version integer NOT NULL DEFAULT 1,
  last_synced_at timestamptz
);

INSERT INTO public.app_state (id, version) VALUES ('default', 1);

-- ---------------------------------------------------------------------------
-- updated_at trigger for storage_records
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER storage_records_set_updated_at
  BEFORE UPDATE ON public.storage_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER master_account_set_updated_at
  BEFORE UPDATE ON public.master_account
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (API uses service role; block direct client access)
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
