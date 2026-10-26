import { NextResponse } from "next/server";
import { listProjects } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json({ projects: await listProjects(profile.profileId) });
  } catch (error) {
    return crmError(error);
  }
}
