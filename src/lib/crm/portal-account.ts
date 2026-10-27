import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";

export type PortalAccount = {
  id: string;
  name: string;
  email: string;
};

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

export async function getPortalAccount(): Promise<PortalAccount | null> {
  const id = await getPortalUserId();
  if (!id) return null;
  try {
    const { data } = await crmClient()
      .from("portal_users")
      .select("id, name, email")
      .eq("id", id)
      .maybeSingle();
    if (!data?.id || !data.email) return null;
    return { id: data.id, name: data.name ?? "", email: data.email };
  } catch {
    return null;
  }
}

async function clientIdForEmail(email: string, name: string): Promise<string> {
  const supabase = crmClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("id, email")
    .eq("profile_id", "master")
    .ilike("email", email)
    .limit(8);
  const match = (existing ?? []).find((row) => String(row.email).toLowerCase() === email);
  if (match?.id) return match.id as string;

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      profile_id: "master",
      display_name: name,
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
  email: string;
  password: string;
}): Promise<{ id: string } | { error: string }> {
  const name = input.name.trim().slice(0, 100);
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
    return { id: existing.id as string };
  }

  try {
    const clientId = await clientIdForEmail(email, name);
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

export async function upsertPortalUserFromGoogle(input: {
  email: string;
  name: string;
  sub: string;
}): Promise<{ id: string } | { error: string }> {
  const email = cleanEmail(input.email);
  const name = (input.name.trim() || email.split("@")[0] || "Client").slice(0, 100);
  const sub = input.sub.trim().slice(0, 200);
  if (!validEmail(email) || !sub) return { error: "Google sign-in did not return a usable account." };

  const supabase = crmClient();
  const { data: bySub } = await supabase
    .from("portal_users")
    .select("id, name, email")
    .eq("google_sub", sub)
    .maybeSingle();
  if (bySub?.id) {
    await supabase
      .from("portal_users")
      .update({
        name: bySub.name || name,
        email,
        auth_provider: "google",
      })
      .eq("id", bySub.id);
    return { id: bySub.id as string };
  }

  const { data: matches } = await supabase
    .from("portal_users")
    .select("id, name, email")
    .ilike("email", email)
    .limit(8);
  const existing = (matches ?? []).find((row) => String(row.email).toLowerCase() === email);
  if (existing?.id) {
    const { error } = await supabase
      .from("portal_users")
      .update({
        google_sub: sub,
        auth_provider: "google",
        name: existing.name || name,
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
      })
      .select("id")
      .single();
    if (error || !created) return { error: "We could not create that account. Try again." };
    return { id: created.id as string };
  } catch {
    return { error: "We could not create that account. Try again." };
  }
}
