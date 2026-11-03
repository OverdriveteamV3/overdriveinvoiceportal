import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

const CANONICAL_ORIGIN = "https://www.overdriveio.com";

function oauthCodeRedirect(request: NextRequest): NextResponse | null {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || request.nextUrl.pathname === "/auth/callback") return null;
  if (!/^[0-9a-f-]{36}$/i.test(code)) return null;

  const host = request.nextUrl.host;
  const sameHost =
    host === "www.overdriveio.com" ||
    host === "overdriveio.com" ||
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:");
  const target = sameHost
    ? new URL("/auth/callback", request.url)
    : new URL("/auth/callback", CANONICAL_ORIGIN);
  target.searchParams.set("code", code);
  return NextResponse.redirect(target);
}

export async function middleware(request: NextRequest) {
  const oauthRedirect = oauthCodeRedirect(request);
  if (oauthRedirect) return oauthRedirect;

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  if (pathname.startsWith("/admin/sign-in")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const profile = await verifyAdminSessionToken(token);
    if (profile) {
      const from = request.nextUrl.searchParams.get("from");
      const destination =
        from && from.startsWith("/admin") && !from.startsWith("/admin/sign-in")
          ? from
          : "/admin";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const profile = await verifyAdminSessionToken(token);

  if (!profile) {
    const signInUrl = new URL("/admin/sign-in", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
