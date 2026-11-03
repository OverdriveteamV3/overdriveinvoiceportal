"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AdminClientChats from "@/components/admin/AdminClientChats";
import AdminNetworkChat from "@/components/admin/AdminNetworkChat";

type InboxItem = {
  id: string;
  title: string;
  detail: string;
  body: string;
  when: string;
};

type InboxKey = "support" | "emails" | "contactForms" | "alerts";
type DockFolder = InboxKey | "network";

type Inbox = Record<InboxKey, InboxItem[]>;

const FOLDERS: Array<{ id: DockFolder; label: string }> = [
  { id: "support", label: "Customer support" },
  { id: "emails", label: "Emails" },
  { id: "contactForms", label: "Contact forms" },
  { id: "alerts", label: "Alerts" },
  { id: "network", label: "Network" },
];

const EMPTY: Inbox = { support: [], emails: [], contactForms: [], alerts: [] };
const DISMISSED_KEY = "admin-inbox-dismissed";
const SEEN_KEY = "admin-inbox-seen";

type SeenMap = Partial<Record<InboxKey, string[]>>;

type ComposeMode = "reply" | "forward" | "new";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function alertShade(item: InboxItem) {
  const title = item.title.toLowerCase();
  if (item.id.startsWith("signup-") || title.includes("signup")) return "is-signup";
  if (title.includes("start a project")) return "is-project";
  if (item.id.startsWith("quote-") || title.includes("quote")) return "is-quote";
  return "is-alert";
}

function emailOf(value: string) {
  return value.match(/[^\s<>]+@[^\s<>]+/)?.[0] ?? "";
}

function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as SeenMap) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSeen(value: SeenMap) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(value));
  } catch {
    // The lights still work for this visit when storage is blocked.
  }
}

function readDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function IconReply() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h8.5a6.5 6.5 0 0 1 0 13H11" />
    </svg>
  );
}

function IconForward() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9h-8.5a6.5 6.5 0 0 0 0 13H13" />
    </svg>
  );
}

function IconNew() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function readBrief(body: string) {
  const facts: Array<{ label: string; value: string }> = [];
  const plain: string[] = [];
  for (const line of body.split("\n")) {
    const text = line.trim();
    if (!text) continue;
    const labeled = /^([A-Za-z][A-Za-z ]{1,32}):\s+(.+)$/.exec(text);
    if (labeled) facts.push({ label: labeled[1], value: labeled[2] });
    else plain.push(text);
  }
  const email = plain.find((line) => line.includes("@")) ?? "";
  const rest = plain.filter((line) => line !== email);
  const title = rest[0] ?? "";
  const company = rest.length > 1 && rest[1].length <= 80 ? rest[1] : "";
  const story = rest.slice(company ? 2 : 1).join("\n");
  return { title, company, email, facts, story };
}

function siteHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function MessageBrief({ body }: { body: string }) {
  const brief = readBrief(body);
  if (!brief.facts.length && !brief.story && !brief.company) {
    return <p className="admin-message-copy">{body}</p>;
  }
  return (
    <div className="admin-message-brief">
      {brief.title ? <p className="admin-message-project">{brief.title}</p> : null}
      {brief.company || brief.email ? (
        <p className="admin-message-meta">
          {[brief.company, brief.email].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {brief.facts.length > 0 ? (
        <dl className="admin-message-facts">
          {brief.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                {/website/i.test(fact.label) ? (
                  <a href={siteHref(fact.value)} target="_blank" rel="noreferrer">
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {brief.story ? <p className="admin-message-story">{brief.story}</p> : null}
    </div>
  );
}

function IconDelete() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

export default function AdminMessageDock() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<DockFolder>("support");
  const [online, setOnline] = useState(false);
  const [presenceTick, setPresenceTick] = useState(0);
  const [inbox, setInbox] = useState<Inbox>(EMPTY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [compose, setCompose] = useState<{
    itemId: string;
    mode: ComposeMode;
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [composeNote, setComposeNote] = useState<string | null>(null);
  const [seen, setSeen] = useState<SeenMap | null>(null);
  const seenReady = useRef(false);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/inbox");
        if (!response.ok || stop) return;
        const body = (await response.json()) as Partial<Inbox>;
        if (stop) return;
        const nextInbox: Inbox = {
          support: body.support ?? [],
          emails: body.emails ?? [],
          contactForms: body.contactForms ?? [],
          alerts: body.alerts ?? [],
        };
        setDismissed(readDismissed());
        setInbox(nextInbox);
        if (!seenReady.current) {
          seenReady.current = true;
          const stored = readSeen();
          const next: SeenMap = { ...stored };
          for (const item of FOLDERS) {
            if (item.id === "network") continue;
            if (!Array.isArray(next[item.id])) {
              next[item.id] = nextInbox[item.id].map((entry) => entry.id);
            }
          }
          writeSeen(next);
          setSeen(next);
        }
      } catch {
        if (!stop) setInbox(EMPTY);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    async function loadPresence() {
      try {
        const response = await fetch("/api/admin/network");
        const body = await response.json().catch(() => ({}));
        if (!stop && response.ok) setOnline(Boolean(body.me?.online));
      } catch {
        // The switch stays as it was when the network is unreachable.
      }
    }
    void loadPresence();
    return () => {
      stop = true;
    };
  }, [open, presenceTick]);

  async function togglePresence() {
    const next = !online;
    setOnline(next);
    try {
      const response = await fetch("/api/admin/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "presence", online: next }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setOnline(!next);
        return;
      }
      setOnline(Boolean(body.me?.online));
      setPresenceTick((value) => value + 1);
    } catch {
      setOnline(!next);
    }
  }

  const visibleIds = (key: InboxKey) =>
    inbox[key].filter((item) => !dismissed.has(item.id)).map((item) => item.id);

  const hasFresh = (key: InboxKey) => {
    if (!seen) return false;
    const known = new Set(seen[key] ?? []);
    return visibleIds(key).some((id) => !known.has(id));
  };

  function markSeen(key: InboxKey) {
    const ids = visibleIds(key);
    setSeen((current) => {
      const next = { ...(current ?? readSeen()), [key]: ids };
      writeSeen(next);
      return next;
    });
  }

  const items = folder === "network" ? [] : inbox[folder].filter((item) => !dismissed.has(item.id));
  const unread = inbox.support.filter((item) => !dismissed.has(item.id)).length + inbox.alerts.filter((item) => !dismissed.has(item.id)).length;

  function startNewEmail() {
    setSelectedId(null);
    setComposeNote(null);
    setCompose((current) =>
      current?.itemId === "" && current.mode === "new"
        ? null
        : { itemId: "", mode: "new", to: "", subject: "", body: "" }
    );
  }

  function openCompose(item: InboxItem, mode: ComposeMode) {
    const address = emailOf(item.detail);
    setComposeNote(null);
    setCompose({
      itemId: item.id,
      mode,
      to: mode === "reply" ? address : "",
      subject: mode === "new" ? "" : mode === "reply" ? `Re: ${item.title}` : `Fwd: ${item.title}`,
      body: mode === "forward" ? `\n\n----------\n${item.title}\n${item.detail}\n\n${item.body}` : "",
    });
  }

  function dismiss(itemId: string) {
    setDismissed((current) => {
      const next = new Set(current);
      next.add(itemId);
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
    setSelectedId(null);
    setCompose(null);
  }

  async function sendCompose() {
    if (!compose) return;
    setSending(true);
    setComposeNote(null);
    try {
      const supportReply = folder === "support" && compose.mode === "reply";
      const response = await fetch(supportReply ? "/api/crm/support" : "/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          supportReply
            ? { action: "reply", threadId: compose.itemId, body: compose.body }
            : { to: compose.to, subject: compose.subject, text: compose.body }
        ),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setComposeNote(payload?.error || "Could not send this message.");
        return;
      }
      setCompose(null);
      setComposeNote("Sent.");
    } catch {
      setComposeNote("Could not send this message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="support-dock">
      {open ? (
        <section className="support-panel" role="dialog" aria-labelledby="admin-messages-title">
          <header className="support-head">
            <div>
              <p id="admin-messages-title">Messages</p>
              <span>Click on/off line tab to reveal status</span>
            </div>
            <div className="support-head-actions">
              <button
                type="button"
                className="admin-presence"
                aria-pressed={online}
                onClick={() => void togglePresence()}
              >
                <i className={online ? "admin-user-light is-on" : "admin-user-light is-off"} />
                {online ? "Online" : "Offline"}
              </button>
              <button type="button" className="support-head-close" aria-label="Close messages" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
          </header>
          <div className="admin-message-folders" role="tablist" aria-label="Message folders">
            {FOLDERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={folder === item.id}
                className={folder === item.id ? "is-on" : ""}
                onClick={() => {
                  setFolder(item.id);
                  setSelectedId(null);
                  if (item.id !== "network") markSeen(item.id);
                }}
              >
                {item.label}
                <span className="admin-message-tab-meta">
                  {item.id !== "network" && hasFresh(item.id) ? (
                    <span className="admin-message-light" title="New">
                      <span className="sr-only">New</span>
                    </span>
                  ) : null}
                  {item.id !== "network" ? <em>{visibleIds(item.id).length}</em> : null}
                </span>
              </button>
            ))}
          </div>
          {folder === "network" ? <AdminNetworkChat refreshKey={presenceTick} /> : null}
          {folder === "support" ? <AdminClientChats /> : null}
          {folder !== "network" && folder !== "support" ? (
          <div className="admin-message-list">
            <div className="admin-message-create">
              <button type="button" onClick={startNewEmail}>
                Create new email
              </button>
              {compose?.itemId === "" && compose.mode === "new" ? (
                <div className="admin-message-compose">
                  <input
                    aria-label="To"
                    placeholder="To"
                    value={compose.to}
                    onChange={(event) => setCompose({ ...compose, to: event.target.value })}
                  />
                  <input
                    aria-label="Subject"
                    placeholder="Subject"
                    value={compose.subject}
                    onChange={(event) => setCompose({ ...compose, subject: event.target.value })}
                  />
                  <textarea
                    aria-label="Message"
                    placeholder="Message"
                    rows={4}
                    value={compose.body}
                    onChange={(event) => setCompose({ ...compose, body: event.target.value })}
                  />
                  <button type="button" onClick={() => void sendCompose()} disabled={sending}>
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              ) : null}
              {compose?.itemId === "" && composeNote ? <p className="admin-message-note">{composeNote}</p> : null}
            </div>
            {items.length === 0 ? <p className="admin-message-empty">Nothing to read in this folder.</p> : null}
            {items.map((item) => {
              const isOpen = item.id === selectedId;
              const drafting = isOpen && compose?.itemId === item.id ? compose : null;
              return (
                <article
                  key={item.id}
                  className={[
                    "admin-message-row",
                    isOpen ? "is-open" : "",
                    folder === "alerts" ? alertShade(item) : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    className="admin-message-hit"
                    onClick={() => {
                      if (folder === "alerts" && item.id.startsWith("quote-")) {
                        const submissionId = item.id.slice("quote-".length);
                        window.dispatchEvent(
                          new CustomEvent("admin-open-submission", { detail: submissionId })
                        );
                        setOpen(false);
                        router.push(`/admin?submission=${encodeURIComponent(submissionId)}`);
                        return;
                      }
                      setSelectedId((current) => (current === item.id ? null : item.id));
                      setCompose(null);
                      setComposeNote(null);
                    }}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>{when(item.when)}</small>
                    </span>
                    <em>{item.detail}</em>
                  </button>
                  {isOpen ? (
                    <>
                      <div className="admin-message-actions">
                        <button type="button" aria-label="Reply" title="Reply" className={drafting?.mode === "reply" ? "is-on" : ""} onClick={() => openCompose(item, "reply")}>
                          <IconReply />
                        </button>
                        <button type="button" aria-label="Forward" title="Forward" className={drafting?.mode === "forward" ? "is-on" : ""} onClick={() => openCompose(item, "forward")}>
                          <IconForward />
                        </button>
                        <button type="button" aria-label="New message" title="New message" className={drafting?.mode === "new" ? "is-on" : ""} onClick={() => openCompose(item, "new")}>
                          <IconNew />
                        </button>
                        <button type="button" aria-label="Delete" title="Delete" className="is-danger" onClick={() => dismiss(item.id)}>
                          <IconDelete />
                        </button>
                      </div>
                      {drafting ? (
                        <div className="admin-message-compose">
                          <input
                            aria-label="To"
                            placeholder="To"
                            value={drafting.to}
                            onChange={(event) => setCompose({ ...drafting, to: event.target.value })}
                          />
                          <input
                            aria-label="Subject"
                            placeholder="Subject"
                            value={drafting.subject}
                            onChange={(event) => setCompose({ ...drafting, subject: event.target.value })}
                          />
                          <textarea
                            aria-label="Message"
                            placeholder="Message"
                            rows={4}
                            value={drafting.body}
                            onChange={(event) => setCompose({ ...drafting, body: event.target.value })}
                          />
                          <button type="button" onClick={() => void sendCompose()} disabled={sending}>
                            {sending ? "Sending…" : "Send"}
                          </button>
                        </div>
                      ) : null}
                      {composeNote ? <p className="admin-message-note">{composeNote}</p> : null}
                      <MessageBrief body={item.body} />
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        className="support-bubble"
        aria-expanded={open}
        aria-label={open ? "Close messages" : "Open messages"}
        onClick={() => setOpen((value) => !value)}
      >
        {unread > 0 ? <i className="admin-message-count">{unread > 9 ? "9+" : unread}</i> : null}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H12l-4.2 3.2c-.7.5-1.8 0-1.8-.9V16h-.5A2.5 2.5 0 0 1 3 13.5v-7A2.5 2.5 0 0 1 5 6.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style>{`
        .support-dock {
          position: fixed;
          z-index: 45;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          font-family: Arial, Helvetica, sans-serif;
          color: #151f24;
        }
        .support-bubble {
          position: relative;
          display: grid;
          place-items: center;
          box-sizing: border-box;
          width: 58px;
          height: 58px;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #0780f7;
          color: #fff;
          box-shadow: 0 10px 24px #0780f740;
          cursor: pointer;
        }
        .support-bubble svg { width: 26px; height: 26px; }
        .admin-message-count {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: #10161b;
          color: #fff;
          font-size: 10px;
          font-style: normal;
          font-weight: 700;
          line-height: 18px;
        }
        .support-panel {
          display: flex;
          flex-direction: column;
          width: min(340px, calc(100vw - 48px));
          height: min(820px, calc(100dvh - 120px));
          overflow: hidden;
          border: 1px solid #e7ebef;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 16px 40px #151f2418;
        }
        .support-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 14px 14px 16px;
          background: #10161b;
          color: #fff;
        }
        .support-head p { margin: 0; font-size: 15px; font-weight: 700; }
        .support-head span { color: #b7c0c8; font-size: 12px; }
        .support-head-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .support-head-close {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #fff;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
        .admin-presence {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          border-radius: 999px;
          background: #1c262d;
          color: #fff;
          padding: 5px 10px;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-user-light {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex: none;
        }
        .admin-user-light.is-on { background: #10b981; box-shadow: 0 0 0 3px rgb(16 185 129 / 0.2); }
        .admin-user-light.is-off { background: #ef4444; box-shadow: 0 0 0 3px rgb(239 68 68 / 0.18); }
        .admin-network, .admin-client-chat, .admin-message-list {
          flex: 1;
          min-height: 0;
        }
        .admin-network, .admin-client-chat {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .admin-network-room, .admin-network-groups {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .admin-network-users, .admin-network-room-list {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }
        .admin-network-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 10px;
        }
        .admin-network-tabs button,
        .admin-network-new,
        .admin-network-room-list button,
        .admin-network-users button,
        .admin-network-room-head button,
        .admin-network-room form button,
        .admin-client-chat form button,
        .admin-network-form button {
          border: 1px solid #e7ebef;
          border-radius: 8px;
          background: #fff;
          color: #3d4852;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .admin-network-tabs button { padding: 6px 8px; }
        .admin-network-tabs button.is-on {
          border-color: #0780f7;
          background: #eef6ff;
          color: #0560b5;
          font-weight: 700;
        }
        .admin-network-users, .admin-network-room-list, .admin-network-form ul {
          list-style: none;
          margin: 0;
          padding: 0 10px 10px;
        }
        .admin-network-users li, .admin-network-room-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #eef1f4;
        }
        .admin-network-user-copy { display: grid; min-width: 0; flex: 1; }
        .admin-network-user-copy strong, .admin-network-room-list strong {
          font-size: 13px;
          color: #151f24;
        }
        .admin-network-user-copy small, .admin-network-room-list small, .admin-network-users em {
          color: #8b97a3;
          font-size: 11px;
          font-style: normal;
        }
        .admin-network-users button, .admin-network-room-list button { padding: 4px 8px; }
        .admin-network-room-list button {
          display: grid;
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 0;
        }
        .admin-network-new, .admin-network-form { margin: 0 10px 10px; }
        .admin-network-new, .admin-network-form button, .admin-network-room form button, .admin-client-chat form button {
          border: 0;
          background: #0780f7;
          color: #fff;
          font-weight: 700;
          padding: 7px 10px;
        }
        .admin-network-form { display: grid; gap: 8px; }
        .admin-network-form input, .admin-network-room input, .admin-client-chat input {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #e7ebef;
          border-radius: 8px;
          padding: 7px 8px;
          font: inherit;
          font-size: 12px;
        }
        .admin-network-form ul { padding: 0; }
        .admin-network-form li { padding: 4px 0; }
        .admin-network-form label { display: flex; align-items: center; gap: 6px; font-size: 12px; }
        .admin-network-room-head, .admin-network-room form, .admin-client-chat form {
          display: flex;
          flex: none;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
        }
        .admin-network-room form, .admin-client-chat form { border-top: 1px solid #eef1f4; }
        .admin-network-room form input, .admin-client-chat form input { flex: 1; }
        .admin-network-thread {
          display: grid;
          gap: 8px;
          align-content: start;
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 0 10px 8px;
        }
        .admin-network-thread p {
          margin: 0;
          max-width: 85%;
          border-radius: 12px;
          background: #f4f6f8;
          padding: 7px 9px;
          font-size: 12px;
          line-height: 1.4;
        }
        .admin-network-thread p.is-mine { justify-self: end; background: #0780f7; color: #fff; }
        .admin-network-thread small { display: block; margin-bottom: 2px; font-size: 10px; opacity: 0.75; }
        .admin-network-empty, .admin-network-error { margin: 0; padding: 8px 12px 12px; font-size: 12px; color: #8b97a3; }
        .admin-network-error { color: #b42318; }
        .admin-message-folders {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 10px;
          border-bottom: 1px solid #eef1f4;
        }
        .admin-message-folders button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          background: #fff;
          padding: 7px 8px;
          color: #3d4852;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }
        .admin-message-folders button.is-on {
          border-color: #0780f7;
          background: #eef6ff;
          color: #0560b5;
        }
        .admin-message-folders em {
          font-style: normal;
          color: #8b97a3;
        }
        .admin-message-tab-meta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .admin-message-light {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #10b981;
          box-shadow: 0 0 0 3px rgb(16 185 129 / 0.18);
        }
        .admin-message-list {
          display: grid;
          align-content: start;
          overflow: auto;
        }
        .admin-message-create {
          display: grid;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid #eef1f4;
          background: #fff;
        }
        .admin-message-create > button {
          justify-self: start;
          border: 0;
          border-radius: 8px;
          background: #0780f7;
          color: #fff;
          padding: 7px 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-message-empty {
          margin: 0;
          padding: 16px;
          color: #8b97a3;
          font-size: 13px;
        }
        .admin-message-row {
          display: grid;
          gap: 2px;
          border: 0;
          border-bottom: 1px solid #eef1f4;
          background: #fff;
          padding: 10px 14px;
          text-align: left;
        }
        .admin-message-hit {
          display: grid;
          gap: 2px;
          width: 100%;
          border: 0;
          background: transparent;
          padding: 0;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }
        .admin-message-row.is-open { background: #f7fafc; }
        .admin-message-row.is-quote { background: #eef6ff; box-shadow: inset 3px 0 0 #0780f7; }
        .admin-message-row.is-project { background: #ecfdf5; box-shadow: inset 3px 0 0 #059669; }
        .admin-message-row.is-signup { background: #f5f3ff; box-shadow: inset 3px 0 0 #7c3aed; }
        .admin-message-row.is-alert { background: #fff7ed; box-shadow: inset 3px 0 0 #f59e0b; }
        .admin-message-brief {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }
        .admin-message-project {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #151f24;
        }
        .admin-message-meta, .admin-message-copy {
          margin: 0;
          color: #66727e;
          font-size: 12px;
          line-height: 1.4;
        }
        .admin-message-facts {
          display: grid;
          gap: 6px;
          margin: 0;
        }
        .admin-message-facts div {
          border-radius: 10px;
          background: #fff;
          padding: 8px 10px;
        }
        .admin-message-facts dt {
          color: #8b97a3;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .admin-message-facts dd {
          margin: 3px 0 0;
          color: #151f24;
          font-size: 12px;
          line-height: 1.45;
        }
        .admin-message-facts a { color: #0560b5; text-decoration: none; }
        .admin-message-story {
          margin: 0;
          max-height: 140px;
          overflow: auto;
          border-radius: 10px;
          background: #fff;
          padding: 10px;
          color: #3d4852;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-line;
        }
        .admin-message-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .admin-message-actions button {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border: 1px solid #e7ebef;
          border-radius: 8px;
          background: #fff;
          color: #3d4852;
          cursor: pointer;
        }
        .admin-message-actions button svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .admin-message-actions button.is-on {
          border-color: #0780f7;
          background: #eef6ff;
          color: #0560b5;
        }
        .admin-message-actions button.is-danger:hover {
          border-color: #fecaca;
          color: #b42318;
        }
        .admin-message-compose {
          display: grid;
          gap: 6px;
          margin-top: 8px;
        }
        .admin-message-compose input,
        .admin-message-compose textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #e7ebef;
          border-radius: 8px;
          padding: 7px 8px;
          color: #151f24;
          font: inherit;
          font-size: 12px;
        }
        .admin-message-compose button {
          justify-self: end;
          border: 0;
          border-radius: 8px;
          background: #0780f7;
          color: #fff;
          padding: 7px 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-message-compose button:disabled { opacity: 0.6; cursor: default; }
        .admin-message-note {
          margin: 6px 0 0;
          color: #0560b5;
          font-size: 12px;
        }
        .admin-message-hit > span {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .admin-message-row strong { font-size: 13px; color: #151f24; }
        .admin-message-row small { color: #8b97a3; font-size: 11px; }
        .admin-message-row em {
          color: #66727e;
          font-size: 12px;
          font-style: normal;
        }
        .admin-message-copy { white-space: pre-line; }
      `}</style>
    </div>
  );
}
