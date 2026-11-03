import { NextResponse } from "next/server";
import { getIntake, intakeIdFromCookie, patchStack } from "@/lib/onboarding/intake";
import { isProPlan, paypalApiBase } from "@/lib/onboarding/providers";
import { requestOrigin } from "@/lib/supabase/env";

type Params = { params: Promise<{ provider: string }> };

function done(origin: string, provider: string, error?: string) {
  const url = new URL("/quote?step=2", origin);
  url.searchParams.set("stack", provider);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set("od_onboarding_state", "", { path: "/", maxAge: 0 });
  response.cookies.set("od_onboarding_provider", "", { path: "/", maxAge: 0 });
  return response;
}

async function formToken(url: string, body: URLSearchParams): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await response.json()) as { access_token?: string };
  if (!response.ok || !json.access_token) throw new Error("token");
  return json.access_token;
}

export async function GET(request: Request, { params }: Params) {
  const { provider } = await params;
  const origin = requestOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const expected = request.headers.get("cookie")?.match(/(?:^|;\s*)od_onboarding_state=([^;]+)/)?.[1] ?? "";
  const row = await getIntake(await intakeIdFromCookie());
  if (!row || !code || !state || state !== decodeURIComponent(expected)) return done(origin, provider, "not_configured");

  try {
    if (provider === "github") {
      const token = await formToken("https://github.com/login/oauth/access_token", new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!.trim(),
        client_secret: process.env.GITHUB_CLIENT_SECRET!.trim(),
        code,
        redirect_uri: `${origin}/api/onboarding/callback/github`,
      }));
      const emails = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "overdrive" },
      });
      const list = (await emails.json()) as Array<{ email?: string; primary?: boolean; verified?: boolean }>;
      const primary = list.find((item) => item.primary && item.verified)?.email?.toLowerCase() ?? "";
      const gmail = row.stack.gmail?.email?.toLowerCase() ?? "";
      if (!primary || primary !== gmail) return done(origin, provider, "mismatch");
      const profile = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "overdrive" },
      });
      const user = (await profile.json()) as { login?: string };
      await patchStack(row.id, { github: { login: user.login ?? "", email: primary, verified: true } });
    } else if (provider === "vercel") {
      const token = await formToken("https://api.vercel.com/v2/oauth/access_token", new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID!.trim(),
        client_secret: process.env.VERCEL_CLIENT_SECRET!.trim(),
        code,
        redirect_uri: `${origin}/api/onboarding/callback/vercel`,
      }));
      const teams = await fetch("https://api.vercel.com/v2/teams", { headers: { Authorization: `Bearer ${token}` } });
      const body = (await teams.json()) as { teams?: Array<{ billing?: { plan?: string } }> };
      const plan = body.teams?.find((team) => isProPlan(team.billing?.plan ?? ""))?.billing?.plan ?? body.teams?.[0]?.billing?.plan ?? "";
      if (!isProPlan(plan)) return done(origin, provider, "plan");
      await patchStack(row.id, { vercel: { plan: "pro", verified: true } });
    } else if (provider === "supabase") {
      const token = await formToken("https://api.supabase.com/v1/oauth/token", new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SUPABASE_OAUTH_CLIENT_ID!.trim(),
        client_secret: process.env.SUPABASE_OAUTH_CLIENT_SECRET!.trim(),
        code,
        redirect_uri: `${origin}/api/onboarding/callback/supabase`,
      }));
      const orgs = await fetch("https://api.supabase.com/v1/organizations", { headers: { Authorization: `Bearer ${token}` } });
      const list = (await orgs.json()) as Array<{ plan?: string }>;
      const plan = list.find((org) => isProPlan(org.plan ?? ""))?.plan ?? list[0]?.plan ?? "";
      if (!isProPlan(plan)) return done(origin, provider, "plan");
      await patchStack(row.id, { supabase: { plan: "pro", verified: true } });
    } else if (provider === "hostinger") {
      const token = await formToken("https://auth.hostinger.com/oauth/token", new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HOSTINGER_CLIENT_ID!.trim(),
        client_secret: process.env.HOSTINGER_CLIENT_SECRET!.trim(),
        code,
        redirect_uri: `${origin}/api/onboarding/callback/hostinger`,
      }));
      const domains = await fetch("https://developers.hostinger.com/api/domains/v1/portfolio", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await domains.json()) as { data?: Array<{ domain?: string }> };
      const domain = body.data?.[0]?.domain ?? "";
      if (!domain) return done(origin, provider, "domain");
      await patchStack(row.id, { hostinger: { domain, token, verified: true } });
    } else if (provider === "stripe") {
      const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_secret: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
          code,
        }),
      });
      const tokenBody = (await tokenResponse.json()) as { stripe_user_id?: string };
      if (!tokenBody.stripe_user_id) return done(origin, provider, "plan");
      await patchStack(row.id, { payments: { provider: "stripe", plan: "active", verified: true } });
    } else if (provider === "paypal") {
      const token = await formToken(`${paypalApiBase()}/v1/oauth2/token`, new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/api/onboarding/callback/paypal`,
      }));
      if (!token) return done(origin, provider, "plan");
      await patchStack(row.id, { payments: { provider: "paypal", plan: "active", verified: true } });
    } else {
      return done(origin, provider, "not_configured");
    }
  } catch {
    return done(origin, provider, "not_configured");
  }
  return done(origin, provider);
}
