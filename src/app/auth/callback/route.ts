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
import { getIntake, intakeIdFromCookie, patchStack } from "@/lib/onboarding/intake";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  requestOrigin,
} from "@/lib/supabase/env";

const OAUTH_NEXT_COOKIE = "od_oauth_next";
const OAUTH_FLOW_COOKIE = "od_oauth_flow";

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
    response.cookies.set(OAUTH_FLOW_COOKIE, "", { path: "/", maxAge: 0 });
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

  const flowId = request.cookies.get(OAUTH_FLOW_COOKIE)?.value ?? "";
  const flowCookiePresent =
    Boolean(flowId) && request.cookies.getAll().some((cookie) => cookie.name.includes(flowId));
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowCookiePresent ? { flowId } : undefined
  );
  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession", error?.message ?? "no user");
    return fail("google_session");
  }

  const email = data.user.email ?? "";
  const name =
    (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name) ||
    (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name) ||
    "";
  const avatarUrl =
    (typeof data.user.user_metadata?.avatar_url === "string" && data.user.user_metadata.avatar_url) ||
    (typeof data.user.user_metadata?.picture === "string" && data.user.user_metadata.picture) ||
    "";
  const identities = data.user.identities ?? [];
  const googleIdentity = identities.find((identity) => identity.provider === "google");
  const sub =
    (typeof googleIdentity?.id === "string" && googleIdentity.id) ||
    (typeof data.user.user_metadata?.sub === "string" && data.user.user_metadata.sub) ||
    data.user.id;

  if (request.cookies.get("od_onboarding_provider")?.value === "github") {
    const intake = await getIntake(await intakeIdFromCookie());
    const githubIdentity = identities.find((identity) => identity.provider === "github");
    const metadata = (githubIdentity?.identity_data ?? data.user.user_metadata ?? {}) as Record<string, unknown>;
    const login =
      (typeof metadata.user_name === "string" && metadata.user_name) ||
      (typeof metadata.preferred_username === "string" && metadata.preferred_username) ||
      "";
    const githubEmail = email.trim().toLowerCase();
    const gmail = intake?.stack.gmail?.email?.trim().toLowerCase() ?? "";
    const matches = Boolean(intake && githubEmail && gmail && githubEmail === gmail);
    const response = NextResponse.redirect(
      new URL(matches ? "/quote?step=2" : "/quote?step=2&stack=github&error=mismatch", origin)
    );
    response.cookies.set("od_onboarding_provider", "", { path: "/", maxAge: 0 });
    response.cookies.set(OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(OAUTH_FLOW_COOKIE, "", { path: "/", maxAge: 0 });
    if (matches && intake) {
      await patchStack(intake.id, { github: { login, email: githubEmail, verified: true } });
    }
    return response;
  }

  if (request.cookies.get("od_onboarding_provider")?.value === "gmail") {
    const intake = await getIntake(await intakeIdFromCookie());
    const gmail = email.trim().toLowerCase();
    const response = NextResponse.redirect(
      new URL(gmail.endsWith("@gmail.com") && intake ? "/quote?step=2" : "/quote?step=2&stack=gmail&error=gmail", origin)
    );
    response.cookies.set("od_onboarding_provider", "", { path: "/", maxAge: 0 });
    response.cookies.set(OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(OAUTH_FLOW_COOKIE, "", { path: "/", maxAge: 0 });
    if (intake && gmail.endsWith("@gmail.com")) {
      await patchStack(intake.id, { gmail: { email: gmail, verified: true } });
    }
    return response;
  }

  const result = await upsertPortalUserFromGoogle({ email, name, sub, avatarUrl });
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
  response.cookies.set(OAUTH_FLOW_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
