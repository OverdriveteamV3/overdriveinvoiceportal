"use server";

import { revalidatePath } from "next/cache";
import { crmClient } from "@/lib/crm/db";
import { inspectPortalAvatar } from "@/lib/crm/portal-avatar";
import { formatClientAddress } from "@/lib/client-form";
import { isUsState } from "@/lib/us-states";
import {
  changePortalPassword,
  getPortalAccount,
  removeSecondaryEmail,
  requestPortalDeletion,
  requestPortalEmailChange,
  requestSecondaryEmail,
} from "@/lib/crm/portal-account";
import { getPortalUserId } from "@/lib/crm/portal-session";
import { parsePortalPreferences, type PortalPreferences } from "@/lib/crm/portal-preferences";

export type SettingsResult = { error: string };

function refresh() {
  revalidatePath("/portal");
  revalidatePath("/portal/settings");
}

async function requireUserId(): Promise<string | SettingsResult> {
  const userId = await getPortalUserId();
  if (!userId) return { error: "Sign in required." };
  return userId;
}

export async function savePortalProfile(input: {
  name: string;
  businessName: string;
  phone: string;
}): Promise<SettingsResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  const name = input.name.trim().slice(0, 100);
  const businessName = input.businessName.trim().slice(0, 160);
  const phone = input.phone.trim().slice(0, 40);
  if (!name) return { error: "Add your name." };
  if (phone && !/^[0-9+().\-\s]{6,40}$/.test(phone)) {
    return { error: "Enter a valid phone number." };
  }

  const { error } = await crmClient()
    .from("portal_users")
    .update({ name, business_name: businessName, phone })
    .eq("id", userId);
  if (error) return { error: "Could not save your profile." };
  refresh();
  return { error: "" };
}

export async function savePortalAvatar(formData: FormData): Promise<SettingsResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  if (formData.get("remove") === "1") {
    const { error } = await crmClient()
      .from("portal_users")
      .update({
        avatar_bytes: null,
        avatar_content_type: null,
        avatar_updated_at: null,
        avatar_url: null,
      })
      .eq("id", userId);
    if (error) return { error: "Could not remove your photo." };
    refresh();
    return { error: "" };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = inspectPortalAvatar(bytes);
  if (!type) return { error: "Use a JPG, PNG, or WebP under 2 MB." };

  const { error } = await crmClient()
    .from("portal_users")
    .update({
      avatar_bytes: `\\x${Buffer.from(bytes).toString("hex")}`,
      avatar_content_type: type,
      avatar_updated_at: new Date().toISOString(),
      avatar_url: null,
    })
    .eq("id", userId);
  if (error) return { error: "Could not save your photo." };
  refresh();
  return { error: "" };
}

export async function saveEmailChange(input: {
  email: string;
  currentPassword: string;
}): Promise<SettingsResult> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  if (!account.hasPassword) return { error: "This account signs in with Google." };
  const result = await requestPortalEmailChange({
    userId: account.id,
    currentPassword: input.currentPassword,
    nextEmail: input.email,
    name: account.name,
  });
  if ("error" in result) return result;
  refresh();
  return { error: "" };
}

export async function saveSecondaryEmail(input: { email: string }): Promise<SettingsResult> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  const result = await requestSecondaryEmail({
    userId: account.id,
    email: input.email,
    name: account.name,
  });
  if ("error" in result) return result;
  refresh();
  return { error: "" };
}

export async function clearSecondaryEmail(): Promise<SettingsResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  const result = await removeSecondaryEmail(userId);
  if ("error" in result) return result;
  refresh();
  return { error: "" };
}

export async function savePasswordChange(input: {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
}): Promise<SettingsResult> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  if (!account.hasPassword) return { error: "This account signs in with Google." };
  if (input.nextPassword !== input.confirmPassword) {
    return { error: "Passwords do not match." };
  }
  const result = await changePortalPassword({
    userId: account.id,
    currentPassword: input.currentPassword,
    nextPassword: input.nextPassword,
  });
  if ("error" in result) return result;
  refresh();
  return { error: "" };
}

