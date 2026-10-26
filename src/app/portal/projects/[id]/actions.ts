"use server";

import { revalidatePath } from "next/cache";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";

export async function submitPortalRevision(formData: FormData) {
  const userId = await getPortalUserId();
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!userId || !projectId || !title || !body) return;

  const supabase = crmClient();
  const { data: membership } = await supabase
    .from("portal_memberships")
    .select("project_id")
    .eq("portal_user_id", userId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!membership) return;

  const { data: round } = await supabase
    .from("revision_rounds")
    .insert({
      project_id: projectId,
      kind: "included",
      state: "submitted",
      title,
      consumes_allowance: false,
    })
    .select("id")
    .single();
  if (!round) return;
  await supabase.from("revision_items").insert({ round_id: round.id, body });
  revalidatePath(`/portal/projects/${projectId}`);
}
