import { NextResponse } from "next/server";
import { crmClient, issueInvoice, listInvoices } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import { createCrmCheckoutUrl } from "@/lib/stripe-checkout";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json({ invoices: await listInvoices(profile.profileId) });
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  const invoiceId = String(body.invoiceId ?? "");
  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice id is required." }, { status: 400 });
  }
  try {
    if (body.action === "issue") {
      await issueInvoice(invoiceId, profile.profileId);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "pay") {
      const supabase = crmClient();
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, document_number, total_cents, currency, status")
        .eq("id", invoiceId)
        .eq("profile_id", profile.profileId)
        .maybeSingle();
      if (!invoice || invoice.status === "draft" || invoice.status === "void" || invoice.status === "paid") {
        return NextResponse.json({ error: "This invoice cannot be paid." }, { status: 400 });
      }
      const url = await createCrmCheckoutUrl({
        invoiceId: invoice.id,
        documentNumber: invoice.document_number,
        amountCents: invoice.total_cents,
        currency: invoice.currency,
      });
      if (!url) {
        return NextResponse.json({ error: "Stripe checkout is unavailable." }, { status: 503 });
      }
      return NextResponse.json({ url });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return crmError(error);
  }
}
