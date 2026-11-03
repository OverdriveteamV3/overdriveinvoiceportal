import { cookies, headers } from "next/headers";
import { crmClient, createOpportunity } from "@/lib/crm/db";
import { ONBOARDING_DEPOSIT_CENTS } from "@/lib/onboarding/providers";

export const ONBOARDING_COOKIE = "od_onboarding";
export const ONBOARDING_PROVIDER_COOKIE = "od_onboarding_provider";

export type IntakeStack = {
  gmail?: { email?: string; verified?: boolean };
  github?: { login?: string; email?: string; verified?: boolean };
  hostinger?: { domain?: string; verified?: boolean; token?: string };
  vercel?: { plan?: string; verified?: boolean };
  supabase?: { plan?: string; verified?: boolean };
  sells?: boolean | null;
  payments?: { provider?: string; verified?: boolean; plan?: string };
};

export type IntakeContent = {
  contacts?: string;
  about?: string;
  products?: string;
  colors?: string[];
  fonts?: string;
  competitors?: string;
  logoChoice?: "upload" | "request" | "";
  files?: Array<{ group: string; path: string; name: string }>;
};

export type IntakePayload = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  projectName?: string;
  service?: string;
  details?: string;
  goals?: string;
  launchDate?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
};

type IntakeRow = {
  id: string;
  email: string;
  payload: IntakePayload;
  signature_name: string;
  signature_accepted_at: string | null;
  signature_ip: string;
  stack: IntakeStack;
  content: IntakeContent;
  payment_provider: string;
  payment_id: string;
  payment_status: string;
  opportunity_id: string | null;
};

function client() {
  return crmClient();
}

export async function intakeIdFromCookie(): Promise<string> {
  const jar = await cookies();
  return jar.get(ONBOARDING_COOKIE)?.value ?? "";
}

export async function getIntake(id: string): Promise<IntakeRow | null> {
  if (!id) return null;
  const { data, error } = await client()
    .from("onboarding_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as IntakeRow;
}

export async function createIntake(payload: IntakePayload): Promise<IntakeRow> {
  const { data, error } = await client()
    .from("onboarding_intakes")
    .insert({
      email: String(payload.email ?? "").trim().toLowerCase(),
      payload,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not start onboarding.");
  return data as IntakeRow;
}

export async function saveSignature(id: string, name: string, accepted: boolean) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { error } = await client()
    .from("onboarding_intakes")
    .update({
      signature_name: accepted ? name.trim().slice(0, 120) : "",
      signature_accepted_at: accepted ? new Date().toISOString() : null,
      signature_ip: accepted ? ip : "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveStack(id: string, stack: IntakeStack) {
  const { error } = await client()
    .from("onboarding_intakes")
    .update({ stack, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function patchStack(id: string, patch: Partial<IntakeStack>) {
  const current = await getIntake(id);
  if (!current) throw new Error("Onboarding draft not found.");
  await saveStack(id, { ...current.stack, ...patch });
}

export async function saveContent(id: string, content: IntakeContent) {
  const { error } = await client()
    .from("onboarding_intakes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function publicIntake(row: IntakeRow) {
  const stack = { ...row.stack };
  if (stack.hostinger) {
    const { token: _token, ...rest } = stack.hostinger;
    stack.hostinger = rest;
  }
  return {
    id: row.id,
    email: row.email,
    payload: row.payload,
    signatureName: row.signature_name,
    signed: Boolean(row.signature_accepted_at && row.signature_name),
    stack,
    content: row.content,
    paymentProvider: row.payment_provider,
    paymentStatus: row.payment_status,
    opportunityId: row.opportunity_id,
    stackReady: stackIsReady(stack),
    contentReady: contentIsReady(row.content),
    paid: row.payment_status === "paid",
  };
}

export function stackIsReady(stack: IntakeStack): boolean {
  const gmail = stack.gmail?.email?.trim().toLowerCase() ?? "";
  const githubEmail = stack.github?.email?.trim().toLowerCase() ?? "";
  if (!stack.gmail?.verified || !gmail.endsWith("@gmail.com")) return false;
  if (!stack.github?.verified || githubEmail !== gmail) return false;
  if (!stack.hostinger?.verified || !stack.hostinger.domain) return false;
  if (!stack.vercel?.verified || stack.vercel.plan?.toLowerCase() !== "pro") return false;
  if (!stack.supabase?.verified || stack.supabase.plan?.toLowerCase() !== "pro") return false;
  if (stack.sells == null) return false;
  if (stack.sells && !stack.payments?.verified) return false;
  return true;
}

export function contentIsReady(content: IntakeContent): boolean {
  if (!content.contacts?.trim() || !content.about?.trim() || !content.products?.trim()) return false;
  if (!content.colors?.length) return false;
  if (content.logoChoice === "request") return true;
  if (content.logoChoice === "upload") {
    return Boolean(content.files?.some((file) => file.group === "logo"));
  }
  return false;
}

export async function markPaid(id: string, provider: string, paymentId: string) {
  const { error } = await client()
    .from("onboarding_intakes")
    .update({
      payment_provider: provider,
      payment_id: paymentId,
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function finishIntake(id: string): Promise<{ opportunityId: string }> {
  const row = await getIntake(id);
  if (!row) throw new Error("Onboarding draft not found.");
  if (row.opportunity_id) return { opportunityId: row.opportunity_id };
  if (!row.signature_accepted_at || !row.signature_name.trim()) {
    throw new Error("Sign the onboarding policy first.");
  }
  if (!stackIsReady(row.stack)) throw new Error("Verify every required account first.");
  if (!contentIsReady(row.content)) throw new Error("Add the required content and a logo choice.");
  if (row.payment_status !== "paid" || !row.payment_id) {
    throw new Error("The deposit must be paid before finishing.");
  }
  const payload = row.payload;
  const description = [
    payload.goals ? `Goals: ${payload.goals}` : "",
    payload.website ? `Current website: ${payload.website}` : "",
    payload.launchDate ? `Target launch: ${payload.launchDate}` : "",
    "",
    payload.details ?? "",
    "",
    `Signed by ${row.signature_name} on ${row.signature_accepted_at}.`,
    `Deposit ${row.payment_provider} ${row.payment_id} ($${(ONBOARDING_DEPOSIT_CENTS / 100).toFixed(2)}).`,
    row.stack.hostinger?.domain ? `Domain: ${row.stack.hostinger.domain}` : "",
    row.stack.gmail?.email ? `Project Gmail: ${row.stack.gmail.email}` : "",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n")
    .trim();

  const created = await createOpportunity({
    profileId: "master",
    actor: "website",
    displayName: payload.name || row.email,
    companyName: payload.company,
    email: payload.email || row.email,
    phone: payload.phone,
    website: payload.website,
    title: payload.projectName || "Quote request",
    serviceInterest: payload.service,
    description,
    source: "website",
    landingPage: "/quote",
    preferredContact: payload.preferredContact,
    budgetRange: payload.budget,
    desiredTimeline: payload.timeline,
    campaign: "Request Quote",
    nextAction: "Quote this request in the invoice system",
  });

  const { error } = await client()
    .from("onboarding_intakes")
    .update({ opportunity_id: created.opportunityId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { opportunityId: created.opportunityId };
}
