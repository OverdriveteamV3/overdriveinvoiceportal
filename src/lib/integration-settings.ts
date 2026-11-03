import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import { getStorageBackend } from "@/lib/storage/databaseStore";
import { deleteRecord, getRecordById, upsertRecord } from "@/lib/storage/internalDatabase";
import {
  getStorageBackendLabel,
  isCloudStorageBackend,
  type StorageBackend,
} from "@/lib/storage/storageBackend";

const KIND = "integration-settings";

export type IntegrationService = "storage" | "email" | "sms" | "stripe";

type StoredEmail = {
  cleared: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
};

type StoredSms = {
  cleared: boolean;
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

type StoredStripe = {
  cleared: boolean;
  secretKey: string;
};

type StoredIntegrations = {
  storage?: { cleared: boolean };
  email?: StoredEmail;
  sms?: StoredSms;
  stripe?: StoredStripe;
};

export type IntegrationPublicView = {
  storage: {
    connected: boolean;
    cleared: boolean;
    backend: StorageBackend;
    label: string;
  };
  email: {
    connected: boolean;
    cleared: boolean;
    host: string;
    port: string;
    secure: boolean;
    user: string;
    hasPassword: boolean;
    provider: string;
  };
  sms: {
    connected: boolean;
    cleared: boolean;
    accountSid: string;
    fromNumber: string;
    hasToken: boolean;
  };
  stripe: {
    connected: boolean;
    cleared: boolean;
    hasKey: boolean;
  };
};

function recordId() {
  return `integration-settings-${MASTER_PROFILE_ID}`;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function readStored(): Promise<StoredIntegrations> {
  const record = await getRecordById({ profileId: MASTER_PROFILE_ID }, recordId());
  if (!record || record.data.kind !== KIND) return {};
  const data = record.data;
  return {
    storage:
      data.storage && typeof data.storage === "object"
        ? { cleared: Boolean((data.storage as { cleared?: boolean }).cleared) }
        : undefined,
    email: readEmail(data.email),
    sms: readSms(data.sms),
    stripe: readStripe(data.stripe),
  };
}

function readEmail(value: unknown): StoredEmail | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<StoredEmail>;
  return {
    cleared: Boolean(row.cleared),
    host: text(row.host),
    port: text(row.port),
    secure: Boolean(row.secure),
    user: text(row.user),
    pass: text(row.pass),
  };
}

function readSms(value: unknown): StoredSms | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<StoredSms>;
  return {
    cleared: Boolean(row.cleared),
    accountSid: text(row.accountSid),
    authToken: text(row.authToken),
    fromNumber: text(row.fromNumber),
  };
}

function readStripe(value: unknown): StoredStripe | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<StoredStripe>;
  return {
    cleared: Boolean(row.cleared),
    secretKey: text(row.secretKey),
  };
}

async function writeStored(next: StoredIntegrations): Promise<void> {
  await upsertRecord(
    { profileId: MASTER_PROFILE_ID },
    {
      id: recordId(),
      binId: "notes",
      label: "Integration settings",
      source: "admin-demo",
      data: { kind: KIND, ...next },
    }
  );
}

export async function resolveSmtpConfig(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
} | null> {
  const stored = await readStored();
  if (stored.email?.cleared) return null;
  if (stored.email?.host && stored.email.user && stored.email.pass) {
    return {
      host: stored.email.host,
      port: Number(stored.email.port || 587),
      secure: stored.email.secure,
      user: stored.email.user,
      pass: stored.email.pass,
    };
  }
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
  };
}

