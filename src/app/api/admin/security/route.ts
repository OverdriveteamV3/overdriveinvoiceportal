import { NextResponse } from "next/server";
import { requireMasterAdmin } from "@/lib/admin-auth-server";
import { getSecurityOverview, setSiteMaintenance } from "@/lib/site-security";

export async function PATCH(request: Request) {
  const gate = await requireMasterAdmin();
  if (gate instanceof NextResponse) return gate;

  let body: { maintenance?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.maintenance !== "boolean") {
    return NextResponse.json({ error: "Choose on or off." }, { status: 400 });
  }

  await setSiteMaintenance(body.maintenance);
  return NextResponse.json(await getSecurityOverview());
}
