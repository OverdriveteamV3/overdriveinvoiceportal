import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  safeNextPath,
  upsertPortalUserFromGoogle,
} from "@/lib/crm/portal-account";
import {
  createPortalSession,
  PORTAL_SESSION_COOKIE,
  portalCookieOptions,
} from "@/lib/crm/portal-session";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  requestOrigin,
} from "@/lib/supabase/env";

const OAUTH_NEXT_COOKIE = "od_oauth_next";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(
    url.searchParams.get("next") ?? request.cookies.get(OAUTH_NEXT_COOKIE)?.value
  );

  const fail = (codeName: string) => {
    const response = NextResponse.redirect(
      new URL(`/sign-in?error=${codeName}&next=${encodeURIComponent(nextPath)}`, origin)
    );
    response.cookies.set(OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!code) return fail("google_code");

  const supabaseUrl = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!supabaseUrl || !anon) return fail("google_config");

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          pendingCookies.push(cookie);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession", error?.message ?? "no user");
    return fail("google_session");
  }

  const email = data.user.email ?? "";
  const name =
    (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name) ||
    (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name) ||
    "";
  const identities = data.user.identities ?? [];
  const googleIdentity = identities.find((identity) => identity.provider === "google");
  const sub =
    (typeof googleIdentity?.id === "string" && googleIdentity.id) ||
    (typeof data.user.user_metadata?.sub === "string" && data.user.user_metadata.sub) ||
    data.user.id;

  const result = await upsertPortalUserFromGoogle({ email, name, sub });
  if ("error" in result) {
    console.error("[auth/callback] upsertPortalUserFromGoogle", result.error);
    return fail("google_account");
  }

  const response = NextResponse.redirect(new URL(nextPath, origin));
  for (const { name: cookieName, value, options } of pendingCookies) {
    response.cookies.set(cookieName, value, options);
  }
  response.cookies.set(PORTAL_SESSION_COOKIE, createPortalSession(result.id), portalCookieOptions());
  response.cookies.set(OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
