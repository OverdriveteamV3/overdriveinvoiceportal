import { NextResponse } from "next/server";
import { confirmPortalEmailChange } from "@/lib/crm/portal-account";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await confirmPortalEmailChange(url.searchParams.get("token") ?? "");
  const notice = "error" in result ? "email-error" : "email-confirmed";
  return NextResponse.redirect(new URL(`/portal/settings?notice=${notice}`, url.origin));
}
