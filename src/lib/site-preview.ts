import { cookies } from "next/headers";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";

export const SITE_PREVIEW_COOKIE = "overdrive-dev-preview";

export async function isDevSitePreview(): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get(SITE_PREVIEW_COOKIE)?.value !== "1") return false;
  const profile = await getAdminSessionProfile();
  return profile?.role === "master";
}
