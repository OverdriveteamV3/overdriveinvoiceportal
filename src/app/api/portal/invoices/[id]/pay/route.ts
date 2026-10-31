import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";
import { createCrmCheckoutUrl } from "@/lib/stripe-checkout";

type Params = { params: Promise<{ id: string }> };

function resolvePayAmountCents(
  invoiceTotalCents: number,
  searchParams: URLSearchParams
): number {
  const max = Math.max(0, Number(invoiceTotalCents) || 0);
  const percentRaw = Number(searchParams.get("percent"));
  if (Number.isFinite(percentRaw) && percentRaw > 0 && percentRaw <= 100) {
    return Math.max(50, Math.min(max, Math.round((max * percentRaw) / 100)));
  }
  const amountRaw = Number(searchParams.get("amountCents"));
  if (Number.isFinite(amountRaw) && amountRaw > 0) {
    return Math.max(50, Math.min(max, Math.round(amountRaw)));
  }
  return max;
}

export async function GET(request: Request, { params }: Params) {
  const userId = await getPortalUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  const { id } = await params;
  const supabase = crmClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, order_id, document_number, total_cents, currency, status")
    .eq("id", id)
    .maybeSingle();
  if (!invoice || invoice.status === "draft" || invoice.status === "void" || invoice.status === "paid") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("order_id", invoice.order_id)
    .maybeSingle();
  if (!project) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  const { data: membership } = await supabase
    .from("portal_memberships")
    .select("project_id")
    .eq("portal_user_id", userId)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  const amountCents = resolvePayAmountCents(
    Number(invoice.total_cents ?? 0),
    new URL(request.url).searchParams
  );

  const url = await createCrmCheckoutUrl({
    invoiceId: invoice.id,
    documentNumber: invoice.document_number,
    amountCents,
    currency: invoice.currency,
  });
  if (!url) {
    return NextResponse.redirect(new URL(`/portal/projects/${project.id}?pay=unavailable`, request.url));
  }
  return NextResponse.redirect(url);
}
