import { NextResponse } from "next/server";
import { requireMasterAdmin } from "@/lib/admin-auth-server";
import {
  getSecurityOverview,
  setMaintenanceContactEmail,
  setMaintenanceMessage,
  setSiteMaintenance,
} from "@/lib/site-security";

export async function PATCH(request: Request) {
  const gate = await requireMasterAdmin();
  if (gate instanceof NextResponse) return gate;

  let body: { maintenance?: unknown; email?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const hasMaintenance = typeof body.maintenance === "boolean";
  const hasEmail = typeof body.email === "string";
  const hasMessage = typeof body.message === "string";
  if (!hasMaintenance && !hasEmail && !hasMessage) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    if (hasMaintenance) await setSiteMaintenance(body.maintenance as boolean);
    if (hasEmail) await setMaintenanceContactEmail(body.email as string);
    if (hasMessage) await setMaintenanceMessage(body.message as string);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update maintenance.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(await getSecurityOverview());
}
