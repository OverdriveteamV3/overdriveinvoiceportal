import { NextResponse } from "next/server";
import { completeTask, listTasks } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json({ tasks: await listTasks(profile.profileId) });
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const body = await request.json();
  try {
    await completeTask(String(body.id ?? ""), profile.profileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmError(error);
  }
}
