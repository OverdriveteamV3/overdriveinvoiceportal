import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import { getAdminInbox } from "@/lib/admin-inbox";
import { sendPlainEmail } from "@/lib/invoice-email-server";

export async function GET() {
  const profile = await getAdminSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json(await getAdminInbox());
}

export async function POST(request: Request) {
  const profile = await getAdminSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 180) : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!to.includes("@") || !subject || !text) {
    return NextResponse.json({ error: "Add a recipient, subject, and message." }, { status: 400 });
  }
  try {
    await sendPlainEmail({ to, subject, text });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send this email.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