export async function savePortalPreferences(
  input: PortalPreferences
): Promise<SettingsResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  const preferences = parsePortalPreferences({
    notifyProjectStatus: Boolean(input.notifyProjectStatus),
    notifyInvoiceReminders: Boolean(input.notifyInvoiceReminders),
  });
  const { error } = await crmClient()
    .from("portal_users")
    .update({ preferences })
    .eq("id", userId);
  if (error) return { error: "Could not save your preferences." };
  refresh();
  return { error: "" };
}

export async function savePortalBilling(input: {
  contactName: string;
  businessName: string;
  email: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}): Promise<SettingsResult> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  const email = input.email.trim().toLowerCase().slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid billing email." };
  }
  const state = input.state.trim().toUpperCase().slice(0, 2);
  if (state && !isUsState(state)) return { error: "Choose a state." };
  const postalCode = input.postalCode.trim().slice(0, 12);
  if (postalCode && !/^[A-Za-z0-9 -]{3,12}$/.test(postalCode)) {
    return { error: "Enter a valid postal code." };
  }
  const addressLine1 = input.addressLine1.trim().slice(0, 120);
  const addressLine2 = input.addressLine2.trim().slice(0, 120);
  const city = input.city.trim().slice(0, 80);
  const address = formatClientAddress({
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode: postalCode,
  }).slice(0, 300);
  const { error } = await crmClient()
    .from("portal_users")
    .update({
      billing_contact_name: input.contactName.trim().slice(0, 120),
      billing_business_name: input.businessName.trim().slice(0, 160),
      billing_email: email,
      billing_country: input.country.trim().slice(0, 80),
      billing_address: address,
      billing_address_line1: addressLine1,
      billing_address_line2: addressLine2,
      billing_city: city,
      billing_state: state,
      billing_postal_code: postalCode,
    })
    .eq("id", userId);
  if (error) return { error: "Could not save billing details." };
  refresh();
  return { error: "" };
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function exportPortalRosterCsv(): Promise<{ error: string; csv?: string }> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  const lines = ["category,name,detail,status"];
  if (!account.clientId) return { error: "", csv: `${lines.join("\n")}\n` };
  const supabase = crmClient();
  const { data: opportunities, error: opportunityError } = await supabase
    .from("opportunities")
    .select("title, stage")
    .eq("client_id", account.clientId);
  if (opportunityError) return { error: "Could not export this account." };
  for (const row of opportunities ?? []) {
    lines.push(["job", row.title, "", row.stage].map(csvCell).join(","));
  }
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("name, stage, order_id")
    .eq("client_id", account.clientId);
  if (projectError) return { error: "Could not export this account." };
  const orderIds = (projects ?? []).map((row) => String(row.order_id ?? "")).filter(Boolean);
  for (const row of projects ?? []) {
    lines.push(["project", row.name, "", row.stage].map(csvCell).join(","));
  }
  if (orderIds.length > 0) {
    const { data: invoices, error: invoiceError } = await supabase
      .from("invoices")
      .select("document_number, kind, status, total_cents")
      .in("order_id", orderIds);
    if (invoiceError) return { error: "Could not export this account." };
    for (const row of invoices ?? []) {
      lines.push(
        ["invoice", row.document_number, row.kind, row.status].map(csvCell).join(",")
      );
    }
  }
  return { error: "", csv: `${lines.join("\n")}\n` };
}

export async function resetClientPortal(): Promise<SettingsResult> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  const { error } = await crmClient().rpc("reset_portal_account", {
    p_user_id: account.id,
  });
  if (error) return { error: "Could not reset this account." };
  revalidatePath("/portal");
  revalidatePath("/portal/settings");
  return { error: "" };
}

export async function saveDeletionRequest(input: {
  currentPassword: string;
}): Promise<SettingsResult> {
  const account = await getPortalAccount();
  if (!account) return { error: "Sign in required." };
  if (!account.hasPassword) return { error: "Google reauthentication is not available in this session." };
  const result = await requestPortalDeletion({
    userId: account.id,
    currentPassword: input.currentPassword,
  });
  if ("error" in result) return result;
  refresh();
  return { error: "" };
}
