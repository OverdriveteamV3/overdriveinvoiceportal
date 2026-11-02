"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminBalanceBreakdownCard from "@/components/admin/AdminBalanceBreakdownCard";
import AdminClientOnboardModal from "@/components/admin/AdminClientOnboardModal";
import { formatMoney } from "@/lib/drafts";
import type { AdminDashboardActivity, AdminDashboardStats } from "@/lib/admin-dashboard";
import { activityIconName, type AdminIconName } from "@/lib/admin-icons";
import type { DataBinId } from "@/lib/storage/dataBins";
import AdminIcon from "@/components/admin/AdminIcons";
import { adminViewPath } from "@/components/admin/admin-nav";
import { formatCents } from "@/lib/crm/money";

type AdminDashboardPanelProps = {
  stats: AdminDashboardStats;
  onClientSaved?: () => void | Promise<void>;
  onSelectBin: (binId: DataBinId) => void;
};

function MetricCard({
  label,
  value,
  detail,
  accent,
  icon,
  href,
  barValue = 0,
  barMax = 0,
}: {
  label: string;
  value: string;
  detail?: string;
  accent: "blue" | "emerald" | "amber" | "rose" | "violet" | "zinc";
  icon: AdminIconName;
  href: string;
  barValue?: number;
  barMax?: number;
}) {
  const pct =
    barMax > 0 ? Math.min(100, Math.round((barValue / barMax) * 100)) : 0;

  return (
    <Link href={href} className="admin-metric-link group">
      <article className={`admin-metric-card admin-metric-card-${accent}`}>
        <span
          className={`admin-metric-glow admin-metric-glow-${accent}`}
          aria-hidden
        />
        <div className="admin-metric-body">
          <div className="admin-metric-head">
            <p className="admin-metric-label">{label}</p>
            <span className={`admin-metric-icon admin-metric-icon-${accent}`}>
              <AdminIcon name={icon} size={14} />
            </span>
          </div>
          <p className="admin-metric-value">{value}</p>
          {detail ? <p className="admin-metric-detail">{detail}</p> : null}
        </div>
        <div className="admin-metric-bar-track" aria-hidden>
          <div
            className={`admin-metric-bar-fill admin-metric-bar-${accent}`}
            style={{ width: `${Math.max(pct, barValue > 0 ? 4 : 0)}%` }}
          />
        </div>
      </article>
    </Link>
  );
}

function QuickAction({
  icon,
  label,
  href,
  onClick,
}: {
  icon: AdminIconName;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="admin-dash-action-icon">
        <AdminIcon name={icon} size={16} />
      </span>
      <span className="flex-1 text-left">{label}</span>
      <AdminIcon name="chevron-right" size={14} className="text-zinc-300" />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="admin-dash-action">
        {content}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} className="admin-dash-action">
      {content}
    </Link>
  );
}

function formatActivityDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityStatusTextClass(
  status: NonNullable<AdminDashboardActivity["status"]>
): string {
  switch (status) {
    case "Open":
      return "text-amber-700";
    case "Closed":
      return "text-emerald-700";
    case "Overdue":
      return "text-rose-700";
    case "Quote":
      return "text-blue-700";
    case "Draft":
      return "text-zinc-500";
    default:
      return "text-zinc-600";
  }
}

const ACTIVITY_SHEET_GRID =
  "admin-sheet-grid grid grid-cols-[3.25rem_minmax(8rem,1fr)_minmax(10rem,1.4fr)_5.5rem_6.75rem_7.25rem] items-center";

type NewSubmission = {
  id: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  timeline: string;
  contact: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
};

function parseSubmissionBrief(description: string) {
  const goals: string[] = [];
  const details: string[] = [];
  let launch = "";
  let mode: "none" | "goals" | "details" = "none";
  for (const raw of description.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("Goals:")) {
      mode = "goals";
      const goal = line.slice("Goals:".length).trim();
      if (goal) goals.push(goal);
      continue;
    }
    if (line.startsWith("Current website:")) {
      mode = "details";
      continue;
    }
    if (line.startsWith("Target launch:")) {
      mode = "details";
      launch = line.slice("Target launch:".length).trim();
      continue;
    }
    if (mode === "goals") {
      if (line) goals.push(line);
      continue;
    }
    if (line || details.length > 0) details.push(line);
  }
  return {
    goals: goals.join("\n"),
    launch,
    details: details.join("\n").trim(),
  };
}

function formatLaunchDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SubmissionCard({
  item,
  pending,
  onAdd,
}: {
  item: NewSubmission;
  pending: boolean;
  onAdd: () => void;
}) {
  const brief = parseSubmissionBrief(item.description);
  const facts = [
    item.service ? { label: "Service", value: item.service } : null,
    item.budget ? { label: "Budget", value: item.budget } : null,
    item.timeline ? { label: "Timeline", value: item.timeline } : null,
    item.contact ? { label: "Prefers", value: item.contact } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);
  const contacts = [
    item.email ? { label: "Email", value: item.email } : null,
    item.phone ? { label: "Phone", value: item.phone } : null,
    item.website ? { label: "Website", value: item.website } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header className="flex items-start justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900">{item.name || "Website lead"}</p>
          {item.company ? <p className="truncate text-sm text-zinc-500">{item.company}</p> : null}
          <p className="mt-2 truncate text-sm font-medium text-zinc-800">{item.title}</p>
        </div>
        <time className="shrink-0 text-xs text-zinc-400" dateTime={item.createdAt}>
          {formatActivityDate(item.createdAt)}
        </time>
      </header>
      {facts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-px border-t border-zinc-100 bg-zinc-100 sm:grid-cols-4">
          {facts.map((fact) => (
            <li key={fact.label} className="bg-zinc-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{fact.label}</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">{fact.value}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {contacts.length > 0 ? (
        <dl className="grid gap-3 border-t border-zinc-100 px-4 py-4 sm:grid-cols-3">
          {contacts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{fact.label}</dt>
              <dd className="mt-0.5 truncate text-sm text-zinc-800">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {brief.goals || brief.launch || brief.details ? (
        <div className="space-y-3 border-t border-zinc-100 bg-zinc-50 p-4">
          {brief.launch ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Target launch</p>
              <p className="text-sm font-semibold text-zinc-900">{formatLaunchDate(brief.launch)}</p>
            </div>
          ) : null}
          {brief.goals || brief.details ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {brief.goals ? (
                <section className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-[inset_3px_0_0_#0780f7]">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide text-[#0780f7]">Goals</h3>
                  <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                    {brief.goals}
                  </p>
                </section>
              ) : null}
              {brief.details ? (
                <section className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Project</h3>
                  <p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {brief.details}
                  </p>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <footer className="flex justify-end border-t border-zinc-100 px-4 py-3">
        <button
          type="button"
          className="rounded-md bg-[#0780f7] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          disabled={pending}
          onClick={onAdd}
        >
          {pending ? "Adding…" : "Add to pipeline"}
        </button>
      </footer>
    </article>
  );
}

function NewSubmissionTab({
  submissions,
  open,
  addingId,
  error,
  onToggle,
  onAdd,
}: {
  submissions: NewSubmission[];
  open: boolean;
  addingId: string | null;
  error: string;
  onToggle: () => void;
  onAdd: (id: string) => void;
}) {
  const count = submissions.length;
  return (
    <div className="sm:col-span-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 rounded-lg border border-[#0569c9] bg-[#0780f7] px-4 py-4 text-left text-white shadow-[0_8px_20px_rgba(7,128,247,0.28)]"
      >
        <span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f8f959]">
            New submission
          </span>
          <span className="mt-1 block text-lg font-semibold">
            {count === 0
              ? "No website project requests waiting"
              : count === 1
                ? "1 start-a-project request"
                : `${count} start-a-project requests`}
          </span>
          <span className="mt-1 block text-xs text-blue-100">
            Quotes from the live website. Review one here, then add it to the pipeline.
          </span>
        </span>
        <span className="grid h-12 min-w-12 place-items-center rounded-full bg-[#f8f959] px-3 text-lg font-bold text-[#151f24]">
          {count}
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {count === 0 ? (
            <p className="rounded-lg border border-dashed border-blue-200 bg-blue-50 px-4 py-6 text-sm text-blue-900">
              New Start a Project quotes will show up here.
            </p>
          ) : (
            submissions.map((item) => (
              <SubmissionCard
                key={item.id}
                item={item}
                pending={addingId === item.id}
                onAdd={() => onAdd(item.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminDashboardPanel({
  stats,
  onClientSaved,
  onSelectBin,
}: AdminDashboardPanelProps) {
  const invoiceTotal = stats.openInvoices + stats.closedInvoices;
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [crm, setCrm] = useState<{
    openPipelineCents: number;
    invoicedCents: number;
    netCollectedCents: number;
    overdueCents: number;
    openTasks: number;
    projects: number;
    newSubmissions: NewSubmission[];
  } | null>(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crm/overview")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body) {
          setCrm({ ...body, newSubmissions: body.newSubmissions ?? [] });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <AdminClientOnboardModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSaved={onClientSaved ?? (() => undefined)}
      />
      <section className="admin-dash-hero">
        <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0 lg:max-w-[46%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/80">
              Overview
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Business at a glance
            </h2>
            <p className="mt-2 text-sm text-blue-100/80">
              Live snapshot from your quotes, invoices, clients, and outstanding
              balances.
            </p>
          </div>
          <div className="admin-dash-hero-stats">
            <div className="admin-dash-hero-stat">
              <p className="admin-dash-hero-stat-label">Outstanding</p>
              <p className="admin-dash-hero-stat-value">
                {formatMoney(stats.outstandingBalance)}
              </p>
            </div>
            <div className="admin-dash-hero-stat">
              <p className="admin-dash-hero-stat-label">Quote pipeline</p>
              <p className="admin-dash-hero-stat-value">
                {formatMoney(stats.quotePipeline)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {crm ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <NewSubmissionTab
            submissions={crm.newSubmissions}
            open={submissionsOpen}
            addingId={addingId}
            error={submissionError}
            onToggle={() => setSubmissionsOpen((value) => !value)}
            onAdd={async (id) => {
              setSubmissionError("");
              setAddingId(id);
              try {
                const response = await fetch(`/api/crm/opportunities/${id}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "stage",
                    stage: "qualification",
                    reason: "Added to the pipeline from a website project request",
                  }),
                });
                const body = (await response.json().catch(() => null)) as { error?: string } | null;
                if (!response.ok) {
                  setSubmissionError(body?.error || "Could not add this request to the pipeline.");
                  return;
                }
                setCrm((current) =>
                  current
                    ? {
                        ...current,
                        newSubmissions: current.newSubmissions.filter((item) => item.id !== id),
                      }
                    : current
                );
              } catch {
                setSubmissionError("Could not add this request to the pipeline.");
              } finally {
                setAddingId(null);
              }
            }}
          />
          {[
            { label: "Open pipeline", value: formatCents(crm.openPipelineCents), detail: "Estimates, not revenue" },
            { label: "Invoiced", value: formatCents(crm.invoicedCents), detail: "Issued CRM invoices" },
            { label: "Net collected", value: formatCents(crm.netCollectedCents), detail: "Succeeded payments minus refunds" },
            { label: "Overdue", value: formatCents(crm.overdueCents), detail: "Outstanding past due" },
            {
              label: "Projects",
              value: String(crm.projects),
              detail: `${crm.openTasks} open tasks`,
              href: adminViewPath("projects", "dashboard"),
            },
          ].map((card) => {
            const body = (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{card.value}</p>
                <p className="text-xs text-zinc-500">{card.detail}</p>
              </>
            );
            if (!card.href) {
              return (
                <article key={card.label} className="rounded-lg border border-zinc-200 bg-white p-4">
                  {body}
                </article>
              );
            }
            return (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-400"
              >
                {body}
              </Link>
            );
          })}
        </section>
      ) : null}

      <section className="admin-metric-grid">
        <MetricCard
          accent="amber"
          icon="folder-open"
          label="Open"
          value={String(stats.openInvoices)}
          detail={`${formatMoney(stats.outstandingBalance)} due`}
          href="/admin?view=documents&from=dashboard"
          barValue={stats.openInvoices}
          barMax={invoiceTotal}
        />
        <MetricCard
          accent="emerald"
          icon="check-circle"
          label="Closed"
          value={String(stats.closedInvoices)}
          detail={formatMoney(stats.closedBalance)}
          href="/admin?view=documents&from=dashboard"
          barValue={stats.closedInvoices}
          barMax={invoiceTotal}
        />
        <MetricCard
          accent="rose"
          icon="clock"
          label="Overdue"
          value={String(stats.overdueInvoices)}
          detail="Past due w/ balance"
          href="/admin?view=documents&from=dashboard"
          barValue={stats.overdueInvoices}
          barMax={Math.max(stats.openInvoices, 1)}
        />
        <MetricCard
          accent="blue"
          icon="quotes"
          label="Quotes"
          value={String(stats.totalQuotes)}
          detail={formatMoney(stats.quotePipeline)}
          href="/admin?view=quotes&from=dashboard"
          barValue={stats.totalQuotes}
          barMax={Math.max(stats.totalQuotes, stats.totalInvoices, 1)}
        />
        <MetricCard
          accent="violet"
          icon="user-plus"
          label="New clients"
          value={String(stats.newClients)}
          detail={`${stats.totalClients} total`}
          href="/admin?view=clients&from=dashboard"
          barValue={stats.newClients}
          barMax={Math.max(stats.totalClients, 1)}
        />
        <MetricCard
          accent="zinc"
          icon="drafts"
          label="Drafts"
          value={String(stats.activeDrafts)}
          detail={`${stats.totalInvoices} invoices`}
          href="/admin?view=drafts&from=dashboard"
          barValue={stats.activeDrafts}
          barMax={Math.max(stats.activeDrafts, 1)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminBalanceBreakdownCard
          title="Dashboard balances"
          subtitle={`Invoice status across ${invoiceTotal || "no"} tracked invoice${invoiceTotal === 1 ? "" : "s"}`}
          open={stats.openInvoices}
          closed={stats.closedInvoices}
          overdue={stats.overdueInvoices}
          amounts={{
            open: stats.openBalance,
            closed: stats.closedBalance,
            overdue: stats.overdueBalance,
          }}
          footerLabel="Total open invoices"
          footerAmount={stats.openBalance}
        />

        <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Quick actions</h3>
          <p className="mt-1 text-xs text-zinc-500">Jump into common workflows</p>
          <div className="mt-4 grid gap-2">
            <QuickAction
              href="/invoice"
              icon="pencil"
              label="New quote or invoice"
            />
            <QuickAction
              icon="user-plus"
              label="Add new client"
              onClick={() => setClientModalOpen(true)}
            />
            <QuickAction
              icon="lineItems"
              label="Add line item"
              onClick={() => onSelectBin("lineItems")}
            />
            <QuickAction
              icon="labor"
              label="Add Systems cost"
              onClick={() => onSelectBin("labor")}
            />
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">Recent activity</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Latest updates across clients, quotes, and invoices
          </p>
        </div>
        {stats.recentActivity.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            No activity yet — create a quote or invoice to get started.
          </p>
        ) : (
          <div className="admin-sheet">
            <div className={`${ACTIVITY_SHEET_GRID} admin-sheet-head`}>
              <div className="admin-sheet-cell admin-sheet-cell-head" aria-hidden />
              <div className="admin-sheet-cell admin-sheet-cell-head">Record</div>
              <div className="admin-sheet-cell admin-sheet-cell-head">Details</div>
              <div className="admin-sheet-cell admin-sheet-cell-head">Status</div>
              <div className="admin-sheet-cell admin-sheet-cell-head text-right">
                Amount
              </div>
              <div className="admin-sheet-cell admin-sheet-cell-head text-right">
                Updated
              </div>
            </div>
            {stats.recentActivity.map((item) => (
              <div key={item.id} className={`${ACTIVITY_SHEET_GRID} admin-sheet-row`}>
                <div
                  className="admin-sheet-cell flex items-center justify-center"
                  title={item.type}
                >
                  <span className="admin-sheet-type-icon">
                    <AdminIcon name={activityIconName(item.type)} size={14} />
                  </span>
                </div>
                <div className="admin-sheet-cell truncate font-medium text-zinc-900">
                  {item.label}
                </div>
                <div className="admin-sheet-cell truncate text-zinc-600">
                  {item.metaLine}
                </div>
                <div
                  className={`admin-sheet-cell truncate text-xs font-medium uppercase tracking-wide ${
                    item.status
                      ? activityStatusTextClass(item.status)
                      : "text-zinc-400"
                  }`}
                >
                  {item.status ?? "—"}
                </div>
                <div className="admin-sheet-cell text-right tabular-nums">
                  {item.amount !== null ? (
                    <>
                      <span className="font-medium text-zinc-900">
                        {formatMoney(item.amount)}
                      </span>
                      {item.amountLabel ? (
                        <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-zinc-400">
                          {item.amountLabel}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </div>
                <div className="admin-sheet-cell text-right text-xs tabular-nums text-zinc-500">
                  {formatActivityDate(item.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
