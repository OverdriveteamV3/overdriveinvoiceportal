import { getAdminAccountSettings } from "@/lib/admin-account";
import {
  MASTER_ADMIN_PROFILE,
  MASTER_PROFILE_ID,
  type AdminProfile,
} from "@/lib/admin-auth-constants";
import { listAdminProfiles } from "@/lib/admin-profiles";
import { setSupportOnline } from "@/lib/crm/support";
import { getRecordById, upsertRecord } from "@/lib/storage/internalDatabase";
import { listTeamMembers } from "@/lib/team-members";
import type { TeamRole } from "@/lib/team-roles";

const RECORD_ID = "network-chat";
const SCOPE = { profileId: MASTER_PROFILE_ID };
const GENERAL_ID = "general";

export type NetworkUser = {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  online: boolean;
};

export type NetworkRoom = {
  id: string;
  name: string;
  kind: "general" | "group" | "direct";
  memberIds: string[];
};

export type NetworkMessage = {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Board = {
  presence: Record<string, boolean>;
  rooms: NetworkRoom[];
  messages: NetworkMessage[];
};

const EMPTY_BOARD: Board = { presence: {}, rooms: [], messages: [] };

function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function parseBoard(data: Record<string, unknown> | undefined): Board {
  if (!data || data.kind !== "network-chat") return { ...EMPTY_BOARD, presence: {}, rooms: [], messages: [] };
  const presence: Record<string, boolean> = {};
  if (data.presence && typeof data.presence === "object") {
    for (const [key, value] of Object.entries(data.presence as Record<string, unknown>)) {
      if (key) presence[key] = Boolean(value);
    }
  }
  const rooms = Array.isArray(data.rooms)
    ? data.rooms.flatMap((room) => {
        if (!room || typeof room !== "object") return [];
        const entry = room as Partial<NetworkRoom>;
        const kind = entry.kind === "group" || entry.kind === "direct" ? entry.kind : "";
        const id = cleanText(entry.id, 80);
        if (!kind || !id || id === GENERAL_ID) return [];
        return [
          {
            id,
            name: cleanText(entry.name, 40) || "Group",
            kind,
            memberIds: Array.isArray(entry.memberIds)
              ? entry.memberIds.map((memberId) => cleanText(memberId, 80)).filter(Boolean)
              : [],
          } satisfies NetworkRoom,
        ];
      })
    : [];
  const messages = Array.isArray(data.messages)
    ? data.messages.flatMap((message) => {
        if (!message || typeof message !== "object") return [];
        const entry = message as Partial<NetworkMessage>;
        const body = cleanText(entry.body, 2000);
        const id = cleanText(entry.id, 80);
        const roomId = cleanText(entry.roomId, 80);
        if (!id || !roomId || !body) return [];
        return [
          {
            id,
            roomId,
            authorId: cleanText(entry.authorId, 80),
            authorName: cleanText(entry.authorName, 80) || "Teammate",
            body,
            createdAt: cleanText(entry.createdAt, 40),
          } satisfies NetworkMessage,
        ];
      })
    : [];
  return { presence, rooms, messages: messages.slice(-400) };
}

async function loadBoard(): Promise<Board> {
  const record = await getRecordById(SCOPE, RECORD_ID);
  return parseBoard(record?.data);
}

async function saveBoard(board: Board) {
  await upsertRecord(SCOPE, {
    id: RECORD_ID,
    binId: "notes",
    label: "Network chat",
    source: "admin-demo",
    data: {
      kind: "network-chat",
      presence: board.presence,
      rooms: board.rooms,
      messages: board.messages.slice(-400),
    },
  });
}

async function syncDesk(presence: Record<string, boolean>) {
  try {
    await setSupportOnline(Object.values(presence).some(Boolean));
  } catch {
    // The staff lights still update when the public desk cannot be reached.
  }
}

export async function listNetworkUsers(presence: Record<string, boolean> = {}): Promise<NetworkUser[]> {
  const account = await getAdminAccountSettings(MASTER_ADMIN_PROFILE);
  const users: NetworkUser[] = [
    {
      id: MASTER_PROFILE_ID,
      name: account.displayName || "Master admin",
      role: "admin",
      email: account.email.trim().toLowerCase(),
      online: Boolean(presence[MASTER_PROFILE_ID]),
    },
  ];
  const seen = new Set(users.map((user) => user.email).filter(Boolean));

  for (const profile of await listAdminProfiles()) {
    const email = profile.email?.trim().toLowerCase() ?? "";
    if (email && seen.has(email)) continue;
    if (email) seen.add(email);
    users.push({
      id: profile.id,
      name: profile.displayName || profile.username,
      role: "admin",
      email,
      online: Boolean(presence[profile.id]),
    });
  }

  for (const member of await listTeamMembers()) {
    const email = member.email.trim().toLowerCase();
    if (email && seen.has(email)) continue;
    if (email) seen.add(email);
    users.push({
      id: member.id,
      name: member.name,
      role: member.role,
      email,
      online: Boolean(presence[member.id]),
    });
  }

  return users.sort((a, b) => a.name.localeCompare(b.name));
}

function generalRoom(): NetworkRoom {
  return { id: GENERAL_ID, name: "General", kind: "general", memberIds: [] };
}

function canSee(room: NetworkRoom, userId: string) {
  if (room.kind === "general") return true;
  return room.memberIds.includes(userId);
}

function visibleRooms(board: Board, userId: string) {
  return [generalRoom(), ...board.rooms.filter((room) => canSee(room, userId))];
}

export async function getNetworkView(profile: AdminProfile) {
  const board = await loadBoard();
  const users = await listNetworkUsers(board.presence);
  const rooms = visibleRooms(board, profile.profileId);
  const roomIds = new Set(rooms.map((room) => room.id));
  return {
    me: {
      id: profile.profileId,
      online: Boolean(board.presence[profile.profileId]),
    },
    users,
    rooms,
    messages: board.messages.filter((message) => roomIds.has(message.roomId)),
  };
}

export async function setNetworkPresence(profile: AdminProfile, online: boolean) {
  const board = await loadBoard();
  board.presence[profile.profileId] = online;
  await saveBoard(board);
  await syncDesk(board.presence);
  return getNetworkView(profile);
}

export async function postNetworkMessage(profile: AdminProfile, roomId: string, text: string) {
  const body = text.trim().slice(0, 2000);
  if (body.length < 1) throw new Error("Write a message first.");
  const board = await loadBoard();
  const rooms = visibleRooms(board, profile.profileId);
  const room = rooms.find((entry) => entry.id === roomId);
  if (!room) throw new Error("That chat is not available.");
  const users = await listNetworkUsers(board.presence);
  const author = users.find((user) => user.id === profile.profileId);
  board.messages.push({
    id: crypto.randomUUID(),
    roomId,
    authorId: profile.profileId,
    authorName: author?.name || profile.displayName || "Teammate",
    body,
    createdAt: new Date().toISOString(),
  });
  board.messages = board.messages.slice(-400);
  await saveBoard(board);
  return getNetworkView(profile);
}

export async function createNetworkGroup(profile: AdminProfile, name: string, memberIds: string[]) {
  const title = name.trim().slice(0, 40);
  if (title.length < 2) throw new Error("Name the group.");
  const board = await loadBoard();
  const users = await listNetworkUsers(board.presence);
  const known = new Set(users.map((user) => user.id));
  const members = [...new Set([profile.profileId, ...memberIds.map((id) => id.trim())])].filter((id) =>
    known.has(id)
  );
  if (members.length < 2) throw new Error("Choose at least one other person.");
  board.rooms.push({
    id: crypto.randomUUID(),
    name: title,
    kind: "group",
    memberIds: members,
  });
  await saveBoard(board);
  return getNetworkView(profile);
}

export async function openDirectChat(profile: AdminProfile, userId: string) {
  const otherId = userId.trim();
  if (!otherId || otherId === profile.profileId) throw new Error("Choose someone else.");
  const board = await loadBoard();
  const users = await listNetworkUsers(board.presence);
  if (!users.some((user) => user.id === otherId)) throw new Error("That person is not on the network.");
  const memberIds = [profile.profileId, otherId].sort();
  const id = `direct:${memberIds.join(":")}`;
  if (!board.rooms.some((room) => room.id === id)) {
    const other = users.find((user) => user.id === otherId);
    board.rooms.push({
      id,
      name: other?.name || "Direct",
      kind: "direct",
      memberIds,
    });
    await saveBoard(board);
  }
  return getNetworkView(profile);
}
