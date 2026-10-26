import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await getPortalUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const supabase = crmClient();
  const { data: file } = await supabase
    .from("crm_files")
    .select("name, content_type, content, project_id, visibility")
    .eq("id", id)
    .eq("visibility", "client")
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: membership } = await supabase
    .from("portal_memberships")
    .select("project_id")
    .eq("portal_user_id", userId)
    .eq("project_id", file.project_id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const bytes = decodeBytea(file.content);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": file.content_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.name.replace(/"/g, "")}"`,
    },
  });
}

function decodeBytea(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string" && value.startsWith("\\x")) {
    const hex = value.slice(2);
    const out = new Uint8Array(hex.length / 2);
    for (let index = 0; index < out.length; index += 1) {
      out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }
    return out;
  }
  return new Uint8Array();
}
