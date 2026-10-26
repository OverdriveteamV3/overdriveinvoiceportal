import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { dollarsToCents, USD } from "@/lib/crm/money";

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const projectId = String(body.projectId ?? "");
  const summary = String(body.summary ?? "").trim();
  const priceCents =
    typeof body.price === "number" ? dollarsToCents(body.price) : Number(body.priceCents ?? 0);
  if (!projectId || !summary) {
    return NextResponse.json({ error: "Project and summary are required." }, { status: 400 });
  }
  try {
    const supabase = crmClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, order_id")
      .eq("id", projectId)
      .eq("profile_id", profile.profileId)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const { data, error } = await supabase
      .from("change_orders")
      .insert({
        project_id: projectId,
        order_id: project.order_id,
        summary,
        price_cents: priceCents,
        currency: USD,
        schedule_impact: String(body.scheduleImpact ?? ""),
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Change order was not saved.");
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return crmError(error);
  }
}
