import { NextResponse } from "next/server";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import {
  createNetworkGroup,
  getNetworkView,
  openDirectChat,
  postNetworkMessage,
  setNetworkPresence,
} from "@/lib/network-chat";

export async function GET() {
  const profile = await getAdminSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json(await getNetworkView(profile));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load the network.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const profile = await getAdminSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null);
  try {
    const action = String(body?.action ?? "");
    const view =
      action === "presence"
        ? await setNetworkPresence(profile, Boolean(body?.online))
        : action === "message"
          ? await postNetworkMessage(profile, String(body?.roomId ?? ""), String(body?.body ?? ""))
          : action === "group"
            ? await createNetworkGroup(
                profile,
                String(body?.name ?? ""),
                Array.isArray(body?.memberIds) ? body.memberIds.map(String) : []
              )
            : action === "direct"
              ? await openDirectChat(profile, String(body?.userId ?? ""))
              : null;
    if (!view) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    return NextResponse.json(view);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the network.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
