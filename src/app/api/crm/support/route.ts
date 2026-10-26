import { NextResponse } from "next/server";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";
import {
  listSupportDesk,
  markSupportThreadRead,
  replyToSupportThread,
  setSupportOnline,
} from "@/lib/crm/support";

export async function GET() {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await listSupportDesk());
  } catch (error) {
    return crmError(error);
  }
}

export async function POST(request: Request) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  try {
    const body = await request.json();
    if (body.action === "presence") {
      await setSupportOnline(Boolean(body.online));
    } else if (body.action === "reply") {
      await replyToSupportThread(String(body.threadId ?? ""), String(body.body ?? ""));
    } else if (body.action === "read") {
      await markSupportThreadRead(String(body.threadId ?? ""));
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json(await listSupportDesk());
  } catch (error) {
    return crmError(error);
  }
}
