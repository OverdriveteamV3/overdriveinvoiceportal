"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PortalAlert } from "@/lib/crm/portal-demo-projects";

type SupportMessage = {
  id: string;
  author: "visitor" | "admin";
  body: string;
  createdAt: string;
};

type Props = {
  locale: "en" | "es";
  open: boolean;
  onClose: () => void;
  alerts: PortalAlert[];
  defaultName: string;
  defaultEmail: string;
  initialTab?: "alerts" | "messages";
};

export default function PortalMessagesPanel({
  locale,
  open,
  onClose,
  alerts,
  defaultName,
  defaultEmail,
  initialTab = "alerts",
}: Props) {
  const es = locale === "es";
  const [tab, setTab] = useState<"alerts" | "messages">(initialTab);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [online, setOnline] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || tab !== "messages") return;
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/support");
        const body = await response.json();
        if (stop || !response.ok) return;
        setOnline(Boolean(body.online));
        setMessages(body.messages ?? []);
        if (body.name) setName(String(body.name));
        if (body.email) setEmail(String(body.email));
        setReady(true);
      } catch {
        if (!stop) setReady(true);
      }
    }
    void load();
    const timer = window.setInterval(load, 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [open, tab]);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, tab, open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || (es ? "No se pudo enviar." : "Could not send."));
        return;
      }
      setOnline(Boolean(body.online));
      setMessages(body.messages ?? []);
      setMessage("");
    } catch {
      setError(es ? "No se pudo enviar." : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const toneClass = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warn: "border-amber-200 bg-amber-50 text-amber-950",
    urgent: "border-rose-200 bg-rose-50 text-rose-950",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40" role="presentation" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="portal-messages-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 id="portal-messages-title" className="text-base font-semibold text-zinc-900">
              {es ? "Mensajes y alertas" : "Messages & alerts"}
            </h2>
            <p className="text-xs text-zinc-500">
              {online
                ? es
                  ? "Soporte en línea"
                  : "Support online"
                : es
                  ? "Soporte fuera de línea"
                  : "Support offline"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-lg text-zinc-500 hover:bg-zinc-100"
            aria-label={es ? "Cerrar" : "Close"}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="flex gap-1 border-b border-zinc-200 px-3 pt-2">
          {(
            [
              ["alerts", es ? "Alertas" : "Alerts", alerts.length],
              ["messages", es ? "Mensajes" : "Messages", messages.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
                tab === id ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
              }`}
              onClick={() => setTab(id)}
            >
              {label}
              {count > 0 ? (
                <span className="ml-1.5 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                  {count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === "alerts" ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {es ? "No hay alertas por ahora." : "No alerts right now."}
              </p>
            ) : (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-xl border px-3 py-3 text-sm ${toneClass[alert.tone]}`}
                >
                  <p className="font-semibold">{alert.title}</p>
                  <p className="mt-1 opacity-90">{alert.body}</p>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {!ready ? (
                <p className="text-sm text-zinc-500">{es ? "Cargando…" : "Loading…"}</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  {es
                    ? "Escribe al equipo de Over Drive. Respondemos aquí."
                    : "Message the Over Drive team. We reply here."}
                </p>
              ) : (
                messages.map((item) => (
                  <div
                    key={item.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      item.author === "admin"
                        ? "bg-zinc-100 text-zinc-800"
                        : "ml-auto bg-zinc-900 text-white"
                    }`}
                  >
                    {item.body}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={onSubmit} className="space-y-2 border-t border-zinc-200 p-4">
              {!email ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    placeholder={es ? "Nombre" : "Name"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <input
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    type="email"
                    placeholder={es ? "Correo" : "Email"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              ) : null}
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder={es ? "Tu mensaje…" : "Your message…"}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {sending ? (es ? "Enviando…" : "Sending…") : es ? "Enviar" : "Send"}
              </button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}
