import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import {
  createTeamMember,
  listTeamMembers,
  removeTeamMember,
} from "@/lib/team-members";

async function requireAdmin() {
  const profile = await getAdminSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return profile;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const members = await listTeamMembers();
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: { name?: string; email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const member = await createTeamMember({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      role: String(body.role ?? ""),
    });
    return NextResponse.json({ member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add this team member.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing team member." }, { status: 400 });
  }
  try {
    await removeTeamMember(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove this team member.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
