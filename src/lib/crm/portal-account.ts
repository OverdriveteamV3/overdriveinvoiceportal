import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { crmClient } from "@/lib/crm/db";
import {
  createPortalMailToken,
  createPortalResetToken,
  getPortalUserId,
  portalPublicBase,
  readPortalMailToken,
  readPortalResetToken,
} from "@/lib/crm/portal-session";
import { parsePortalPreferences, type PortalPreferences } from "@/lib/crm/portal-preferences";
import { hasEmailConfig, sendPlainEmail } from "@/lib/invoice-email-server";

export type { PortalPreferences };

export type PortalAccount = {
  id: string;
  clientId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  phone: string;
  businessName: string;
  authProvider: string;
  hasPassword: boolean;
  pendingEmail: string | null;
  secondaryEmail: string;
  secondaryEmailVerified: boolean;
  preferences: PortalPreferences;
  billingContactName: string;
  billingBusinessName: string;
  billingEmail: string;
  billingCountry: string;
  billingAddress: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  deletionRequestedAt: string | null;
};

const PORTAL_ACCOUNT_COLUMNS =
  "id, client_id, name, email, avatar_url, avatar_content_type, avatar_updated_at, phone, business_name, auth_provider, password_hash, pending_email, secondary_email, secondary_email_verified_at, preferences, billing_contact_name, billing_business_name, billing_email, billing_country, billing_address, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, deletion_requested_at";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}

function cleanEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 200);
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function safeNextPath(value: string | undefined, fallback = "/portal"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

function accountFromRow(data: Record<string, unknown>): PortalAccount | null {
  if (!data.id || !data.email) return null;
  const custom = typeof data.avatar_content_type === "string" && data.avatar_content_type.length > 0;
  const remote =
    typeof data.avatar_url === "string" && data.avatar_url.startsWith("https://")
      ? data.avatar_url
      : null;
  const version =
    typeof data.avatar_updated_at === "string" ? encodeURIComponent(data.avatar_updated_at) : "1";
  return {
    id: String(data.id),
    clientId: String(data.client_id ?? ""),
    name: String(data.name ?? ""),
    email: String(data.email),
    avatarUrl: custom ? `/api/portal/avatar?v=${version}` : remote,
    hasCustomAvatar: custom,
    phone: String(data.phone ?? ""),
    businessName: String(data.business_name ?? ""),
    authProvider: String(data.auth_provider ?? ""),
    hasPassword: Boolean(data.password_hash),
    pendingEmail: typeof data.pending_email === "string" && data.pending_email ? data.pending_email : null,
    secondaryEmail: String(data.secondary_email ?? ""),
    secondaryEmailVerified: Boolean(data.secondary_email_verified_at),
    preferences: parsePortalPreferences(data.preferences),
    billingContactName: String(data.billing_contact_name ?? ""),
    billingBusinessName: String(data.billing_business_name ?? ""),
    billingEmail: String(data.billing_email ?? ""),
    billingCountry: String(data.billing_country ?? ""),
    billingAddress: String(data.billing_address ?? ""),
    billingAddressLine1: String(data.billing_address_line1 ?? ""),
    billingAddressLine2: String(data.billing_address_line2 ?? ""),
    billingCity: String(data.billing_city ?? ""),
    billingState: String(data.billing_state ?? ""),
    billingPostalCode: String(data.billing_postal_code ?? ""),
    deletionRequestedAt:
      typeof data.deletion_requested_at === "string" ? data.deletion_requested_at : null,
  };
}

export async function getPortalAccount(): Promise<PortalAccount | null> {
  const id = await getPortalUserId();
  if (!id) return null;
  try {
    const { data, error } = await crmClient()
      .from("portal_users")
      .select(PORTAL_ACCOUNT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return accountFromRow(data as Record<string, unknown>);

    const legacy = await crmClient()
      .from("portal_users")
      .select("id, client_id, name, email, avatar_url, auth_provider, password_hash")
      .eq("id", id)
      .maybeSingle();
    if (!legacy.data) return null;
    return accountFromRow(legacy.data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function portalEmailAllowed(
  email: string,
  kind: "project" | "invoice"
): Promise<boolean> {
  const cleaned = cleanEmail(email);
  if (!validEmail(cleaned)) return true;
  const { data: matches } = await crmClient()
    .from("portal_users")
    .select("email, preferences")
    .ilike("email", cleaned)
    .limit(8);
  const user = (matches ?? []).find((row) => String(row.email).toLowerCase() === cleaned);
  if (!user) return true;
  const preferences = parsePortalPreferences(user.preferences);
  return kind === "project" ? preferences.notifyProjectStatus : preferences.notifyInvoiceReminders;
}

async function clientIdForEmail(
  email: string,
  name: string,
  businessName = ""
): Promise<string> {
  const supabase = crmClient();
  const companyName = businessName.trim().slice(0, 160);
  const { data: existing } = await supabase
    .from("clients")
    .select("id, email, company_name")
    .eq("profile_id", "master")
    .ilike("email", email)
    .limit(8);
  const match = (existing ?? []).find((row) => String(row.email).toLowerCase() === email);
  if (match?.id) {
    if (companyName && !String(match.company_name ?? "").trim()) {
      await supabase
        .from("clients")
        .update({ company_name: companyName })
        .eq("id", match.id);
    }
    return match.id as string;
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      profile_id: "master",
      display_name: name,
      company_name: companyName,
      email,
    })
    .select("id")
    .single();
  if (error || !client) throw new Error(error?.message ?? "Account was not created.");

  await supabase.from("client_contacts").insert({
    client_id: client.id,
    name,
    email,
    is_primary: true,
  });
  return client.id as string;
}

export async function registerPortalAccount(input: {
  name: string;
  businessName?: string;
  email: string;
  password: string;
}): Promise<{ id: string } | { error: string }> {
  const name = input.name.trim().slice(0, 100);
  const businessName = (input.businessName ?? "").trim().slice(0, 160);
  const email = cleanEmail(input.email);
  const password = input.password;
  if (!name) return { error: "Add your name." };
  if (!validEmail(email)) return { error: "Enter a valid email." };
  if (password.length < 8 || password.length > 200) return { error: "Use at least 8 characters." };

  const supabase = crmClient();
  const { data: matches } = await supabase
    .from("portal_users")
    .select("id, password_hash, name, email")
    .ilike("email", email)
    .limit(8);
  const existing = (matches ?? []).find((row) => String(row.email).toLowerCase() === email);

  if (existing?.password_hash) {
    return { error: "An account with that email already exists. Sign in instead." };
  }

  const passwordHash = hashPassword(password);
  if (existing?.id) {
    const { error } = await supabase
      .from("portal_users")
      .update({ password_hash: passwordHash, name: existing.name || name })
      .eq("id", existing.id);
    if (error) return { error: "We could not create that account. Try again." };
    await clientIdForEmail(email, existing.name || name, businessName);
    return { id: existing.id as string };
  }

  try {
    const clientId = await clientIdForEmail(email, name, businessName);
    const { data: created, error } = await supabase
      .from("portal_users")
      .insert({ client_id: clientId, email, name, password_hash: passwordHash })
      .select("id")
      .single();
    if (error || !created) return { error: "We could not create that account. Try again." };
    return { id: created.id as string };
  } catch {
    return { error: "We could not create that account. Try again." };
  }
}

export async function requestPortalPasswordReset(
  emailInput: string
): Promise<{ ok: true } | { error: string }> {
  const email = cleanEmail(emailInput);
  if (!validEmail(email)) return { error: "Enter a valid email." };

  // Always succeed to the caller once email looks valid — avoid account enumeration.
  try {
    const { data: matches } = await crmClient()
      .from("portal_users")
      .select("id, email, name")
      .ilike("email", email)
      .limit(8);
    const user = (matches ?? []).find((row) => String(row.email).toLowerCase() === email);
    if (!user?.id) return { ok: true };

    if (!hasEmailConfig()) {
      return { error: "Password reset email is not configured yet." };
    }

    const token = createPortalResetToken(String(user.id), email);
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
      (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : "http://localhost:3000");
    const resetUrl = `${base}/sign-in/reset?token=${encodeURIComponent(token)}`;
    const name = String(user.name ?? "").trim() || "there";
    await sendPlainEmail({
      to: email,
      subject: "Reset your Over Drive portal password",
      text: [
        `Hi ${name},`,
        "",
        "Your client portal login is this email address:",
        email,
        "",
        "Use this link to choose a new password (expires in 1 hour):",
        resetUrl,
        "",
        "If you did not ask for this, you can ignore the email.",
        "",
        "— Over Drive",
      ].join("\n"),
    });
  } catch {
    return { error: "We could not send the reset email. Try again." };
  }
  return { ok: true };
}

export async function resetPortalPassword(input: {
  token: string;
  password: string;
}): Promise<{ id: string } | { error: string }> {
  const parsed = readPortalResetToken(input.token);
  if (!parsed) return { error: "This reset link is invalid or expired." };
  if (input.password.length < 8 || input.password.length > 200) {
    return { error: "Use at least 8 characters." };
  }

  const supabase = crmClient();
  const { data } = await supabase
    .from("portal_users")
    .select("id, email")
    .eq("id", parsed.portalUserId)
    .maybeSingle();
  if (!data?.id || String(data.email).toLowerCase() !== parsed.email) {
    return { error: "This reset link is invalid or expired." };
  }

  const { error } = await supabase
    .from("portal_users")
    .update({ password_hash: hashPassword(input.password) })
    .eq("id", data.id);
  if (error) return { error: "We could not update that password. Try again." };
  return { id: data.id as string };
}

async function passwordMatches(userId: string, password: string): Promise<boolean> {
  const { data } = await crmClient()
    .from("portal_users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.password_hash) return false;
  return verifyPassword(password, data.password_hash);
}

async function emailTaken(email: string, exceptUserId: string): Promise<boolean> {
  const { data: matches } = await crmClient()
    .from("portal_users")
    .select("id, email")
    .ilike("email", email)
    .limit(8);
  return (matches ?? []).some(
    (row) => String(row.email).toLowerCase() === email && String(row.id) !== exceptUserId
  );
}

export async function changePortalPassword(input: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
}): Promise<{ ok: true } | { error: string }> {
  if (input.nextPassword.length < 8 || input.nextPassword.length > 200) {
    return { error: "Use at least 8 characters." };
  }
  if (!(await passwordMatches(input.userId, input.currentPassword))) {
    return { error: "Current password is incorrect." };
  }
  const { error } = await crmClient()
    .from("portal_users")
    .update({ password_hash: hashPassword(input.nextPassword) })
    .eq("id", input.userId);
  if (error) return { error: "We could not update that password. Try again." };
  return { ok: true };
}

async function sendPortalLink(input: {
  to: string;
  name: string;
  subject: string;
  intro: string;
  url: string;
}): Promise<{ ok: true } | { error: string }> {
  if (!hasEmailConfig()) return { error: "Email is not configured yet." };
  try {
    await sendPlainEmail({
      to: input.to,
      subject: input.subject,
      text: [
        `Hi ${input.name || "there"},`,
        "",
        input.intro,
        input.url,
        "",
        "This link expires in 1 hour. If you did not ask for this, you can ignore the email.",
        "",
        "— Over Drive",
      ].join("\n"),
    });
  } catch {
    return { error: "We could not send that email. Try again." };
  }
  return { ok: true };
}

export async function requestPortalEmailChange(input: {
  userId: string;
  currentPassword: string;
  nextEmail: string;
  name: string;
}): Promise<{ ok: true } | { error: string }> {
  const email = cleanEmail(input.nextEmail);
  if (!validEmail(email)) return { error: "Enter a valid email." };
  if (!(await passwordMatches(input.userId, input.currentPassword))) {
    return { error: "Current password is incorrect." };
  }
  const { data: self } = await crmClient()
    .from("portal_users")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();
  if (!self?.email) return { error: "Sign in required." };
  if (String(self.email).toLowerCase() === email) return { error: "That is already your email." };
  if (await emailTaken(email, input.userId)) return { error: "That email is already in use." };

  const { error } = await crmClient()
    .from("portal_users")
    .update({ pending_email: email })
    .eq("id", input.userId);
  if (error) return { error: "We could not start that email change. Try again." };

  const token = createPortalMailToken(input.userId, email, "portal-email");
  const sent = await sendPortalLink({
    to: email,
    name: input.name,
    subject: "Confirm your Over Drive portal email",
    intro: "Confirm this address as your portal login. Your current email stays active until you open this link:",
    url: `${portalPublicBase()}/portal/settings/email/confirm?token=${encodeURIComponent(token)}`,
  });
  if ("error" in sent) {
    await crmClient().from("portal_users").update({ pending_email: null }).eq("id", input.userId);
    return sent;
  }
  return { ok: true };
}

export async function confirmPortalEmailChange(
  token: string
): Promise<{ ok: true } | { error: string }> {
  const parsed = readPortalMailToken(token);
  if (!parsed || parsed.kind !== "portal-email") {
    return { error: "This confirmation link is invalid or expired." };
  }
  const { data } = await crmClient()
    .from("portal_users")
    .select("id, pending_email")
    .eq("id", parsed.portalUserId)
    .maybeSingle();
  if (!data?.id || String(data.pending_email ?? "").toLowerCase() !== parsed.email) {
    return { error: "This confirmation link is invalid or expired." };
  }
  if (await emailTaken(parsed.email, data.id)) {
    return { error: "That email is already in use." };
  }
  const { error } = await crmClient()
    .from("portal_users")
    .update({ email: parsed.email, pending_email: null })
    .eq("id", data.id);
  if (error) return { error: "We could not confirm that email. Try again." };
  return { ok: true };
}

export async function requestSecondaryEmail(input: {
  userId: string;
  email: string;
  name: string;
}): Promise<{ ok: true } | { error: string }> {
  const email = cleanEmail(input.email);
  if (!validEmail(email)) return { error: "Enter a valid email." };
  const { data: self } = await crmClient()
    .from("portal_users")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();
  if (self?.email && String(self.email).toLowerCase() === email) {
    return { error: "Use an address other than your login email." };
  }
  const { error } = await crmClient()
    .from("portal_users")
    .update({ secondary_email: email, secondary_email_verified_at: null })
    .eq("id", input.userId);
  if (error) return { error: "We could not save that contact email. Try again." };

  const token = createPortalMailToken(input.userId, email, "portal-secondary");
  const sent = await sendPortalLink({
    to: email,
    name: input.name,
    subject: "Confirm your Over Drive contact email",
    intro:
      "Confirm this secondary contact email. It does not change your login or password reset address:",
    url: `${portalPublicBase()}/portal/settings/contact/confirm?token=${encodeURIComponent(token)}`,
  });
  if ("error" in sent) {
    await crmClient()
      .from("portal_users")
      .update({ secondary_email: null, secondary_email_verified_at: null })
      .eq("id", input.userId);
    return sent;
  }
  return { ok: true };
}

export async function confirmSecondaryEmail(
  token: string
): Promise<{ ok: true } | { error: string }> {
  const parsed = readPortalMailToken(token);
  if (!parsed || parsed.kind !== "portal-secondary") {
    return { error: "This confirmation link is invalid or expired." };
  }
  const { data } = await crmClient()
    .from("portal_users")
    .select("id, secondary_email")
    .eq("id", parsed.portalUserId)
    .maybeSingle();
  if (!data?.id || String(data.secondary_email ?? "").toLowerCase() !== parsed.email) {
    return { error: "This confirmation link is invalid or expired." };
  }
  const { error } = await crmClient()
    .from("portal_users")
    .update({ secondary_email_verified_at: new Date().toISOString() })
    .eq("id", data.id);
  if (error) return { error: "We could not confirm that email. Try again." };
  return { ok: true };
}

export async function removeSecondaryEmail(userId: string): Promise<{ ok: true } | { error: string }> {
  const { error } = await crmClient()
    .from("portal_users")
    .update({ secondary_email: null, secondary_email_verified_at: null })
    .eq("id", userId);
  if (error) return { error: "We could not remove that contact email. Try again." };
  return { ok: true };
}

export async function requestPortalDeletion(input: {
  userId: string;
  currentPassword: string;
}): Promise<{ ok: true } | { error: string }> {
  if (!(await passwordMatches(input.userId, input.currentPassword))) {
    return { error: "Current password is incorrect." };
  }
  const { error } = await crmClient()
    .from("portal_users")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("id", input.userId);
  if (error) return { error: "We could not record that request. Try again." };
  return { ok: true };
}

export async function authenticatePortalAccount(input: {
  email: string;
  password: string;
}): Promise<{ id: string } | { error: string }> {
  const email = cleanEmail(input.email);
  const password = input.password;
  if (!validEmail(email) || password.length < 8 || password.length > 200) {
    return { error: "Email or password is incorrect." };
  }

  const { data: matches } = await crmClient()
    .from("portal_users")
    .select("id, password_hash, email")
    .ilike("email", email)
    .limit(8);
  const data = (matches ?? []).find((row) => String(row.email).toLowerCase() === email);

  if (!data?.password_hash || !verifyPassword(password, data.password_hash)) {
    return { error: "Email or password is incorrect." };
  }
  return { id: data.id as string };
}

function cleanAvatarUrl(value: string | undefined): string | null {
  const url = value?.trim() ?? "";
  if (!url.startsWith("https://")) return null;
  return url.slice(0, 500);
}

export async function upsertPortalUserFromGoogle(input: {
  email: string;
  name: string;
  sub: string;
  avatarUrl?: string;
}): Promise<{ id: string } | { error: string }> {
  const email = cleanEmail(input.email);
  const name = (input.name.trim() || email.split("@")[0] || "Client").slice(0, 100);
  const sub = input.sub.trim().slice(0, 200);
  const avatarUrl = cleanAvatarUrl(input.avatarUrl);
  if (!validEmail(email) || !sub) return { error: "Google sign-in did not return a usable account." };

  const supabase = crmClient();
  const { data: bySub } = await supabase
    .from("portal_users")
    .select("id, name, email, avatar_content_type")
    .eq("google_sub", sub)
    .maybeSingle();
  if (bySub?.id) {
    const keepCustomAvatar = Boolean(bySub.avatar_content_type);
    await supabase
      .from("portal_users")
      .update({
        name: bySub.name || name,
        email,
        auth_provider: "google",
        ...(avatarUrl && !keepCustomAvatar ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", bySub.id);
    return { id: bySub.id as string };
  }

  const { data: matches } = await supabase
    .from("portal_users")
    .select("id, name, email, avatar_content_type")
    .ilike("email", email)
    .limit(8);
  const existing = (matches ?? []).find((row) => String(row.email).toLowerCase() === email);
  if (existing?.id) {
    const keepCustomAvatar = Boolean(existing.avatar_content_type);
    const { error } = await supabase
      .from("portal_users")
      .update({
        google_sub: sub,
        auth_provider: "google",
        name: existing.name || name,
        ...(avatarUrl && !keepCustomAvatar ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", existing.id);
    if (error) return { error: "We could not link that Google account. Try again." };
    return { id: existing.id as string };
  }

  try {
    const clientId = await clientIdForEmail(email, name);
    const { data: created, error } = await supabase
      .from("portal_users")
      .insert({
        client_id: clientId,
        email,
        name,
        google_sub: sub,
        auth_provider: "google",
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .select("id")
      .single();
    if (error || !created) return { error: "We could not create that account. Try again." };
    return { id: created.id as string };
  } catch {
    return { error: "We could not create that account. Try again." };
  }
}
