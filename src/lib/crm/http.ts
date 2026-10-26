import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import { isCrmEnabled } from "@/lib/crm/db";

export async function requireCrmAdmin() {
  if (!isCrmEnabled()) {
    return NextResponse.json({ error: "CRM is disabled." }, { status: 404 });
  }
  const profile = await getAdminSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return profile;
}

export function crmError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
}
