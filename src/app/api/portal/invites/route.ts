import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { createInviteToken, hashInviteToken } from "@/lib/crm/portal-session";
import { sendPlainEmail } from "@/lib/invoice-email-server";

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const projectId = String(body.projectId ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!projectId || !email.includes("@")) {
    return NextResponse.json({ error: "Project and email are required." }, { status: 400 });
  }
  try {
    const supabase = crmClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, client_id")
      .eq("id", projectId)
      .eq("profile_id", profile.profileId)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const token = createInviteToken();
    const { error } = await supabase.from("portal_invites").insert({
      client_id: project.client_id,
      project_id: project.id,
      email,
      token_hash: hashInviteToken(token),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) throw new Error(error.message);

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
    const link = `${base}/portal/invite/${token}`;
    await sendPlainEmail({
      to: email,
      subject: `Your project portal for ${project.name}`,
      text: `Open your private project page:\n${link}\n\nThis link expires in 7 days and can be used once.`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
