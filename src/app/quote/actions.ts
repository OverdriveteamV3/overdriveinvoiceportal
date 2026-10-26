"use server";

import { headers } from "next/headers";
import { createOpportunity, crmClient } from "@/lib/crm/db";

const SERVICES = [
  "Website Development",
  "Dashboards & CRMs",
  "Apps & Software",
  "UI/UX & Branding",
] as const;

const BUDGETS = [
  "Not sure yet",
  "$200-$500",
  "$500-$1,000",
  "$1,000-$1,000+",
] as const;

const TIMELINES = ["As soon as possible", "Within a month", "1–3 months", "Flexible"] as const;

const CONTACTS = ["Email", "Phone"] as const;

export type QuoteRequestResult = { ok: true } | { ok: false; error: string };

function allowed(value: string, options: readonly string[]) {
  return options.includes(value) ? value : "";
}

function line(label: string, value: string) {
  const text = value.trim();
  return text ? `${label}: ${text}` : "";
}

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const company = String(formData.get("company") ?? "").trim().slice(0, 160);
  const website = String(formData.get("website") ?? "").trim().slice(0, 200);
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 140);
  const details = String(formData.get("details") ?? "").trim().slice(0, 4000);
  const goals = String(formData.get("goals") ?? "").trim().slice(0, 1000);
  const launchDate = String(formData.get("launchDate") ?? "").trim().slice(0, 20);
  const service = allowed(String(formData.get("service") ?? ""), SERVICES);
  const budget = allowed(String(formData.get("budget") ?? ""), BUDGETS);
  const timeline = allowed(String(formData.get("timeline") ?? ""), TIMELINES);
  const preferredContact = allowed(String(formData.get("preferredContact") ?? ""), CONTACTS);

  if (!name || !email.includes("@") || !service || !projectName || details.length < 10) {
    return {
      ok: false,
      error: "Add your name, email, service, project name, and a short description.",
    };
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

  const description = [
    line("Goals", goals),
    line("Current website", website),
    line("Target launch", launchDate),
    "",
    details,
  ]
    .filter((entry, index, all) => entry !== "" || all[index - 1] !== "")
    .join("\n")
    .trim();

  try {
    const created = await createOpportunity({
      profileId: "master",
      actor: "website",
      displayName: name,
      companyName: company,
      email,
      phone,
      website,
      title: projectName,
      serviceInterest: service,
      description,
      source: "website",
      landingPage: "/quote",
      preferredContact,
      budgetRange: budget,
      desiredTimeline: timeline,
      nextAction: "Review the quote request",
    });

    await supabase.from("lead_intake_requests").insert({
      idempotency_key: crypto.randomUUID(),
      ip_address: ip,
      opportunity_id: created.opportunityId,
    });

    return { ok: true };
  } catch (error) {
    console.error("Quote request failed:", error);
    return {
      ok: false,
      error: "We could not save this request. Email admin@overdriveio.com and we will take it from there.",
    };
  }
}
