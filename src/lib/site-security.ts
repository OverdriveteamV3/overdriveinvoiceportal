import { unstable_noStore as noStore } from "next/cache";
import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import { getMasterPasswordHash } from "@/lib/admin-account";
import { listAdminProfileSummaries } from "@/lib/admin-profiles";
import { getIntegrationPublicView } from "@/lib/integration-settings";
import { getRecordById, upsertRecord } from "@/lib/storage/internalDatabase";

const KIND = "site-security";

export type SecuritySuggestion = {
  title: string;
  detail: string;
  tone: "good" | "attention";
};

function recordId() {
  return `site-security-${MASTER_PROFILE_ID}`;
}

export async function isSiteMaintenanceOn(): Promise<boolean> {
  noStore();
  const record = await getRecordById({ profileId: MASTER_PROFILE_ID }, recordId());
  return record?.data.kind === KIND && record.data.maintenance === true;
}

export async function setSiteMaintenance(enabled: boolean): Promise<void> {
  await upsertRecord(
    { profileId: MASTER_PROFILE_ID },
    {
      id: recordId(),
      binId: "notes",
      label: "Site security",
      source: "admin-demo",
      data: { kind: KIND, maintenance: enabled },
    }
  );
}

export async function getSecurityOverview(): Promise<{
  maintenance: boolean;
  suggestions: SecuritySuggestion[];
}> {
  const [maintenance, integrations, passwordHash, profiles] = await Promise.all([
    isSiteMaintenanceOn(),
    getIntegrationPublicView(),
    getMasterPasswordHash(),
    listAdminProfileSummaries(),
  ]);

  const teamCount = profiles.length;
  const suggestions: SecuritySuggestion[] = [
    passwordHash
      ? {
          title: "Master password is saved in the dashboard",
          detail: "Change it from Profile if anyone else has used it.",
          tone: "good",
        }
      : {
          title: "Set a unique master password",
          detail:
            "Sign-in still uses the environment password. Save a new one under Profile.",
          tone: "attention",
        },
    integrations.email.connected
      ? {
          title: "Invoice email is connected",
          detail: "Quotes and invoices can send from the connected mailbox.",
          tone: "good",
        }
      : {
          title: "Connect invoice email",
          detail: "The live site cannot send quotes until email is connected.",
          tone: "attention",
        },
    integrations.stripe.connected
      ? {
          title: "Card payments are connected",
          detail: "Stripe is available for deposits and invoices.",
          tone: "good",
        }
      : {
          title: "Connect Stripe before taking payments",
          detail: "Public deposits stay blocked until a Stripe key is saved.",
          tone: "attention",
        },
    integrations.storage.connected
      ? {
          title: "Records are on cloud storage",
          detail: "Dashboard data is stored off this computer.",
          tone: "good",
        }
      : {
          title: "Move records to cloud storage",
          detail: "Local storage can be lost if this computer is reset.",
          tone: "attention",
        },
    teamCount > 0
      ? {
          title: "Review team seats",
          detail: `${teamCount} dashboard ${teamCount === 1 ? "user has" : "users have"} a sign-in besides the master account. Remove anyone who should not open settings.`,
          tone: "attention",
        }
      : {
          title: "Only the master account can sign in",
          detail: "No extra dashboard users are stored.",
          tone: "good",
        },
    {
      title: "Sign out on shared computers",
      detail: "Dashboard access stays open in this browser until you sign out.",
      tone: "attention",
    },
    {
      title: "Keep payment and mail secrets out of documents",
      detail:
        "SMTP, Stripe, and Twilio values belong in settings. Do not paste them into invoices, chats, or client forms.",
      tone: "attention",
    },
  ];

  return { maintenance, suggestions };
}
