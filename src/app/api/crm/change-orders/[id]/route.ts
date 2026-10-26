import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  const body = await request.json();
  const status = String(body.status ?? "");
  if (!["sent", "approved", "declined", "invoiced"].includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  try {
    const supabase = crmClient();
    const { data: change } = await supabase
      .from("change_orders")
      .select("id, project_id, price_cents, currency, summary, projects(profile_id, order_id)")
      .eq("id", id)
      .maybeSingle();
    const project = (
      change as {
        projects?: { profile_id?: string; order_id?: string };
        price_cents?: number;
        currency?: string;
        summary?: string;
      } | null
    )?.projects;
    if (!change || project?.profile_id !== profile.profileId) {
      return NextResponse.json({ error: "Change order not found." }, { status: 404 });
    }
    const { error } = await supabase.from("change_orders").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);

    if (status === "approved" && project.order_id) {
      const { data: number } = await supabase.rpc("crm_next_document_number", { p_prefix: "INV" });
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          order_id: project.order_id,
          profile_id: profile.profileId,
          kind: "change",
          status: "draft",
          total_cents: change.price_cents,
          currency: change.currency,
          document_number: number,
          change_order_id: id,
        })
        .select("id")
        .single();
      if (invoiceError) throw new Error(invoiceError.message);
      await supabase.from("invoice_lines").insert({
        invoice_id: invoice.id,
        description: change.summary,
        quantity: 1,
        unit_price_cents: change.price_cents,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
