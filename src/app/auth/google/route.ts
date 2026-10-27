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

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=google_start&next=${encodeURIComponent(nextPath)}`, origin)
    );
  }

  const response = NextResponse.redirect(data.url);
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }
  response.cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
