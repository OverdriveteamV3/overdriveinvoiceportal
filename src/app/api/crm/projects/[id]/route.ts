import { NextResponse } from "next/server";
import { addCost, saveBudget, updateOnboardingItem, updateOnboardingNotes, updateProject } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { dollarsToCents } from "@/lib/crm/money";
import { isProjectStage } from "@/lib/crm/stages";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  const body = await request.json();
  try {
    if (body.action === "stage") {
      if (!isProjectStage(String(body.stage ?? ""))) {
        return NextResponse.json({ error: "Unknown project stage." }, { status: 400 });
      }
      await updateProject({
        profileId: profile.profileId,
        projectId: id,
        stage: body.stage,
        blocker: body.blocker,
        nextAction: body.nextAction,
        kickoffOverrideReason: body.kickoffOverrideReason,
      });
    } else if (body.action === "onboarding") {
      await updateOnboardingItem({
        profileId: profile.profileId,
        itemId: String(body.itemId ?? ""),
        state: String(body.state ?? ""),
      });
    } else if (body.action === "onboarding-note") {
      await updateOnboardingNotes({
        profileId: profile.profileId,
        itemId: String(body.itemId ?? ""),
        notes: String(body.notes ?? ""),
      });
    } else if (body.action === "budget") {
      const amountCents =
        typeof body.amount === "number" ? dollarsToCents(body.amount) : Number(body.amountCents ?? 0);
      await saveBudget({
        profileId: profile.profileId,
        projectId: id,
        category: String(body.category ?? "other"),
        amountCents,
      });
    } else if (body.action === "cost") {
      const amountCents =
        typeof body.amount === "number" ? dollarsToCents(body.amount) : Number(body.amountCents ?? 0);
      await addCost({
        profileId: profile.profileId,
        projectId: id,
        category: String(body.category ?? "other"),
        amountCents,
        note: body.note,
      });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
