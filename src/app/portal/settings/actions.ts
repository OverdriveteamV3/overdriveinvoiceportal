"use server";

import { revalidatePath } from "next/cache";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";

export async function updatePortalProfile(formData: FormData): Promise<{ error: string }> {
  const userId = await getPortalUserId();
  if (!userId) return { error: "Sign in required." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!name) return { error: "Add your name." };

  const { error } = await crmClient()
    .from("portal_users")
    .update({ name })
    .eq("id", userId);
  if (error) return { error: "Could not save your profile." };

  revalidatePath("/portal");
  revalidatePath("/portal/settings");
  return { error: "" };
}
