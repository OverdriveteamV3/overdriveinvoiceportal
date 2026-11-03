import { NextResponse } from "next/server";
import {
  ONBOARDING_COOKIE,
  createIntake,
  getIntake,
  intakeIdFromCookie,
  patchStack,
  publicIntake,
  saveContent,
  saveSignature,
  type IntakeContent,
} from "@/lib/onboarding/intake";
import { githubSignInReady, providerStatus } from "@/lib/onboarding/providers";

export async function GET() {
  const row = await getIntake(await intakeIdFromCookie());
  const providers = providerStatus();
  providers.github = await githubSignInReady();
  return NextResponse.json({
    intake: row ? publicIntake(row) : null,
    providers,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim();
  const projectName = String(body.projectName ?? "").trim();
  const details = String(body.details ?? "").trim();
  const service = String(body.service ?? "").trim();
  if (!name || !email.includes("@") || !service || !projectName || details.length < 10) {
    return NextResponse.json(
      { error: "Add your name, email, service, project name, and a short description." },
      { status: 400 }
    );
  }
  try {
    const row = await createIntake({
      name,
      email,
      phone: String(body.phone ?? ""),
      company: String(body.company ?? ""),
      website: String(body.website ?? ""),
      projectName,
      service,
      details,
      goals: String(body.goals ?? ""),
      launchDate: String(body.launchDate ?? ""),
      budget: String(body.budget ?? ""),
      timeline: String(body.timeline ?? ""),
      preferredContact: String(body.preferredContact ?? ""),
    });
    const response = NextResponse.json({ intake: publicIntake(row) });
    response.cookies.set(ONBOARDING_COOKIE, row.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not start onboarding." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const row = await getIntake(await intakeIdFromCookie());
  if (!row) return NextResponse.json({ error: "Start the request again." }, { status: 404 });
  const body = (await request.json()) as {
    signatureName?: string;
    accepted?: boolean;
    content?: IntakeContent;
    sells?: boolean | null;
  };
  try {
    if (typeof body.accepted === "boolean") {
      await saveSignature(row.id, String(body.signatureName ?? ""), body.accepted);
    }
    if (body.content) {
      await saveContent(row.id, { ...row.content, ...body.content });
    }
    if (body.sells === true || body.sells === false || body.sells === null) {
      await patchStack(row.id, { sells: body.sells });
    }
    const next = await getIntake(row.id);
    return NextResponse.json({ intake: next ? publicIntake(next) : null });
  } catch {
    return NextResponse.json({ error: "Could not save this step." }, { status: 500 });
  }
}
