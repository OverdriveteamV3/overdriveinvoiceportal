import { NextResponse } from "next/server";
import { acceptAgreement, listOrders } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json({ orders: await listOrders(profile.profileId) });
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  if (body.action !== "accept-agreement" || !body.agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }
  try {
    await acceptAgreement({
      profileId: profile.profileId,
      agreementId: String(body.agreementId),
      actor: profile.username,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
