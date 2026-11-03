import { unstable_noStore as noStore } from "next/cache";
import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import { getRecordById, upsertRecord } from "@/lib/storage/internalDatabase";

const KIND = "site-security";
export const DEFAULT_MAINTENANCE_EMAIL = "admin@overdriveio.com";
export const DEFAULT_MAINTENANCE_MESSAGE =
  "The Over Drive IO website is under maintenance.\nIf you need to get in touch with us, email us or select the customer service chat at the bottom right of your screen.";

type MaintenanceSettings = {
  maintenance: boolean;
  email: string;
  message: string;
};

function recordId() {
  return `site-security-${MASTER_PROFILE_ID}`;
}

function contactEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim() : "";
  return email.includes("@") && !email.includes(" ") ? email : DEFAULT_MAINTENANCE_EMAIL;
}

function contactMessage(value: unknown): string {
  const message = typeof value === "string" ? value.trim() : "";
  return message ? message.slice(0, 1000) : DEFAULT_MAINTENANCE_MESSAGE;
}

async function readSettings(): Promise<MaintenanceSettings> {
  noStore();
  const record = await getRecordById({ profileId: MASTER_PROFILE_ID }, recordId());
  if (!record || record.data.kind !== KIND) {
    return { maintenance: false, email: DEFAULT_MAINTENANCE_EMAIL, message: DEFAULT_MAINTENANCE_MESSAGE };
  }
  return {
    maintenance: record.data.maintenance === true,
    email: contactEmail(record.data.email),
    message: contactMessage(record.data.message),
  };
}

async function writeSettings(next: MaintenanceSettings): Promise<void> {
  await upsertRecord(
    { profileId: MASTER_PROFILE_ID },
    {
      id: recordId(),
      binId: "notes",
      label: "Site security",
      source: "admin-demo",
      data: {
        kind: KIND,
        maintenance: next.maintenance,
        email: next.email,
        message: next.message,
      },
    }
  );
}

export async function isSiteMaintenanceOn(): Promise<boolean> {
  return (await readSettings()).maintenance;
}

export async function getMaintenanceContactEmail(): Promise<string> {
  return (await readSettings()).email;
}

export async function setSiteMaintenance(enabled: boolean): Promise<void> {
  const current = await readSettings();
  await writeSettings({ ...current, maintenance: enabled });
}

export async function setMaintenanceMessage(message: string): Promise<void> {
  const next = message.trim().slice(0, 1000);
  if (!next) throw new Error("Enter a maintenance message.");
  const current = await readSettings();
  await writeSettings({ ...current, message: next });
}

export async function setMaintenanceContactEmail(email: string): Promise<void> {
  const next = email.trim().slice(0, 200);
  if (!next.includes("@") || next.includes(" ")) {
    throw new Error("Enter a valid email address.");
  }
  const current = await readSettings();
  await writeSettings({ ...current, email: next });
}

export async function getSecurityOverview(): Promise<MaintenanceSettings> {
  return readSettings();
}
