import { NextResponse } from "next/server";
import { createOpportunity, claimNotification, crmClient } from "@/lib/crm/db";
import { sendPlainEmail } from "@/lib/invoice-email-server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function POST(request: Request) {
  const configured = process.env.LEAD_INTAKE_SECRET?.trim();
  const provided = request.headers.get("x-lead-intake-secret")?.trim();
  if (!configured || !provided || provided !== configured) return unauthorized();

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key is required." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const description = String(body.projectDescription ?? "").trim();
  if (!name || !email.includes("@") || description.length < 10 || body.privacyAcknowledged !== true) {
    return NextResponse.json(
      { error: "Name, email, project description, and privacy acknowledgement are required." },
      { status: 400 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const supabase = crmClient();
    const { data: existing } = await supabase
      .from("lead_intake_requests")
      .select("opportunity_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.opportunity_id) {
      return NextResponse.json({ opportunityId: existing.opportunity_id, created: false });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("lead_intake_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= 8) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const created = await createOpportunity({
      profileId: "master",
      actor: "website",
      displayName: name,
      companyName: String(body.company ?? ""),
      email,
      phone: String(body.phone ?? ""),
      website: String(body.existingWebsite ?? ""),
      title: String(body.serviceInterest ?? "Website inquiry"),
      serviceInterest: String(body.serviceInterest ?? ""),
      description,
      source: "website",
      landingPage: String(body.landingPage ?? ""),
      campaign: String(body.campaign ?? ""),
      preferredContact: String(body.preferredContact ?? ""),
      budgetRange: String(body.budgetRange ?? ""),
      desiredTimeline: String(body.desiredTimeline ?? ""),
      nextAction: "Review the website inquiry",
    });

    const { error: intakeError } = await supabase.from("lead_intake_requests").insert({
      idempotency_key: idempotencyKey,
      ip_address: ip,
      opportunity_id: created.opportunityId,
    });
    if (intakeError && intakeError.code !== "23505") throw new Error(intakeError.message);

    const claimed = await claimNotification("lead-ack", created.opportunityId);
    if (claimed) {
      try {
        await sendPlainEmail({
          to: email,
          subject: "We received your project request",
          text: `Hi ${name},\n\nWe received your request and will follow up shortly.\n\nOver Drive`,
        });
      } catch (error) {
        await supabase
          .from("notification_sends")
          .delete()
          .eq("kind", "lead-ack")
          .eq("entity_key", created.opportunityId);
        console.error("Lead acknowledgement failed:", error);
      }
    }

    return NextResponse.json({ ...created, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the lead.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
