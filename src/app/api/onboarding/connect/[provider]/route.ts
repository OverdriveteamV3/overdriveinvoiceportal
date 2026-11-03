import { NextResponse } from "next/server";
import { intakeIdFromCookie, ONBOARDING_PROVIDER_COOKIE } from "@/lib/onboarding/intake";
import {
  githubConfigured,
  hostingerConfigured,
  stripeConnectConfigured,
  supabasePlanConfigured,
  vercelConfigured,
} from "@/lib/onboarding/providers";
import { requestOrigin, supabaseAuthConfigured } from "@/lib/supabase/env";

type Params = { params: Promise<{ provider: string }> };

function blocked(origin: string, provider: string) {
  const response = NextResponse.redirect(
    new URL(`/quote?step=2&stack=${provider}&error=not_configured`, origin)
  );
  return response;
}

export async function GET(request: Request, { params }: Params) {
  const { provider } = await params;
  const origin = requestOrigin(request);
  const intakeId = await intakeIdFromCookie();
  if (!intakeId) return NextResponse.redirect(new URL("/quote", origin));
  const redirectUri = `${origin}/api/onboarding/callback/${provider}`;

  if (provider === "gmail") {
    const response = NextResponse.redirect(
      new URL(`/auth/google?next=${encodeURIComponent("/quote?step=2")}`, origin)
    );
    response.cookies.set(ONBOARDING_PROVIDER_COOKIE, "gmail", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  }

  if (provider === "github" && supabaseAuthConfigured()) {
    const response = NextResponse.redirect(
      new URL(`/auth/github?next=${encodeURIComponent("/quote?step=2")}`, origin)
    );
    response.cookies.set(ONBOARDING_PROVIDER_COOKIE, "github", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  }

  const state = crypto.randomUUID();
  let target = "";
  if (provider === "github" && githubConfigured()) {
    target = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID!.trim())}&scope=read:user%20user:email&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else if (provider === "vercel" && vercelConfigured()) {
    target = `https://vercel.com/oauth/authorize?client_id=${encodeURIComponent(process.env.VERCEL_CLIENT_ID!.trim())}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else if (provider === "supabase" && supabasePlanConfigured()) {
    target = `https://api.supabase.com/v1/oauth/authorize?client_id=${encodeURIComponent(process.env.SUPABASE_OAUTH_CLIENT_ID!.trim())}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else if (provider === "hostinger" && hostingerConfigured()) {
    target = `https://auth.hostinger.com/oauth/authorize?client_id=${encodeURIComponent(process.env.HOSTINGER_CLIENT_ID!.trim())}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else if (provider === "stripe" && stripeConnectConfigured()) {
    target = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(process.env.STRIPE_CONNECT_CLIENT_ID!.trim())}&scope=read_only&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else if (provider === "paypal" && process.env.PAYPAL_CLIENT_ID?.trim()) {
    target = `https://www.paypal.com/signin/authorize?client_id=${encodeURIComponent(process.env.PAYPAL_CLIENT_ID.trim())}&response_type=code&scope=openid%20email&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else {
    return blocked(origin, provider);
  }

  const response = NextResponse.redirect(target);
  response.cookies.set("od_onboarding_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  response.cookies.set(ONBOARDING_PROVIDER_COOKIE, provider, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
