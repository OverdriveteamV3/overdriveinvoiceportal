-- The app reads and writes these tables with the service role key.
-- RLS stays enabled with no client policies, so anon and authenticated remain blocked.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.admin_profiles,
  public.master_account,
  public.storage_records,
  public.deleted_records,
  public.app_state
TO service_role;
