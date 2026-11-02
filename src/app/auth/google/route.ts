import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/crm/portal-account";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  requestOrigin,
  supabaseAuthConfigured,
} from "@/lib/supabase/env";

const OAUTH_NEXT_COOKIE = "od_oauth_next";
const OAUTH_FLOW_COOKIE = "od_oauth_flow";

function continueToGoogleHtml(target: string) {
  const scriptUrl = JSON.stringify(target).replace(/</g, "\\u003c");
  const href = target
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<title>Continue with Google</title>
</head>
<body>
<p>Continuing to Google…</p>
<p><a href="${href}">Continue</a></p>
<script>location.replace(${scriptUrl})</script>
</body>
</html>`;
}

function applyAuthCookies(
  response: NextResponse,
  cookies: { name: string; value: string; options: Record<string, unknown> }[],
  secure: boolean
) {
  for (const cookie of cookies) {
    const sameSite = cookie.options.sameSite;
    response.cookies.set(cookie.name, cookie.value, {
      path: typeof cookie.options.path === "string" ? cookie.options.path : "/",
      ...(typeof cookie.options.maxAge === "number" ? { maxAge: cookie.options.maxAge } : {}),
      httpOnly: cookie.options.httpOnly === true,
      secure,
      sameSite: sameSite === "strict" || sameSite === "none" || sameSite === "lax" ? sameSite : "lax",
    });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const nextPath = safeNextPath(url.searchParams.get("next") ?? undefined);

  if (!supabaseAuthConfigured()) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=google_config&next=${encodeURIComponent(nextPath)}`, origin)
    );
  }

  const supabaseUrl = getSupabaseUrl()!;
  const anon = getSupabaseAnonKey()!;
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  const authorizePrefix = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize`;
  if (error || !data.url || !data.url.startsWith(authorizePrefix)) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=google_start&next=${encodeURIComponent(nextPath)}`, origin)
    );
  }

  // A document response stores the PKCE cookie before the browser leaves for Google.
  // A redirect straight to Google can drop that cookie, so the first return fails.
  const secure = origin.startsWith("https://");
  const response = new NextResponse(continueToGoogleHtml(data.url), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
  applyAuthCookies(response, pendingCookies, secure);
  response.cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });
  if (data.flowId) {
    response.cookies.set(OAUTH_FLOW_COOKIE, data.flowId, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 10,
    });
  }
  return response;
}
