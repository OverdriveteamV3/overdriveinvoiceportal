import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE = "overdrive-client-session";

function sessionSecret(): string {
  const value =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.PDF_DOWNLOAD_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.SMTP_PASS?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "overdrive-local-admin-session-dev";
  throw new Error("Session secret is not configured.");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function createPortalSession(portalUserId: string): string {
  const body = Buffer.from(
    JSON.stringify({ u: portalUserId, e: Date.now() + 30 * 24 * 60 * 60 * 1000, k: "portal" })
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readPortalUserId(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      u?: string;
      e?: number;
      k?: string;
    };
    if (payload.k !== "portal" || !payload.u || !payload.e || payload.e < Date.now()) return null;
    return payload.u;
  } catch {
    return null;
  }
}

export async function getPortalUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return readPortalUserId(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
}

export function portalCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };
}
