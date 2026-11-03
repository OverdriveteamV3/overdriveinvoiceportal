"use client";

import { useEffect, useState } from "react";
import type { NetworkMessage, NetworkRoom, NetworkUser } from "@/lib/network-chat";

type View = {
  me: { id: string; online: boolean };
  users: NetworkUser[];
  rooms: NetworkRoom[];
  messages: NetworkMessage[];
};

type Tab = "general" | "users" | "groups";

const ROLE_LABEL = { admin: "Admin", agent: "Agent", tech: "Tech" } as const;

export default function AdminNetworkChat({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<View | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [roomId, setRoomId] = useState("general");
  const [draft, setDraft] = useState("");
  const [groupName, setGroupName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/network");
        const body = await response.json().catch(() => ({}));
        if (stop) return;
        if (!response.ok) {
          setError(body.error || "Could not load the network.");
          return;
        }
        setView(body as View);
        setError("");
      } catch {
        if (!stop) setError("Could not load the network.");
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  async function post(payload: unknown) {
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Could not update the network.");
        return null;
      }
      setView(body as View);
      return body as View;
    } catch {
      setError("Could not update the network.");
      return null;
    } finally {
      setSending(false);
    }
  }

  const room = view?.rooms.find((entry) => entry.id === roomId) ?? view?.rooms.find((entry) => entry.kind === "general");
  const messages = view?.messages.filter((message) => message.roomId === room?.id) ?? [];
  const groups = view?.rooms.filter((entry) => entry.kind === "group") ?? [];
  const directs = view?.rooms.filter((entry) => entry.kind === "direct") ?? [];

  async function sendMessage() {
    const target = tab === "general" ? "general" : room && room.kind !== "general" ? room.id : "";
    if (!target) return;
    const body = draft;
    const next = await post({ action: "message", roomId: target, body });
    if (next) setDraft("");
  }

  return (
    <div className="admin-network">
      <div className="admin-network-tabs" role="tablist" aria-label="Network chats">
        {(
          [
            ["general", "General"],
            ["users", "Users"],
            ["groups", "Groups"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "is-on" : ""}
            onClick={() => {
              setTab(id);
              if (id === "general") setRoomId("general");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="admin-network-error">{error}</p> : null}
      {tab === "users" ? (
        <ul className="admin-network-users">
          {(view?.users ?? []).map((user) => (
            <li key={user.id}>
              <span className={user.online ? "admin-user-light is-on" : "admin-user-light is-off"} />
              <span className="admin-network-user-copy">
                <strong>{user.name}</strong>
                <small>{ROLE_LABEL[user.role]}</small>
              </span>
              {user.id === view?.me.id ? (
                <em>You</em>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    void post({ action: "direct", userId: user.id }).then((next) => {
                      const opened = next?.rooms.find(
                        (entry) => entry.kind === "direct" && entry.memberIds.includes(user.id)
                      );
                      if (opened) {
                        setRoomId(opened.id);
                        setTab("groups");
                      }
                    })
                  }
                >
                  Message
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "groups" && room?.kind !== "group" && room?.kind !== "direct" ? (
        <div className="admin-network-groups">
          <button type="button" className="admin-network-new" onClick={() => setCreating((value) => !value)}>
            New group
          </button>
          {creating ? (
            <form
              className="admin-network-form"
              onSubmit={(event) => {
                event.preventDefault();
                void post({ action: "group", name: groupName, memberIds: picked }).then((next) => {
                  if (!next) return;
                  const created = next.rooms.filter((entry) => entry.kind === "group").at(-1);
                  setCreating(false);
                  setGroupName("");
                  setPicked([]);
                  if (created) setRoomId(created.id);
                });
              }}
            >
              <input
                aria-label="Group name"
                placeholder="Group name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
              <ul>
                {(view?.users ?? [])
                  .filter((user) => user.id !== view?.me.id)
                  .map((user) => (
                    <li key={user.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={picked.includes(user.id)}
                          onChange={(event) =>
                            setPicked((current) =>
                              event.target.checked
                                ? [...current, user.id]
                                : current.filter((id) => id !== user.id)
                            )
                          }
                        />
                        <span className={user.online ? "admin-user-light is-on" : "admin-user-light is-off"} />
                        {user.name}
                      </label>
                    </li>
                  ))}
              </ul>
              <button type="submit" disabled={sending}>
                Create group
              </button>
            </form>
          ) : null}
          {[...groups, ...directs].length === 0 ? (
            <p className="admin-network-empty">No private chats yet.</p>
          ) : (
            <ul className="admin-network-room-list">
              {[...groups, ...directs].map((entry) => (
                <li key={entry.id}>
                  <button type="button" onClick={() => setRoomId(entry.id)}>
                    <strong>{entry.name}</strong>
                    <small>{entry.kind === "direct" ? "Direct" : `${entry.memberIds.length} people`}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {room && (tab === "general" || (tab === "groups" && room.kind !== "general")) ? (
        <ChatRoom
          room={tab === "general" ? (view?.rooms.find((entry) => entry.kind === "general") ?? room) : room}
          messages={
            tab === "general"
              ? (view?.messages.filter((message) => message.roomId === "general") ?? [])
              : messages
          }
          mine={view?.me.id ?? ""}
          draft={draft}
          sending={sending}
          onDraft={setDraft}
          onSend={() => void sendMessage()}
          onBack={tab === "general" ? undefined : () => setRoomId("general")}
        />
      ) : null}
    </div>
  );
}

function ChatRoom({
  room,
  messages,
  mine,
  draft,
  sending,
  onDraft,
  onSend,
  onBack,
}: {
  room: NetworkRoom;
  messages: NetworkMessage[];
  mine: string;
  draft: string;
  sending: boolean;
  onDraft: (value: string) => void;
  onSend: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="admin-network-room">
      <div className="admin-network-room-head">
        {onBack ? (
          <button type="button" onClick={onBack}>
            Back
          </button>
        ) : null}
        <strong>{room.kind === "general" ? "General" : room.name}</strong>
      </div>
      <div className="admin-network-thread">
        {messages.length === 0 ? <p className="admin-network-empty">No messages yet.</p> : null}
        {messages.map((message) => (
          <p key={message.id} className={message.authorId === mine ? "is-mine" : ""}>
            <small>{message.authorName}</small>
            {message.body}
          </p>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          aria-label="Network message"
          placeholder={room.kind === "general" ? "Message everyone" : "Message the group"}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
        />
        <button type="submit" disabled={sending || draft.trim().length === 0}>
          Send
        </button>
      </form>
    </div>
  );
}
