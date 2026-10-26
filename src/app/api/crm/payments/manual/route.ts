import { NextResponse } from "next/server";
import { crmClient, syncPaidDeposit } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { dollarsToCents } from "@/lib/crm/money";

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const invoiceId = String(body.invoiceId ?? "");
  const amountCents = dollarsToCents(Number(body.amount ?? body.amountCents ?? 0));
  try {
    const supabase = crmClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("profile_id", profile.profileId)
      .maybeSingle();
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    const { data, error } = await supabase.rpc("crm_record_manual_payment", {
      p_invoice_id: invoiceId,
      p_amount_cents: amountCents,
      p_method: String(body.method ?? ""),
      p_received_on: String(body.receivedOn ?? new Date().toISOString().slice(0, 10)),
      p_reference: String(body.reference ?? ""),
      p_note: String(body.note ?? ""),
      p_actor: profile.username,
    });
    if (error) throw new Error(error.message);
    await syncPaidDeposit(invoiceId);
    return NextResponse.json({ paymentId: data });
  } catch (error) {
    return crmError(error);
  }
}
