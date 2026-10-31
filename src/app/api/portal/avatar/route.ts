import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";

function bytesFromDb(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (typeof value !== "string" || !value) return null;
  const hex = value.startsWith("\\x") ? value.slice(2) : "";
  if (hex && /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
    return new Uint8Array(Buffer.from(hex, "hex"));
  }
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.byteLength ? new Uint8Array(decoded) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getPortalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data } = await crmClient()
    .from("portal_users")
    .select("avatar_bytes, avatar_content_type")
    .eq("id", userId)
    .maybeSingle();
  const bytes = bytesFromDb(data?.avatar_bytes);
  const type = typeof data?.avatar_content_type === "string" ? data.avatar_content_type : "";
  if (!bytes || !type) return NextResponse.json({ error: "No photo." }, { status: 404 });

  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new NextResponse(body as ArrayBuffer, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
