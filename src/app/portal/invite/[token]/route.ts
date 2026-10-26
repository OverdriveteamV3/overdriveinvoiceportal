import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import {
  createPortalSession,
  hashInviteToken,
  PORTAL_SESSION_COOKIE,
  portalCookieOptions,
} from "@/lib/crm/portal-session";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const supabase = crmClient();
  const { data: invite } = await supabase
    .from("portal_invites")
    .select("id, client_id, project_id, email, expires_at, used_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();

  if (!invite || invite.used_at || new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL("/portal?error=invite", request.url));
  }

  const { data: existing } = await supabase
    .from("portal_users")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle();

  let portalUserId = existing?.id as string | undefined;
  if (!portalUserId) {
    const { data: created, error } = await supabase
      .from("portal_users")
      .insert({ client_id: invite.client_id, email: invite.email })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.redirect(new URL("/portal?error=invite", request.url));
    }
    portalUserId = created.id as string;
  }
  if (!portalUserId) {
    return NextResponse.redirect(new URL("/portal?error=invite", request.url));
  }

  await supabase.from("portal_memberships").upsert({
    portal_user_id: portalUserId,
    project_id: invite.project_id,
  });
  await supabase
    .from("portal_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  const response = NextResponse.redirect(new URL("/portal", request.url));
  response.cookies.set(PORTAL_SESSION_COOKIE, createPortalSession(portalUserId), portalCookieOptions());
  return response;
}
