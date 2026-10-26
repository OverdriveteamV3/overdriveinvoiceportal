"use server";

import { headers } from "next/headers";
import { createOpportunity, crmClient } from "@/lib/crm/db";

export type SupportMessageResult = { ok: true } | { ok: false; error: string };

export async function submitSupportMessage(formData: FormData): Promise<SupportMessageResult> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);

  if (!name || !email.includes("@") || message.length < 2) {
    return { ok: false, error: "Add your name, email, and a message." };
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const supabase = crmClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("lead_intake_requests")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  if ((count ?? 0) >= 8) {
    return { ok: false, error: "Too many requests from this network. Please try again later." };
  }

  try {
    const created = await createOpportunity({
      profileId: "master",
      actor: "website",
      displayName: name,
      email,
      title: "Support message",
      description: message,
      source: "website",
      landingPage: "/",
      preferredContact: "Email",
      nextAction: "Reply to the support message",
    });

    await supabase.from("lead_intake_requests").insert({
      idempotency_key: crypto.randomUUID(),
      ip_address: ip,
      opportunity_id: created.opportunityId,
    });

    return { ok: true };
  } catch (error) {
    console.error("Support message failed:", error);
    return {
      ok: false,
      error: "We could not send this message. Email admin@overdriveio.com and we will take it from there.",
    };
  }
}
