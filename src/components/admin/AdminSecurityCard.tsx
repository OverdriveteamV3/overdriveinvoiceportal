"use client";

import { useState } from "react";
import AdminIcon from "@/components/admin/AdminIcons";
import type { SecuritySuggestion } from "@/lib/site-security";

type AdminSecurityCardProps = {
  initialMaintenance: boolean;
  suggestions: SecuritySuggestion[];
  canToggle: boolean;
};

export default function AdminSecurityCard({
  initialMaintenance,
  suggestions,
  canToggle,
}: AdminSecurityCardProps) {
  const [open, setOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const attentionCount = suggestions.filter((item) => item.tone === "attention").length;

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
            <h3 className="text-sm font-semibold text-zinc-900">Security</h3>
            <AdminIcon
              name="chevron-down"
              size={16}
              className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
          <p className="mt-1 text-sm text-zinc-500">
            {open
              ? "Suggestions for this dashboard, and the public website switch."
              : maintenance
                ? "Maintenance page is on — click to expand"
                : `${attentionCount} suggestion${attentionCount === 1 ? "" : "s"} — click to expand`}
          </p>
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
          <ul className="space-y-2">
            {suggestions.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <p className="flex items-start gap-2 text-sm font-semibold text-zinc-900">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.tone === "good" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    aria-hidden
                  />
                  {item.title}
                </p>
                <p className="mt-1 pl-4 text-sm leading-relaxed text-zinc-500">{item.detail}</p>
              </li>
            ))}
          </ul>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Enable maintenance page</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                Replaces the public website with a maintenance page. Home, pricing, work, quote, and
                policy pages go down. The dashboard, client portal, and invoices stay open.
              </p>
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
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  maintenance ? "translate-x-5" : "translate-x-0.5"
                }`}
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
