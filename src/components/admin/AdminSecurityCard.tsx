"use client";

import { useState } from "react";
import AdminIcon from "@/components/admin/AdminIcons";

type AdminSecurityCardProps = {
  initialMaintenance: boolean;
  initialEmail: string;
  initialMessage: string;
  canToggle: boolean;
};

export default function AdminSecurityCard({
  initialMaintenance,
  initialEmail,
  initialMessage,
  canToggle,
}: AdminSecurityCardProps) {
  const [open, setOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [error, setError] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [messageNote, setMessageNote] = useState("");

  async function toggleMaintenance() {
    if (!canToggle || busy) return;
    const next = !maintenance;
    setBusy(true);
    setError("");
    setMaintenance(next);
    try {
      const response = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance: next }),
      });
      const payload = (await response.json()) as { maintenance?: boolean; error?: string };
      if (!response.ok || typeof payload.maintenance !== "boolean") {
        setMaintenance(!next);
        setError(payload.error || "Could not update the maintenance page.");
        return;
      }
      setMaintenance(payload.maintenance);
    } catch {
      setMaintenance(!next);
      setError("Could not update the maintenance page.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail() {
    if (!canToggle || savingEmail) return;
    setSavingEmail(true);
    setError("");
    setEmailNote("");
    try {
      const response = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { email?: string; error?: string };
      if (!response.ok || typeof payload.email !== "string") {
        setError(payload.error || "Could not save the maintenance email.");
        return;
      }
      setEmail(payload.email);
      setEmailNote("Saved. The maintenance page email link uses this address.");
    } catch {
      setError("Could not save the maintenance email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function saveMessage() {
    if (!canToggle || savingMessage) return;
    setSavingMessage(true);
    setError("");
    setMessageNote("");
    try {
      const response = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok || typeof payload.message !== "string") {
        setError(payload.error || "Could not save the maintenance message.");
        return;
      }
      setMessage(payload.message);
      setMessageNote("Saved. The maintenance page shows this paragraph.");
    } catch {
      setError("Could not save the maintenance message.");
    } finally {
      setSavingMessage(false);
    }
  }

  return (
    <section className="admin-settings-card">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
      >
        <span className="admin-dash-action-icon mt-0.5 shrink-0">
          <AdminIcon name="shield" size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900">Maintenance</h3>
            <AdminIcon
              name="chevron-down"
              size={16}
              className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
          <p className="mt-1 text-sm text-zinc-500">
            {open
              ? "Turn the public website on or off."
              : maintenance
                ? "Maintenance page is on — click to expand"
                : "Website is live — click to expand"}
          </p>
        </span>
      </button>

      {open ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Enable maintenance page</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                Public pages show a maintenance page. Admin, portal, and invoices stay open.
              </p>
              {canToggle ? (
                <a
                  href="/api/admin/site-preview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Preview website
                </a>
              ) : null}
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Contact email
                <input
                  type="email"
                  value={email}
                  required
                  disabled={!canToggle || savingEmail}
                  autoComplete="off"
                  placeholder="admin@overdriveio.com"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailNote("");
                  }}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-900 disabled:opacity-60"
                />
              </label>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {emailNote || "This address is the email link on the maintenance page."}
                </p>
                <button
                  type="button"
                  onClick={() => void saveEmail()}
                  disabled={!canToggle || savingEmail || !email.includes("@")}
                  className="shrink-0 rounded-md bg-[#0780f7] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingEmail ? "Saving…" : "Save email"}
                </button>
              </div>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Maintenance message
                <textarea
                  value={message}
                  required
                  rows={4}
                  maxLength={1000}
                  disabled={!canToggle || savingMessage}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setMessageNote("");
                  }}
                  className="mt-1 w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium normal-case leading-relaxed tracking-normal text-zinc-900 disabled:opacity-60"
                />
              </label>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {messageNote ||
                    "Shown on the maintenance page. A new line starts a second line. “email us” links to the contact email."}
                </p>
                <button
                  type="button"
                  onClick={() => void saveMessage()}
                  disabled={!canToggle || savingMessage || !message.trim()}
                  className="shrink-0 rounded-md bg-[#0780f7] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {savingMessage ? "Saving…" : "Save message"}
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={maintenance}
              aria-label="Enable maintenance page"
              disabled={!canToggle || busy}
              onClick={() => void toggleMaintenance()}
              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                maintenance ? "bg-[#0780f7]" : "bg-zinc-300"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-150"
                style={{ left: maintenance ? 22 : 2 }}
              />
            </button>
          </div>
          {!canToggle ? (
            <p className="text-sm text-zinc-500">Only the master account can change this switch.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
