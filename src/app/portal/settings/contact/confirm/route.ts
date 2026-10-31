import { NextResponse } from "next/server";
import { confirmSecondaryEmail } from "@/lib/crm/portal-account";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await confirmSecondaryEmail(url.searchParams.get("token") ?? "");
  const notice = "error" in result ? "contact-error" : "contact-confirmed";
  return NextResponse.redirect(new URL(`/portal/settings?notice=${notice}`, url.origin));
}
