import { NextResponse } from "next/server";
import { acceptQuoteVersion } from "@/lib/crm/db";
import { crmError, requireCrmAdmin } from "@/lib/crm/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const profile = await requireCrmAdmin();
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const result = await acceptQuoteVersion({
      profileId: profile.profileId,
      quoteVersionId: id,
      actor: profile.username,
      ip: request.headers.get("x-forwarded-for") ?? "",
      userAgent: request.headers.get("user-agent") ?? "",
    });
    return NextResponse.json(result);
  } catch (error) {
    return crmError(error);
  }
}
