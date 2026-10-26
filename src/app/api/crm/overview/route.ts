import { NextResponse } from "next/server";
import { overview } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await overview(profile.profileId));
  } catch (error) {
    return crmError(error);
  }
}
