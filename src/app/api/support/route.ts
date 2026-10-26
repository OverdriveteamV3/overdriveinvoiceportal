import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SUPPORT_COOKIE, postVisitorMessage, readVisitorThread } from "@/lib/crm/support";

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SUPPORT_COOKIE)?.value ?? null;
    return NextResponse.json(await readVisitorThread(token));
  } catch (error) {
    console.error("Support status failed:", error);
    return NextResponse.json({ online: false, name: "", email: "", messages: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const existing = cookieStore.get(SUPPORT_COOKIE)?.value;
    const token = existing && /^[a-f0-9]{48}$/.test(existing) ? existing : randomBytes(24).toString("hex");
    const result = await postVisitorMessage({
      token,
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      message: String(body.message ?? ""),
      ip: clientIp(request),
    });
    const response = NextResponse.json(result);
    response.cookies.set(SUPPORT_COOKIE, token, cookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send this message.";
    const status = message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
