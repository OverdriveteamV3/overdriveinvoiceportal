import { NextResponse } from "next/server";
import { decideClientQuote } from "@/lib/crm/db";
import { getPortalAccount } from "@/lib/crm/portal-account";

export async function POST(request: Request) {
  const account = await getPortalAccount();
  if (!account) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json()) as { opportunityId?: string; decision?: string; memo?: string };
  const decision = body.decision === "accept" || body.decision === "decline" || body.decision === "negotiate" ? body.decision : "";
  if (!decision || !body.opportunityId) {
    return NextResponse.json({ error: "Choose accept, decline, or negotiate." }, { status: 400 });
  }
  try {
    await decideClientQuote({
      email: account.email,
      opportunityId: body.opportunityId,
      decision,
      memo: body.memo,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that decision.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
