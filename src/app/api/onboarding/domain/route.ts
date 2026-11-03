import { NextResponse } from "next/server";
import { getIntake, intakeIdFromCookie } from "@/lib/onboarding/intake";

export async function POST(request: Request) {
  const row = await getIntake(await intakeIdFromCookie());
  if (!row) return NextResponse.json({ error: "Start the request again." }, { status: 404 });
  const body = (await request.json()) as { query?: string };
  const query = String(body.query ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9-]{2,63}(\.[a-z]{2,})?$/.test(query)) {
    return NextResponse.json({ error: "Enter a domain name to search." }, { status: 400 });
  }
  const token = row.stack.hostinger?.token;
  if (!token) {
    return NextResponse.json({
      configured: false,
      error: "Connection is not configured. Connect the client's Hostinger account before searching.",
      checkout: `https://www.hostinger.com/domain-name-search?query=${encodeURIComponent(query)}`,
    });
  }
  const response = await fetch(
    `https://developers.hostinger.com/api/domains/v1/availability?domain=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) {
    return NextResponse.json({
      configured: true,
      error: "Hostinger did not confirm that domain.",
      checkout: `https://www.hostinger.com/domain-name-search?query=${encodeURIComponent(query)}`,
    });
  }
  const result = (await response.json()) as { available?: boolean };
  return NextResponse.json({
    configured: true,
    available: Boolean(result.available),
    checkout: `https://www.hostinger.com/domain-name-search?query=${encodeURIComponent(query)}`,
  });
}
