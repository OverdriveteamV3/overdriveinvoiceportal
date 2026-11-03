import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import {
  deleteRecord,
  getRecordsByBin,
  upsertRecord,
} from "@/lib/storage/internalDatabase";
import { TEAM_ROLES, type TeamMember, type TeamRole } from "@/lib/team-roles";

export type { TeamMember, TeamRole };

const TEAM_KIND = "team-member";
const SCOPE = { profileId: MASTER_PROFILE_ID };

function isTeamRole(value: string): value is TeamRole {
  return TEAM_ROLES.some((role) => role.id === value);
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const records = await getRecordsByBin(SCOPE, "notes");
  return records
    .filter((record) => record.data.kind === TEAM_KIND)
    .map((record) => ({
      id: record.id,
      name: String(record.data.name ?? record.label),
      email: String(record.data.email ?? ""),
      role: isTeamRole(String(record.data.role))
        ? (String(record.data.role) as TeamRole)
        : "agent",
      createdAt: record.createdAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTeamMember(input: {
  name: string;
  email: string;
  role: string;
}): Promise<TeamMember> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) throw new Error("Enter the team member's name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email.");
  }
  if (!isTeamRole(input.role)) throw new Error("Choose Admin, Agent, or Tech.");

  const existing = await listTeamMembers();
  if (existing.some((member) => member.email === email)) {
    throw new Error("That email is already on the team.");
  }

  const record = await upsertRecord(SCOPE, {
    binId: "notes",
    label: name,
    source: "admin-demo",
    data: { kind: TEAM_KIND, name, email, role: input.role },
  });

  return {
    id: record.id,
    name,
    email,
    role: input.role,
    createdAt: record.createdAt,
  };
}

export async function removeTeamMember(id: string): Promise<void> {
  const members = await listTeamMembers();
  if (!members.some((member) => member.id === id)) {
    throw new Error("Team member not found.");
  }
  await deleteRecord(SCOPE, id);
}
