"use client";

import { useEffect, useState } from "react";

type SupportMessage = {
  id: string;
  author: "visitor" | "admin";
  body: string;
  createdAt: string;
};

type SupportThread = {
  id: string;
  name: string;
  email: string;
  unread: boolean;
  messages: SupportMessage[];
};

export default function AdminClientChats() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/crm/support");
        const body = await response.json().catch(() => ({}));
        if (stop || !response.ok) return;
        setThreads(body.threads ?? []);
      } catch {
        if (!stop) setError("Could not load client chats.");
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const selected = threads.find((thread) => thread.id === selectedId) ?? null;

  async function send() {
    if (!selected) return;
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/crm/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", threadId: selected.id, body }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Could not send that reply.");
        return;
      }
      setThreads(payload.threads ?? []);
      setReply("");
    } catch {
      setError("Could not send that reply.");
    } finally {
      setSending(false);
    }
  }

  if (selected) {
    return (
      <div className="admin-client-chat">
        <div className="admin-network-room-head">
          <button type="button" onClick={() => setSelectedId(null)}>
            Back
          </button>
          <strong>{selected.name || "Website visitor"}</strong>
        </div>
        <div className="admin-network-thread">
          {selected.messages.map((message) => (
            <p key={message.id} className={message.author === "admin" ? "is-mine" : ""}>
              <small>{message.author === "admin" ? "You" : selected.name || "Visitor"}</small>
              {message.body}
            </p>
          ))}
        </div>
        {error ? <p className="admin-network-error">{error}</p> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <input
            aria-label="Reply to client"
            placeholder="Reply to this client"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
          />
          <button type="submit" disabled={sending || reply.trim().length === 0}>
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-client-chat">
      {error ? <p className="admin-network-error">{error}</p> : null}
      {threads.length === 0 ? (
        <p className="admin-network-empty">No client conversations yet.</p>
      ) : (
        <ul className="admin-network-room-list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button type="button" onClick={() => setSelectedId(thread.id)}>
                <strong>{thread.name || "Website visitor"}</strong>
                <small>{thread.messages.at(-1)?.body || thread.email || "Website visitor"}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
