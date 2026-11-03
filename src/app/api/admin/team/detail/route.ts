import { NextResponse } from "next/server";
import { getAdminAccountSettings, type AdminAccountSettings } from "@/lib/admin-account";
import { MASTER_ADMIN_PROFILE, MASTER_PROFILE_ID, type AdminProfile } from "@/lib/admin-auth-constants";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";
import { listAdminProfiles } from "@/lib/admin-profiles";
import { emptySocials } from "@/lib/socials";
import { getTeamDetail } from "@/lib/team-detail";
import { listTeamMembers } from "@/lib/team-members";

const EMPTY_ACCOUNT: AdminAccountSettings = {
  username: "",
  displayName: "",
  email: "",
  phone: "",
  website: "",
  socials: emptySocials(),
  logo: "",
};

async function accountForEmail(email: string): Promise<AdminAccountSettings | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  const match = (await listAdminProfiles()).find(
    (profile) => profile.email?.trim().toLowerCase() === target
  );
  if (!match) return null;
  const profile: AdminProfile = {
    username: match.username,
    role: "user",
    displayName: match.displayName,
    profileId: match.id,
  };
  return getAdminAccountSettings(profile);
}

export async function GET(request: Request) {
  const profile = await getAdminSessionProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing team member." }, { status: 400 });
  }

  if (id === MASTER_PROFILE_ID) {
    const account = await getAdminAccountSettings(MASTER_ADMIN_PROFILE);
    const detail = await getTeamDetail(MASTER_PROFILE_ID, "admin");
    return NextResponse.json({
      member: {
        id: MASTER_PROFILE_ID,
        name: account.displayName || "Master admin",
        email: account.email,
        role: "admin",
        profile: account,
      },
      detail,
    });
  }

  const members = await listTeamMembers();
  const member = members.find((entry) => entry.id === id);
  if (!member) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  }

  const detail = await getTeamDetail(member.id, member.role);
  const account = (await accountForEmail(member.email)) ?? {
    ...EMPTY_ACCOUNT,
    displayName: member.name,
    email: member.email,
  };
  return NextResponse.json({
    member: {
      id: member.id,
      name: account.displayName || member.name,
      email: account.email || member.email,
      role: member.role,
      profile: account,
    },
    detail,
  });
}
