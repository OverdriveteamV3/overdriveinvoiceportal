import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import {
  getIntegrationPublicView,
  removeIntegrationService,
  saveIntegrationService,
  type IntegrationService,
} from "@/lib/integration-settings";

const SERVICES: IntegrationService[] = ["storage", "email", "sms", "stripe"];

function isService(value: unknown): value is IntegrationService {
  return SERVICES.includes(value as IntegrationService);
}

export async function GET() {
  const profile = await getAdminSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const integrations = await getIntegrationPublicView();
  return NextResponse.json({ integrations });
}

export async function PATCH(request: Request) {
  const profile = await getAdminSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: { service?: unknown; action?: unknown } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isService(body.service)) {
    return NextResponse.json({ error: "Unknown integration." }, { status: 400 });
  }

  try {
    if (body.action === "remove") {
      await removeIntegrationService(body.service);
    } else if (body.action === "save") {
      await saveIntegrationService(body.service, body);
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update this connection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const integrations = await getIntegrationPublicView();
  return NextResponse.json({ integrations });
}
