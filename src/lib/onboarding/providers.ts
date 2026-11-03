export const ONBOARDING_DEPOSIT_CENTS = 10800;

export const STACK_LINKS = {
  gmail: "https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp",
  hostinger: "https://www.hostinger.com/domain-name-search",
  github: "https://github.com/signup",
  vercel: "https://vercel.com/signup",
  supabase: "https://supabase.com/dashboard/sign-up",
  stripe: "https://dashboard.stripe.com/register",
  paypal: "https://www.paypal.com/bizsignup",
} as const;

export function gmailConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim());
}

export async function githubSignInReady(): Promise<boolean> {
  if (githubConfigured()) return true;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return false;
  const settings = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
    .then((response) => response.json())
    .catch(() => null);
  return Boolean(settings && typeof settings === "object" && (settings as { external?: { github?: boolean } }).external?.github);
}

export function hostingerConfigured(): boolean {
  return Boolean(process.env.HOSTINGER_CLIENT_ID?.trim() && process.env.HOSTINGER_CLIENT_SECRET?.trim());
}

export function vercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_CLIENT_ID?.trim() && process.env.VERCEL_CLIENT_SECRET?.trim());
}

export function supabasePlanConfigured(): boolean {
  return Boolean(process.env.SUPABASE_OAUTH_CLIENT_ID?.trim() && process.env.SUPABASE_OAUTH_CLIENT_SECRET?.trim());
}

export function stripeConnectConfigured(): boolean {
  return Boolean(process.env.STRIPE_CONNECT_CLIENT_ID?.trim());
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

export function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function providerStatus() {
  return {
    gmail: gmailConfigured(),
    github: githubConfigured(),
    hostinger: hostingerConfigured(),
    vercel: vercelConfigured(),
    supabase: supabasePlanConfigured(),
    stripe: stripeConnectConfigured(),
    paypal: paypalConfigured(),
    depositStripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    depositPaypal: paypalConfigured(),
  };
}

export async function paypalAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID?.trim() ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim() ?? "";
  if (!id || !secret) throw new Error("PayPal is not configured.");
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await response.json()) as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error("PayPal authorization failed.");
  return body.access_token;
}

export function isProPlan(value: string): boolean {
  return value.trim().toLowerCase() === "pro";
}
