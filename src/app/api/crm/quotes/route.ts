import { NextResponse } from "next/server";
import type { DraftState } from "@/lib/drafts";
import { createQuoteVersion, listQuoteVersions } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function GET(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const opportunityId = new URL(request.url).searchParams.get("opportunityId") ?? "";
  if (!opportunityId) {
    return NextResponse.json({ error: "Opportunity is required." }, { status: 400 });
  }
  try {
    return NextResponse.json({
      versions: await listQuoteVersions(profile.profileId, opportunityId),
    });
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const state = body.state as DraftState | undefined;
  const opportunityId = String(body.opportunityId ?? "");
  if (!opportunityId || !state?.client || !Array.isArray(state.services)) {
    return NextResponse.json({ error: "Opportunity and quote state are required." }, { status: 400 });
  }
  try {
    const version = await createQuoteVersion({
      profileId: profile.profileId,
      opportunityId,
      state,
      legacyRecordId: body.legacyRecordId,
      depositType: body.depositType,
      depositPercent: body.depositPercent,
      depositCents: body.depositCents,
      revisionAllowance: body.revisionAllowance,
      expiresOn: body.expiresOn,
      scopeSummary: body.scopeSummary,
      exclusions: body.exclusions,
      scheduleNotes: body.scheduleNotes,
      terms: body.terms,
    });
    return NextResponse.json(version);
  } catch (error) {
    return crmError(error);
  }
}
