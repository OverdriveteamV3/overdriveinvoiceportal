import { NextResponse } from "next/server";
import Stripe from "stripe";
import { crmClient, syncPaidDeposit } from "@/lib/crm/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!webhookSecret || !secretKey) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = crmClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    const providerId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.id;
    if (!invoiceId || session.payment_status !== "paid") {
      return NextResponse.json({ ignored: true });
    }
    const { error } = await supabase.rpc("crm_ingest_stripe_event", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_invoice_id: invoiceId,
      p_provider_payment_id: providerId,
      p_amount_cents: session.amount_total ?? 0,
      p_currency: session.currency ?? "usd",
      p_status: "succeeded",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await syncPaidDeposit(invoiceId);
  }

  if (event.type === "charge.refunded") {
    const { error: insertError } = await supabase.from("stripe_events").insert({
      id: event.id,
      event_type: event.type,
    });
    if (insertError?.code === "23505") return NextResponse.json({ duplicate: true });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    const charge = event.data.object;
    const providerId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id;
    const refund = charge.refunds?.data?.[0];
    if (refund) {
      const { data: payment } = await supabase
        .from("payments")
        .select("id")
        .eq("provider", "stripe")
        .eq("provider_id", providerId)
        .maybeSingle();
      if (payment) {
        const { error } = await supabase.rpc("crm_record_refund", {
          p_payment_id: payment.id,
          p_amount_cents: refund.amount,
          p_provider_id: refund.id,
          p_reason: "Stripe refund",
          p_actor: "stripe-webhook",
        });
        if (error && error.code !== "23505") {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