export async function resendEmailAllowed(): Promise<boolean> {
  const stored = await readStored();
  if (stored.email?.cleared) return false;
  if (stored.email?.host) return false;
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function resolveTwilioConfig(): Promise<{
  accountSid: string;
  authToken: string;
  fromNumber: string;
} | null> {
  const stored = await readStored();
  if (stored.sms?.cleared) return null;
  if (stored.sms?.accountSid && stored.sms.authToken && stored.sms.fromNumber) {
    return {
      accountSid: stored.sms.accountSid,
      authToken: stored.sms.authToken,
      fromNumber: stored.sms.fromNumber,
    };
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim() ?? "";
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export async function resolveStripeSecret(): Promise<string | null> {
  const stored = await readStored();
  if (stored.stripe?.cleared) return null;
  if (stored.stripe?.secretKey) return stored.stripe.secretKey;
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export async function getIntegrationPublicView(): Promise<IntegrationPublicView> {
  const stored = await readStored();
  const smtp = await resolveSmtpConfig();
  const resend = await resendEmailAllowed();
  const twilio = await resolveTwilioConfig();
  const stripeKey = await resolveStripeSecret();
  const backend = getStorageBackend();
  const storageCleared = Boolean(stored.storage?.cleared);

  const emailCleared = Boolean(stored.email?.cleared);
  const emailHost = emailCleared ? "" : stored.email?.host || process.env.SMTP_HOST?.trim() || "";
  const emailUser = emailCleared ? "" : stored.email?.user || process.env.SMTP_USER?.trim() || "";
  const emailPort = emailCleared ? "" : stored.email?.port || process.env.SMTP_PORT?.trim() || "";
  const emailSecure = emailCleared
    ? false
    : stored.email
      ? stored.email.secure
      : process.env.SMTP_SECURE === "true";

  const smsCleared = Boolean(stored.sms?.cleared);
  const stripeCleared = Boolean(stored.stripe?.cleared);

  return {
    storage: {
      connected: !storageCleared && isCloudStorageBackend(backend),
      cleared: storageCleared,
      backend,
      label: storageCleared ? "Not set up" : getStorageBackendLabel(backend),
    },
    email: {
      connected: Boolean(smtp) || resend,
      cleared: emailCleared,
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      user: emailUser,
      hasPassword: Boolean(smtp),
      provider: emailCleared ? "" : smtp ? "SMTP" : resend ? "Resend" : "",
    },
    sms: {
      connected: Boolean(twilio),
      cleared: smsCleared,
      accountSid: smsCleared ? "" : stored.sms?.accountSid || process.env.TWILIO_ACCOUNT_SID?.trim() || "",
      fromNumber: smsCleared ? "" : stored.sms?.fromNumber || process.env.TWILIO_PHONE_NUMBER?.trim() || "",
      hasToken: Boolean(twilio),
    },
    stripe: {
      connected: Boolean(stripeKey),
      cleared: stripeCleared,
      hasKey: Boolean(stripeKey),
    },
  };
}

export async function saveIntegrationService(
  service: IntegrationService,
  input: Record<string, unknown>
): Promise<void> {
  const stored = await readStored();
  if (service === "storage") return;

  if (service === "email") {
    const host = text(input.host);
    const user = text(input.user);
    const pass =
      text(input.pass) ||
      (stored.email?.cleared ? "" : stored.email?.pass || process.env.SMTP_PASS?.trim() || "");
    if (!host || !user || !pass) {
      throw new Error("Host, username, and password are required.");
    }
    stored.email = {
      cleared: false,
      host,
      port: text(input.port) || "465",
      secure: input.secure !== false && String(input.secure) !== "false",
      user,
      pass,
    };
  }

  if (service === "sms") {
    const accountSid = text(input.accountSid);
    const fromNumber = text(input.fromNumber);
    const authToken =
      text(input.authToken) ||
      (stored.sms?.cleared ? "" : stored.sms?.authToken || process.env.TWILIO_AUTH_TOKEN?.trim() || "");
    if (!accountSid || !fromNumber || !authToken) {
      throw new Error("Account SID, auth token, and from number are required.");
    }
    stored.sms = { cleared: false, accountSid, authToken, fromNumber };
  }

  if (service === "stripe") {
    const secretKey =
      text(input.secretKey) ||
      (stored.stripe?.cleared ? "" : stored.stripe?.secretKey || process.env.STRIPE_SECRET_KEY?.trim() || "");
    if (!secretKey) {
      throw new Error("A Stripe secret key is required.");
    }
    stored.stripe = {
      cleared: false,
      secretKey,
    };
  }

  await writeStored(stored);
}

export async function removeIntegrationService(service: IntegrationService): Promise<void> {
  const stored = await readStored();
  if (service === "storage") stored.storage = { cleared: true };
  if (service === "email") {
    stored.email = { cleared: true, host: "", port: "", secure: false, user: "", pass: "" };
  }
  if (service === "sms") {
    stored.sms = { cleared: true, accountSid: "", authToken: "", fromNumber: "" };
  }
  if (service === "stripe") stored.stripe = { cleared: true, secretKey: "" };
  const stillUsed =
    stored.storage?.cleared ||
    stored.email ||
    stored.sms ||
    stored.stripe;
  if (!stillUsed) {
    await deleteRecord({ profileId: MASTER_PROFILE_ID }, recordId());
    return;
  }
  await writeStored(stored);
}
