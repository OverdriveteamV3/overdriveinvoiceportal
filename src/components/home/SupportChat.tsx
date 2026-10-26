"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/locale";

type SupportMessage = {
  id: string;
  author: "visitor" | "admin";
  body: string;
  createdAt: string;
};

type SupportState = {
  online: boolean;
  name: string;
  email: string;
  messages: SupportMessage[];
};

const EMPTY: SupportState = { online: false, name: "", email: "", messages: [] };

export default function SupportChat({ locale = "en" }: { locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [desk, setDesk] = useState<SupportState>(EMPTY);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/support");
        const body = await response.json();
        if (stop || !response.ok) return;
        setDesk({
          online: Boolean(body.online),
          name: String(body.name ?? ""),
          email: String(body.email ?? ""),
          messages: body.messages ?? [],
        });
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
  }, [open]);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [desk.messages.length, open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: desk.name || name,
          email: desk.email || email,
          message,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || (es ? "No se pudo enviar el mensaje." : "Could not send this message."));
        return;
      }
      setDesk({
        online: Boolean(body.online),
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        messages: body.messages ?? [],
      });
      setMessage("");
    } catch {
      setError(es ? "No se pudo enviar el mensaje." : "Could not send this message.");
    } finally {
      setSending(false);
    }
  }

  const es = locale === "es";
  const emailRequired = ready && !desk.online && !desk.email;
  const waitingOnEmail = !desk.online && desk.messages.length > 0 && !desk.email;

  return (
    <div className="support-dock">
      {open ? (
        <section className="support-panel" role="dialog" aria-labelledby="support-title">
          <header className="support-head">
            <div>
              <p id="support-title">{es ? "Soporte" : "Support"}</p>
              <span>{desk.online ? (es ? "En línea" : "Online") : es ? "Fuera de línea" : "Offline"}</span>
            </div>
            <button type="button" aria-label={es ? "Cerrar soporte" : "Close support"} onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="support-thread" ref={threadRef}>
            <p className="support-from-team">
              {desk.online
                ? es
                  ? "Hola. Estamos en línea y podemos conversar aquí. El correo es opcional."
                  : "Hi. We are online, so we can chat here. Email is optional."
                : es
                  ? "Hola. Estamos fuera de línea. Deja una nota y tu correo, y te responderemos por correo."
                  : "Hi. We are offline. Leave a note and your email, and we will reply by email."}
            </p>
            {desk.messages.map((item) => (
              <p
                key={item.id}
                className={item.author === "admin" ? "support-from-team" : "support-from-visitor"}
              >
                {item.body}
              </p>
            ))}
            {waitingOnEmail ? (
              <p className="support-from-team">
                {es
                  ? "Agrega un correo si aún quieres una respuesta cuando estemos fuera de línea."
                  : "Add an email if you still want a reply after we go offline."}
              </p>
            ) : null}
          </div>

          <form onSubmit={onSubmit}>
            {desk.name ? null : (
              <label>
                {es ? "Nombre" : "Name"}
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
            {desk.email ? null : (
              <label>
                <span>
                  {es ? "Correo" : "Email"} {emailRequired ? <abbr title="required">*</abbr> : <em>{es ? "opcional" : "optional"}</em>}
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required={emailRequired}
                  aria-required={emailRequired}
                  maxLength={200}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            <label>
              {es ? "Mensaje" : "Message"}
              <textarea
                name="message"
                required
                minLength={2}
                maxLength={2000}
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            {error ? (
              <p className="support-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="support-send" type="submit" disabled={sending || !ready}>
              {sending ? (es ? "Enviando…" : "Sending…") : es ? "Enviar" : "Send"}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="support-bubble"
        aria-expanded={open}
        aria-label={open ? (es ? "Cerrar el chat" : "Close support chat") : es ? "Abrir el chat" : "Open support chat"}
        onClick={() => setOpen((value) => !value)}
      >
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
        .support-bubble:hover,
        .support-bubble:focus-visible {
          background: #f8f959;
          color: #151f24;
          border-color: #f8f959;
        }
        .support-bubble svg { width: 26px; height: 26px; }
        .support-panel {
          width: min(340px, calc(100vw - 48px));
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
        .support-head button {
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
        .support-thread {
          display: grid;
          gap: 8px;
          max-height: 220px;
          overflow: auto;
          padding: 16px;
        }
        .support-from-team,
        .support-from-visitor {
          margin: 0;
          max-width: 260px;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 1.45;
        }
        .support-from-team {
          border-radius: 12px 12px 12px 4px;
          background: #f3f6f8;
          color: #3d4852;
        }
        .support-from-visitor {
          justify-self: end;
          border-radius: 12px 12px 4px 12px;
          background: #0780f7;
          color: #fff;
        }
        .support-panel form { display: grid; gap: 10px; padding: 0 16px 16px; }
        .support-panel label {
          display: grid;
          gap: 4px;
          color: #66727e;
          font-size: 12px;
          font-weight: 700;
        }
        .support-panel abbr { color: #0780f7; font-weight: 700; text-decoration: none; }
        .support-panel em { color: #8b97a3; font-style: normal; font-weight: 500; }
        .support-panel input,
        .support-panel textarea {
          width: 100%;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          padding: 10px 12px;
          color: #151f24;
          font: inherit;
          font-size: 14px;
          font-weight: 400;
        }
        .support-panel textarea { resize: vertical; }
        .support-error { margin: 0; color: #9b2c2c; font-size: 13px; }
        .support-send {
          border: 0;
          border-radius: 9px;
          padding: 11px 16px;
          background: #0780f7;
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .support-send:disabled { opacity: 0.7; cursor: default; }
        @media (max-width: 640px) {
          .support-dock { right: 16px; bottom: 16px; }
        }
      `}</style>
    </div>
  );
}
