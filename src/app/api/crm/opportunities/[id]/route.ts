import { NextResponse } from "next/server";
import { archiveOpportunity, addTask, setOpportunityStage } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { isSalesStage } from "@/lib/crm/stages";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  const body = await request.json();
  try {
    if (body.action === "stage") {
      if (!isSalesStage(String(body.stage ?? ""))) {
        return NextResponse.json({ error: "Unknown stage." }, { status: 400 });
      }
      await setOpportunityStage({
        opportunityId: id,
        profileId: profile.profileId,
        stage: body.stage,
        actor: profile.username,
        reason: body.reason,
      });
    } else if (body.action === "archive" || body.action === "reopen") {
      const reason = String(body.reason ?? "").trim();
      if (body.action === "archive" && !reason) {
        return NextResponse.json({ error: "A reason is required." }, { status: 400 });
      }
      await archiveOpportunity({
        opportunityId: id,
        profileId: profile.profileId,
        actor: profile.username,
        reason,
        reopen: body.action === "reopen",
      });
    } else if (body.action === "task") {
      const task = String(body.body ?? "").trim();
      if (!task) return NextResponse.json({ error: "Task text is required." }, { status: 400 });
      await addTask({
        profileId: profile.profileId,
        opportunityId: id,
        body: task,
        dueOn: body.dueOn || null,
      });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
