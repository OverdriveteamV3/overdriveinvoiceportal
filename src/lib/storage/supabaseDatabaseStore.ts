import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StoredMasterAccount } from "@/lib/admin-account";
import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import type { StoredAdminProfile } from "@/lib/admin-profiles";
import type { DatabaseSchema, DeletedRecord, StoredRecord } from "./dataBins";
import { DB_VERSION } from "./dataBins";

type StorageRecordRow = {
  id: string;
  profile_id: string;
  bin_id: StoredRecord["binId"];
  label: string;
  data: Record<string, unknown>;
  source: StoredRecord["source"];
  created_at: string;
  updated_at: string;
};

type AdminProfileRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  password_plain: string | null;
  email: string;
  website: string;
  logo: string;
  role: string;
  created_at: string;
};

type MasterAccountRow = {
  id: string;
  display_name: string | null;
  email: string;
  website: string;
  logo: string;
  password_hash: string | null;
  password_plain: string | null;
  updated_at: string;
};

type DeletedRecordRow = {
  record_id: string;
  profile_id: string;
  bin_id: StoredRecord["binId"];
  label: string;
  data: Record<string, unknown>;
  source: StoredRecord["source"];
  record_created_at: string;
  record_updated_at: string;
  deleted_at: string;
};

type AppStateRow = {
  id: string;
  version: number;
  last_synced_at: string | null;
};

const UPSERT_BATCH_SIZE = 400;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function getSupabaseUrl(): string | null {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    null
  );
}

function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function useSupabaseStorage(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!useSupabaseStorage()) return null;

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}

