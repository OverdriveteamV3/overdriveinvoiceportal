"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticatePortalAccount,
  registerPortalAccount,
  requestPortalPasswordReset,
  resetPortalPassword,
  safeNextPath,
} from "@/lib/crm/portal-account";
import {
  createPortalSession,
  PORTAL_REMEMBER_TTL_MS,
  PORTAL_SESSION_COOKIE,
  PORTAL_SHORT_TTL_MS,
  portalCookieOptions,
} from "@/lib/crm/portal-session";

async function startSession(portalUserId: string, nextPath: string, rememberMe: boolean) {
  const ttlMs = rememberMe ? PORTAL_REMEMBER_TTL_MS : PORTAL_SHORT_TTL_MS;
  const jar = await cookies();
  jar.set(
    PORTAL_SESSION_COOKIE,
    createPortalSession(portalUserId, ttlMs),
    portalCookieOptions(ttlMs / 1000)
  );
  redirect(nextPath);
}

function wantsRemember(formData: FormData): boolean {
  const value = String(formData.get("rememberMe") ?? "").toLowerCase();
  return value === "on" || value === "true" || value === "1";
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
  await startSession(
    result.id,
    safeNextPath(String(formData.get("next") ?? "")),
    wantsRemember(formData)
  );
  return { error: "" };
}

export async function signUpAccount(formData: FormData): Promise<{ error: string }> {
  const result = await registerPortalAccount({
    name: String(formData.get("name") ?? ""),
    businessName: String(formData.get("businessName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if ("error" in result) return result;
  await startSession(result.id, safeNextPath(String(formData.get("next") ?? "")), true);
  return { error: "" };
}

export async function requestAccountReset(
  formData: FormData
): Promise<{ error: string } | { ok: true; message: string }> {
  const result = await requestPortalPasswordReset(String(formData.get("email") ?? ""));
  if ("error" in result) return result;
  return {
    ok: true,
    message:
      "If an account exists for that email, we sent a reset link. Check your inbox (and spam).",
  };
}

export async function completeAccountReset(
  formData: FormData
): Promise<{ error: string }> {
  const result = await resetPortalPassword({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if ("error" in result) return result;
  await startSession(result.id, "/portal", true);
  return { error: "" };
}
