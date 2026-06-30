export type StorageBackend = "supabase" | "redis" | "local";

export function isCloudStorageBackend(backend: StorageBackend): boolean {
  return backend === "supabase" || backend === "redis";
}

export function getStorageBackendLabel(backend: StorageBackend): string {
  switch (backend) {
    case "supabase":
      return "Supabase Postgres";
    case "redis":
      return "Vercel Cloud (Redis)";
    default:
      return "Local file";
  }
}

export function getStorageBackendDescription(backend: StorageBackend): string {
  switch (backend) {
    case "supabase":
      return "Data syncs across devices via Supabase Postgres.";
    case "redis":
      return "Data syncs across devices via Upstash Redis on Vercel.";
    default:
      return "Development mode — data is stored on this machine only.";
  }
}
