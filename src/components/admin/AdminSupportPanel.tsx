"use client";

import { useCallback, useEffect, useState } from "react";

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
  updatedAt: string;
  messages: SupportMessage[];
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

function when(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminSupportPanel() {
  const [online, setOnline] = useState(false);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const apply = useCallback((body: { online?: boolean; threads?: SupportThread[] }) => {
    const nextThreads = body.threads ?? [];
    setOnline(Boolean(body.online));
    setThreads(nextThreads);
    setSelectedId((current) => current ?? nextThreads[0]?.id ?? null);
  }, []);

  const load = useCallback(async () => {
    try {
      apply(await readJson(await fetch("/api/crm/support")));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load messages.");
    }
  }, [apply]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const selected = threads.find((thread) => thread.id === selectedId) ?? null;
  const alerts = threads.filter((thread) => thread.unread);

  async function post(body: unknown) {
    setSaving(true);
    setError("");
    try {
      apply(await readJson(await fetch("/api/crm/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })));
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Customer support</p>
          <p className="text-xs text-zinc-500">
            {online
              ? "Visitors can chat in the support panel. Email is optional."
              : "Visitors are asked for an email, and replies go there."}
          </p>
        </div>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            online ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-700"
          }`}
          aria-pressed={online}
          disabled={saving}
          onClick={() => void post({ action: "presence", online: !online })}
        >
          {online ? "Online" : "Offline"}
        </button>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Alerts</h3>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No new alerts.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alerts.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm"
                  onClick={() => {
                    setSelectedId(thread.id);
                    void post({ action: "read", threadId: thread.id });
                  }}
                >
                  <span className="font-semibold text-zinc-900">{thread.name || "Visitor"}</span>
                  <span className="mt-0.5 block truncate text-zinc-600">
                    {thread.messages.at(-1)?.body}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ul className="space-y-1">
          {threads.length === 0 ? <li className="text-sm text-zinc-500">No messages yet.</li> : null}
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                className={`w-full rounded-md px-3 py-2 text-left ${
                  thread.id === selectedId ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
                onClick={() => {
                  setSelectedId(thread.id);
                  if (thread.unread) void post({ action: "read", threadId: thread.id });
                }}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  {thread.unread ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
                  {thread.name || "Visitor"}
                </span>
                <span className="block truncate text-xs text-zinc-500">
                  {thread.email || "No email"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <section className="min-h-64 rounded-lg border border-zinc-200">
          {selected ? (
            <>
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">{selected.name || "Visitor"}</p>
                <p className="text-xs text-zinc-500">{selected.email || "No email on file"}</p>
              </div>
              <div className="max-h-80 space-y-3 overflow-auto px-4 py-4">
                {selected.messages.map((message) => (
                  <p
                    key={message.id}
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.author === "admin"
                        ? "ml-auto bg-[#0780f7] text-white"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {message.body}
                    <span className="mt-1 block text-[10px] opacity-70">{when(message.createdAt)}</span>
                  </p>
                ))}
              </div>
              <form
                className="flex gap-2 border-t border-zinc-100 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const body = reply;
                  setReply("");
                  void post({ action: "reply", threadId: selected.id, body });
                }}
              >
                <input
                  className="min-w-0 flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  value={reply}
                  maxLength={2000}
                  placeholder="Reply in the chat"
                  onChange={(event) => setReply(event.target.value)}
                />
                <button className="btn text-xs" type="submit" disabled={saving || reply.trim().length === 0}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <p className="p-4 text-sm text-zinc-500">Choose a conversation.</p>
          )}
        </section>
      </div>
    </div>
  );
}
