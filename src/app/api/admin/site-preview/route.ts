import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import { SITE_PREVIEW_COOKIE } from "@/lib/site-preview";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function GET(request: Request) {
  const profile = await getAdminSessionProfile();
  if (!profile || profile.role !== "master") {
    return NextResponse.redirect(new URL("/admin/sign-in?from=%2Fadmin%2Fsettings", request.url));
  }

  const exit = new URL(request.url).searchParams.get("exit") === "1";
  const response = NextResponse.redirect(new URL("/", request.url));
  if (exit) {
    response.cookies.set(SITE_PREVIEW_COOKIE, "", { ...cookieBase, maxAge: 0 });
    return response;
  }

  response.cookies.set(SITE_PREVIEW_COOKIE, "1", cookieBase);
  return response;
}
