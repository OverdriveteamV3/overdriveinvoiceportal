import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  const body = await request.json();
  try {
    const supabase = crmClient();
    const { data: round } = await supabase
      .from("revision_rounds")
      .select("id, projects(profile_id)")
      .eq("id", id)
      .maybeSingle();
    const owner = (round as { projects?: { profile_id?: string } } | null)?.projects?.profile_id;
    if (!round || owner !== profile.profileId) {
      return NextResponse.json({ error: "Revision not found." }, { status: 404 });
    }
    if (body.action === "accept") {
      const { data, error } = await supabase.rpc("crm_accept_revision", {
        p_round_id: id,
        p_actor: profile.username,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json(data);
    }
    if (body.action === "close") {
      const { error } = await supabase
        .from("revision_rounds")
        .update({ state: "closed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "restore") {
      const { error } = await supabase.rpc("crm_restore_revision", {
        p_round_id: id,
        p_actor: profile.username,
        p_reason: String(body.reason ?? ""),
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return crmError(error);
  }
}
