import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { getIntake, intakeIdFromCookie, saveContent } from "@/lib/onboarding/intake";

const GROUPS = new Set(["contacts", "about", "products", "logo", "examples"]);

export async function POST(request: Request) {
  const row = await getIntake(await intakeIdFromCookie());
  if (!row) return NextResponse.json({ error: "Start the request again." }, { status: 404 });
  const form = await request.formData();
  const group = String(form.get("group") ?? "");
  const file = form.get("file");
  if (!GROUPS.has(group) || !(file instanceof File) || file.size <= 0 || file.size > 8_000_000) {
    return NextResponse.json({ error: "Choose a file under 8 MB." }, { status: 400 });
  }
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "upload";
  const path = `${row.id}/${group}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const supabase = crmClient();
  const { error } = await supabase.storage.from("onboarding-uploads").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: "Could not store that file." }, { status: 500 });
  const files = [...(row.content.files ?? []), { group, path, name: file.name }];
  await saveContent(row.id, { ...row.content, files });
  return NextResponse.json({ ok: true, name: file.name, group });
}
