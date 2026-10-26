import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const projectId = String(body.projectId ?? "");
  const title = String(body.title ?? "").trim();
  const kind = body.kind === "defect" ? "defect" : "included";
  if (!projectId || !title) {
    return NextResponse.json({ error: "Project and title are required." }, { status: 400 });
  }
  try {
    const supabase = crmClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("profile_id", profile.profileId)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const { data, error } = await supabase
      .from("revision_rounds")
      .insert({
        project_id: projectId,
        kind,
        state: "submitted",
        title,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Revision was not saved.");
    if (body.body) {
      await supabase.from("revision_items").insert({
        round_id: data.id,
        body: String(body.body),
      });
    }
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return crmError(error);
  }
}
