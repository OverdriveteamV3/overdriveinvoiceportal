import { NextResponse } from "next/server";
import { finishIntake, intakeIdFromCookie } from "@/lib/onboarding/intake";

export async function POST() {
  const id = await intakeIdFromCookie();
  if (!id) return NextResponse.json({ error: "Start the request again." }, { status: 404 });
  try {
    const result = await finishIntake(id);
    return NextResponse.json({ ok: true, opportunityId: result.opportunityId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not finish the request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
