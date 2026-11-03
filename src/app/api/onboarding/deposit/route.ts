import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getIntake, intakeIdFromCookie } from "@/lib/onboarding/intake";
import { ONBOARDING_DEPOSIT_CENTS, paypalAccessToken, paypalApiBase, paypalConfigured } from "@/lib/onboarding/providers";
import { resolveStripeSecret } from "@/lib/integration-settings";
import { requestOrigin } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const row = await getIntake(await intakeIdFromCookie());
  if (!row) return NextResponse.json({ error: "Start the request again." }, { status: 404 });
  const body = (await request.json()) as { provider?: string };
  const provider = body.provider === "paypal" || body.provider === "venmo" ? body.provider : "stripe";
  const origin = requestOrigin(request);
  const amount = (ONBOARDING_DEPOSIT_CENTS / 100).toFixed(2);

  if (provider === "stripe") {
    const key = await resolveStripeSecret();
    if (!key) return NextResponse.json({ error: "not_configured" }, { status: 400 });
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: row.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Over Drive onboarding deposit", description: "$100 plus 8% tax" },
            unit_amount: ONBOARDING_DEPOSIT_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: { intakeId: row.id, kind: "onboarding-deposit" },
      success_url: `${origin}/api/onboarding/deposit/confirm?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quote?step=4`,
    });
    return NextResponse.json({ url: session.url });
  }

  if (!paypalConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 400 });
  const token = await paypalAccessToken();
  const order = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: row.id,
          description: provider === "venmo" ? "Over Drive deposit via Venmo" : "Over Drive onboarding deposit",
          amount: { currency_code: "USD", value: amount },
        },
      ],
      application_context: {
        return_url: `${origin}/api/onboarding/deposit/confirm?provider=${provider}`,
        cancel_url: `${origin}/quote?step=4`,
        user_action: "PAY_NOW",
      },
    }),
  });
  const created = (await order.json()) as { id?: string; links?: Array<{ rel: string; href: string }> };
  const approve = created.links?.find((link) => link.rel === "approve")?.href;
  if (!order.ok || !approve || !created.id) {
    return NextResponse.json({ error: "Could not start PayPal checkout." }, { status: 502 });
  }
  const url = provider === "venmo" ? `${approve}&fundingSource=venmo` : approve;
  return NextResponse.json({ url, orderId: created.id });
}
