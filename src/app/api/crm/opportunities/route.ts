import { NextResponse } from "next/server";
import {
  createOpportunity,
  listOpportunities,
} from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { dollarsToCents } from "@/lib/crm/money";

const SOURCES = new Set([
  "website",
  "phone",
  "referral",
  "email",
  "social",
  "existing_client",
  "manual",
]);

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    const opportunities = await listOpportunities(profile.profileId);
    return NextResponse.json({ opportunities });
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const displayName = String(body.displayName ?? "").trim();
  const title = String(body.title ?? body.displayName ?? "").trim();
  const source = String(body.source ?? "manual");
  if (!displayName || !title || !SOURCES.has(source)) {
    return NextResponse.json({ error: "Name, title, and source are required." }, { status: 400 });
  }
  try {
    const created = await createOpportunity({
      profileId: profile.profileId,
      actor: profile.username,
      displayName,
      companyName: body.companyName,
      email: body.email,
      phone: body.phone,
      website: body.website,
      title,
      serviceInterest: body.serviceInterest,
      description: body.description,
      source,
      estimatedValueCents:
        typeof body.estimatedValue === "number"
          ? dollarsToCents(body.estimatedValue)
          : Number(body.estimatedValueCents ?? 0),
      nextAction: body.nextAction,
      followUpOn: body.followUpOn || null,
    });
    return NextResponse.json(created);
  } catch (error) {
    return crmError(error);
  }
}
