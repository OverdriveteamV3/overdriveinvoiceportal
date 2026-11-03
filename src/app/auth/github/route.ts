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

function continueHtml(target: string) {
  const scriptUrl = JSON.stringify(target).replace(/</g, "\\u003c");
  const href = target.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<title>Continue with GitHub</title>
</head>
<body>
<p>Continuing to GitHub…</p>
<p><a href="${href}">Continue</a></p>
<script>location.replace(${scriptUrl})</script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const nextPath = safeNextPath(url.searchParams.get("next") ?? "/quote?step=2");
  const back = (error: string) =>
    NextResponse.redirect(new URL(`/quote?step=2&stack=github&error=${error}`, origin));

  if (!supabaseAuthConfigured()) return back("not_configured");

  const supabaseUrl = getSupabaseUrl()!;
  const anon = getSupabaseAnonKey()!;
  const settings = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  }).then((response) => response.json().catch(() => null));
  const githubOn = Boolean(
    settings &&
      typeof settings === "object" &&
      (settings as { external?: { github?: boolean } }).external?.github
  );
  if (!githubOn) return back("github_off");

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) pendingCookies.push(cookie);
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: "read:user user:email",
    },
  });

  const authorizePrefix = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize`;
  if (error || !data.url || !data.url.startsWith(authorizePrefix)) return back("not_configured");

  const secure = origin.startsWith("https://");
  const response = new NextResponse(continueHtml(data.url), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
  for (const cookie of pendingCookies) {
    const sameSite = cookie.options.sameSite;
    response.cookies.set(cookie.name, cookie.value, {
      path: typeof cookie.options.path === "string" ? cookie.options.path : "/",
      ...(typeof cookie.options.maxAge === "number" ? { maxAge: cookie.options.maxAge } : {}),
      httpOnly: cookie.options.httpOnly === true,
      secure,
      sameSite: sameSite === "strict" || sameSite === "none" || sameSite === "lax" ? sameSite : "lax",
    });
  }
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