function recordToRow(record: StoredRecord): StorageRecordRow {
  return {
    id: record.id,
    profile_id: record.profileId ?? MASTER_PROFILE_ID,
    bin_id: record.binId,
    label: record.label,
    data: record.data,
    source: record.source,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function rowToRecord(row: StorageRecordRow): StoredRecord {
  return {
    id: row.id,
    profileId: row.profile_id,
    binId: row.bin_id,
    label: row.label,
    data: row.data ?? {},
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function profileToRow(profile: StoredAdminProfile): AdminProfileRow {
  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.displayName,
    password_hash: profile.passwordHash,
    password_plain: profile.password ?? null,
    email: profile.email ?? "",
    website: profile.website ?? "",
    logo: profile.logo ?? "",
    role: profile.role,
    created_at: profile.createdAt,
  };
}

function rowToProfile(row: AdminProfileRow): StoredAdminProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    password: row.password_plain ?? undefined,
    email: row.email,
    website: row.website,
    logo: row.logo,
    role: "user",
    createdAt: row.created_at,
  };
}

function rowToMasterAccount(row: MasterAccountRow | null): StoredMasterAccount | undefined {
  if (!row) return undefined;

  return {
    displayName: row.display_name ?? undefined,
    email: row.email,
    website: row.website,
    logo: row.logo,
    passwordHash: row.password_hash ?? undefined,
    password: row.password_plain ?? undefined,
  };
}

function deletedToRow(entry: DeletedRecord): DeletedRecordRow {
  const record = entry.record;
  return {
    record_id: record.id,
    profile_id: record.profileId ?? MASTER_PROFILE_ID,
    bin_id: record.binId,
    label: record.label,
    data: record.data,
    source: record.source,
    record_created_at: record.createdAt,
    record_updated_at: record.updatedAt,
    deleted_at: entry.deletedAt,
  };
}

function rowToDeleted(entry: DeletedRecordRow): DeletedRecord {
  return {
    record: {
      id: entry.record_id,
      profileId: entry.profile_id,
      binId: entry.bin_id,
      label: entry.label,
      data: entry.data ?? {},
      source: entry.source,
      createdAt: entry.record_created_at,
      updatedAt: entry.record_updated_at,
    },
    deletedAt: entry.deleted_at,
  };
}

async function upsertBatches(
  supabase: SupabaseClient,
  table: "admin_profiles",
  rows: AdminProfileRow[]
): Promise<void> {
  for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Supabase upsert failed for ${table}: ${error.message}`);
    }
  }
}

async function deleteMissingIds(
  supabase: SupabaseClient,
  table: "storage_records" | "admin_profiles",
  keepIds: string[]
): Promise<void> {
  const { data, error } = await supabase.from(table).select("id");
  if (error) {
    throw new Error(`Supabase select failed for ${table}: ${error.message}`);
  }

  const keep = new Set(keepIds);
  const deleteIds = (data ?? [])
    .map((row) => String((row as { id: string }).id))
    .filter((id) => !keep.has(id));

  for (const batch of chunk(deleteIds, UPSERT_BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const { error: deleteError } = await supabase.from(table).delete().in("id", batch);
    if (deleteError) {
      throw new Error(`Supabase delete failed for ${table}: ${deleteError.message}`);
    }
  }
}

async function replaceDeletedRecords(
  supabase: SupabaseClient,
  deletedRecords: DeletedRecord[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("deleted_records")
    .delete()
    .not("record_id", "is", null);

  if (deleteError) {
    throw new Error(`Supabase delete failed for deleted_records: ${deleteError.message}`);
  }

  const rows = deletedRecords.map(deletedToRow);
  for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const { error } = await supabase.from("deleted_records").insert(batch);
    if (error) {
      throw new Error(`Supabase insert failed for deleted_records: ${error.message}`);
    }
  }
}

export async function loadFromSupabase(): Promise<DatabaseSchema> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [
    recordsResult,
    deletedResult,
    profilesResult,
    masterResult,
    stateResult,
  ] = await Promise.all([
    supabase.from("storage_records").select("*"),
    supabase.from("deleted_records").select("*").order("deleted_at", {
      ascending: false,
    }),
    supabase.from("admin_profiles").select("*").order("created_at", {
      ascending: true,
    }),
    supabase.from("master_account").select("*").eq("id", "master").maybeSingle(),
    supabase.from("app_state").select("*").eq("id", "default").maybeSingle(),
  ]);

  if (recordsResult.error) {
    throw new Error(`Failed to load storage_records: ${recordsResult.error.message}`);
  }
  if (deletedResult.error) {
    throw new Error(`Failed to load deleted_records: ${deletedResult.error.message}`);
  }
  if (profilesResult.error) {
    throw new Error(`Failed to load admin_profiles: ${profilesResult.error.message}`);
  }
  if (masterResult.error) {
    throw new Error(`Failed to load master_account: ${masterResult.error.message}`);
  }
  if (stateResult.error) {
    throw new Error(`Failed to load app_state: ${stateResult.error.message}`);
  }

  const state = stateResult.data as AppStateRow | null;

  return {
    version: state?.version ?? DB_VERSION,
    records: ((recordsResult.data ?? []) as StorageRecordRow[]).map(rowToRecord),
    deletedRecords: ((deletedResult.data ?? []) as DeletedRecordRow[]).map(
      rowToDeleted
    ),
    adminProfiles: ((profilesResult.data ?? []) as AdminProfileRow[]).map(
      rowToProfile
    ),
    masterAccount: rowToMasterAccount(
      (masterResult.data as MasterAccountRow | null) ?? null
    ),
    lastSyncedAt: state?.last_synced_at ?? null,
  };
}

export async function saveToSupabase(db: DatabaseSchema): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const recordRows = db.records.map(recordToRow);
  for (const batch of chunk(recordRows, UPSERT_BATCH_SIZE)) {
    if (batch.length === 0) continue;
    const { error } = await supabase
      .from("storage_records")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Failed to save storage_records: ${error.message}`);
    }
  }
  await deleteMissingIds(
    supabase,
    "storage_records",
    db.records.map((record) => record.id)
  );

  await replaceDeletedRecords(supabase, db.deletedRecords);

  const profileRows = (db.adminProfiles ?? []).map(profileToRow);
  if (profileRows.length > 0) {
    await upsertBatches(supabase, "admin_profiles", profileRows);
  }
  await deleteMissingIds(
    supabase,
    "admin_profiles",
    (db.adminProfiles ?? []).map((profile) => profile.id)
  );

  const master = db.masterAccount ?? {};
  const { error: masterError } = await supabase.from("master_account").upsert(
    {
      id: "master",
      display_name: master.displayName ?? null,
      email: master.email ?? "",
      website: master.website ?? "",
      logo: master.logo ?? "",
      password_hash: master.passwordHash ?? null,
      password_plain: master.password ?? null,
    },
    { onConflict: "id" }
  );
  if (masterError) {
    throw new Error(`Failed to save master_account: ${masterError.message}`);
  }

  const { error: stateError } = await supabase.from("app_state").upsert(
    {
      id: "default",
      version: db.version ?? DB_VERSION,
      last_synced_at: db.lastSyncedAt,
    },
    { onConflict: "id" }
  );
  if (stateError) {
    throw new Error(`Failed to save app_state: ${stateError.message}`);
  }
}

export function isSupabaseCloudBackend(): boolean {
  return useSupabaseStorage();
}
