"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticatePortalAccount,
  registerPortalAccount,
  safeNextPath,
} from "@/lib/crm/portal-account";
import {
  createPortalSession,
  PORTAL_SESSION_COOKIE,
  portalCookieOptions,
} from "@/lib/crm/portal-session";

async function startSession(portalUserId: string, nextPath: string) {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, createPortalSession(portalUserId), portalCookieOptions());
  redirect(nextPath);
}

export async function signOutAccount() {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, "", { ...portalCookieOptions(), maxAge: 0 });
  redirect("/");
}

export async function signInAccount(formData: FormData): Promise<{ error: string }> {
  const result = await authenticatePortalAccount({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if ("error" in result) return result;
  await startSession(result.id, safeNextPath(String(formData.get("next") ?? "")));
  return { error: "" };
}

export async function signUpAccount(formData: FormData): Promise<{ error: string }> {
  const result = await registerPortalAccount({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if ("error" in result) return result;
  await startSession(result.id, safeNextPath(String(formData.get("next") ?? "")));
  return { error: "" };
}
