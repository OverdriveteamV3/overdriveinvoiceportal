import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getIntake, intakeIdFromCookie, markPaid } from "@/lib/onboarding/intake";
import { paypalAccessToken, paypalApiBase } from "@/lib/onboarding/providers";
import { resolveStripeSecret } from "@/lib/integration-settings";
import { requestOrigin } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "";
  const row = await getIntake(await intakeIdFromCookie());
  const back = (error: string) => NextResponse.redirect(new URL(`/quote?step=4&payError=${error}`, origin));
  if (!row) return back("missing");

  try {
    if (provider === "stripe") {
      const key = await resolveStripeSecret();
      const sessionId = url.searchParams.get("session_id") ?? "";
      if (!key || !sessionId) return back("not_configured");
      const stripe = new Stripe(key);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.intakeId !== row.id || session.payment_status !== "paid") return back("unpaid");
      await markPaid(row.id, "stripe", sessionId);
    } else if (provider === "paypal" || provider === "venmo") {
      const orderId = url.searchParams.get("token") ?? "";
      if (!orderId) return back("unpaid");
      const token = await paypalAccessToken();
      const captured = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const body = (await captured.json()) as { status?: string };
      if (!captured.ok || (body.status !== "COMPLETED" && body.status !== "APPROVED")) return back("unpaid");
      await markPaid(row.id, provider, orderId);
    } else {
      return back("unpaid");
    }
  } catch {
    return back("unpaid");
  }

  return NextResponse.redirect(new URL("/quote?step=4&paid=1", origin));
}
