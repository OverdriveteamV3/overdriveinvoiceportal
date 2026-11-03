import { NextResponse } from "next/server";
import { archiveOpportunity, addTask, decideSubmission, setOpportunityStage, updateSubmission } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { isSalesStage } from "@/lib/crm/stages";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  const body = await request.json();
  try {
    if (body.action === "decide") {
      const decision = body.decision === "accept" || body.decision === "decline" ? body.decision : "";
      if (!decision) {
        return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
      }
      await decideSubmission({
        opportunityId: id,
        profileId: profile.profileId,
        actor: profile.username,
        decision,
        memo: String(body.memo ?? ""),
      });
    } else if (body.action === "stage") {
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
    } else if (body.action === "update") {
      const title = String(body.title ?? "").trim();
      const name = String(body.name ?? "").trim();
      if (!title || !name) {
        return NextResponse.json({ error: "Name and project title are required." }, { status: 400 });
      }
      await updateSubmission({
        opportunityId: id,
        profileId: profile.profileId,
        name,
        company: String(body.company ?? ""),
        title,
        service: String(body.service ?? ""),
        budget: String(body.budget ?? ""),
        timeline: String(body.timeline ?? ""),
        contact: String(body.contact ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        website: String(body.website ?? ""),
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
