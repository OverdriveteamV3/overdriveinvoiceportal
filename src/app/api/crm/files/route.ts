import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const projectId = String(body.projectId ?? "");
  const name = String(body.name ?? "").trim();
  const contentBase64 = String(body.contentBase64 ?? "");
  const visibility = body.visibility === "client" ? "client" : "internal";
  if (!projectId || !name || !contentBase64) {
    return NextResponse.json({ error: "Project, name, and file contents are required." }, { status: 400 });
  }
  const content = Buffer.from(contentBase64, "base64");
  if (content.length === 0 || content.length > 8_000_000) {
    return NextResponse.json({ error: "File must be between 1 byte and 8 MB." }, { status: 400 });
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
    const { error } = await supabase.from("crm_files").insert({
      project_id: projectId,
      name,
      content_type: String(body.contentType ?? "application/octet-stream"),
      visibility,
      content,
      size_bytes: content.length,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
