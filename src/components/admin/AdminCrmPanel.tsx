"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CrmView } from "@/components/admin/admin-nav";
import AdminSupportPanel from "@/components/admin/AdminSupportPanel";
import { formatCents, budgetMeter } from "@/lib/crm/money";
import { revisionMeter } from "@/lib/crm/revisions";
import {
  PROJECT_STAGE_LABELS,
  SALES_STAGE_LABELS,
  SALES_STAGES,
  isOpenPipelineStage,
  onboardingPercent,
  type ProjectStage,
  type SalesStage,
} from "@/lib/crm/stages";

type Opportunity = {
  id: string;
  title: string;
  stage: SalesStage;
  source: string;
  estimated_value_cents: number;
  currency: string;
  next_action: string;
  follow_up_on: string | null;
  owner_profile_id: string;
  archived_at: string | null;
  service_interest: string;
  created_at: string;
  updated_at: string;
  clients?: { display_name?: string; company_name?: string; email?: string } | null;
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export default function AdminCrmPanel({ view }: { view: CrmView }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [budgets, setBudgets] = useState<Array<Record<string, unknown>>>([]);
  const [listMode, setListMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (view === "pipeline") {
        setOpportunities((await readJson(await fetch("/api/crm/opportunities"))).opportunities ?? []);
      } else if (view === "orders") {
        setOrders((await readJson(await fetch("/api/crm/orders"))).orders ?? []);
      } else if (view === "projects") {
        setProjects((await readJson(await fetch("/api/crm/projects"))).projects ?? []);
      } else if (view === "wallet") {
        const [invoiceBody, budgetBody] = await Promise.all([
          readJson(await fetch("/api/crm/invoices")),
          readJson(await fetch("/api/crm/budgets")),
        ]);
        setInvoices(invoiceBody.invoices ?? []);
        setBudgets(budgetBody.projects ?? []);
      } else if (view === "tasks") {
        setTasks((await readJson(await fetch("/api/crm/tasks"))).tasks ?? []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this view.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (view === "messages") return;
    void load();
  }, [load, view]);

  if (view === "messages") return <AdminSupportPanel />;

  async function post(url: string, body: unknown) {
    setError(null);
    try {
      await readJson(
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      await load();
      return true;
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Request failed.");
      return false;
    }
  }

  return (
    <div className="space-y-4 p-6">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      {!loading && view === "pipeline" ? (
        <Pipeline
          opportunities={opportunities}
          listMode={listMode}
          onToggle={() => setListMode((value) => !value)}
          onCreate={(body) => post("/api/crm/opportunities", body)}
          onStage={(id, stage) => post(`/api/crm/opportunities/${id}`, { action: "stage", stage })}
        />
      ) : null}

      {!loading && view === "orders" ? (
        <OrderList
          orders={orders}
          onAccept={(agreementId) => post("/api/crm/orders", { action: "accept-agreement", agreementId })}
        />
      ) : null}

      {!loading && view === "projects" ? (
        <ProjectList
          projects={projects}
          onStage={(id, stage) => post(`/api/crm/projects/${id}`, { action: "stage", stage })}
          onOnboarding={(id, itemId, state) =>
            post(`/api/crm/projects/${id}`, { action: "onboarding", itemId, state })
          }
          onNote={(id, itemId, notes) =>
            post(`/api/crm/projects/${id}`, { action: "onboarding-note", itemId, notes })
          }
          onRevision={(projectId, title) => post("/api/crm/revisions", { projectId, title, body: title })}
          onAcceptRevision={(id) => post(`/api/crm/revisions/${id}`, { action: "accept" })}
          onInvite={(projectId, email) => post("/api/portal/invites", { projectId, email })}
        />
      ) : null}

      {!loading && view === "wallet" ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Collected</h3>
            <PaymentList
              invoices={invoices}
              onIssue={(invoiceId) => post("/api/crm/invoices", { action: "issue", invoiceId })}
              onManual={(body) => post("/api/crm/payments/manual", body)}
            />
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Internal budgets</h3>
            <BudgetList
              projects={budgets}
              onSave={(id, category, amount) => post(`/api/crm/projects/${id}`, { action: "budget", category, amount })}
            />
          </section>
        </div>
      ) : null}

      {!loading && view === "tasks" ? (
        <TaskList tasks={tasks} onComplete={(id) => post("/api/crm/tasks", { id })} />
      ) : null}

    </div>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  phone: "Phone",
  referral: "Referral",
  email: "Email",
  social: "Social",
  existing_client: "Existing client",
  website: "Website",
};

function daysInStage(updatedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000));
}

function Pipeline({
  opportunities,
  listMode,
  onToggle,
  onCreate,
  onStage,
}: {
  opportunities: Opportunity[];
  listMode: boolean;
  onToggle: () => void;
  onCreate: (body: Record<string, string>) => void;
  onStage: (id: string, stage: string) => void;
}) {
  const open = opportunities.filter((row) => !row.archived_at);
  const pipeline = open.filter((row) => isOpenPipelineStage(row.stage));
  const pipelineValue = pipeline.reduce((sum, row) => sum + row.estimated_value_cents, 0);
  const today = new Date().toISOString().slice(0, 10);
  const followUps = open.filter((row) => row.follow_up_on && row.follow_up_on <= today).length;
  const stale = open.filter((row) => daysInStage(row.updated_at) >= 7).length;
  const stageRows = SALES_STAGES.map((stage) => {
    const rows = open.filter((item) => item.stage === stage);
    return {
      stage,
      count: rows.length,
      value: rows.reduce((sum, item) => sum + item.estimated_value_cents, 0),
    };
  });
  const maxCount = Math.max(1, ...stageRows.map((row) => row.count));
  const [selected, setSelected] = useState<SalesStage>(
    stageRows.find((row) => row.count > 0)?.stage ?? "new_lead"
  );
  const selectedRows = open.filter((row) => row.stage === selected);
  const sources = Object.entries(
    pipeline.reduce<Record<string, number>>((counts, row) => {
      counts[row.source] = (counts[row.source] ?? 0) + 1;
      return counts;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <PipelineStat
          label="Open pipeline"
          value={String(pipeline.length)}
          detail={`${formatCents(pipelineValue)} estimated. Not revenue.`}
          meter={pipeline.length === 0 ? 0 : 100}
        />
        <PipelineStat
          label="Follow-ups due"
          value={String(followUps)}
          detail={followUps === 0 ? "None dated for today or earlier." : "Dated for today or earlier."}
          meter={open.length === 0 ? 0 : Math.round((followUps / open.length) * 100)}
        />
        <PipelineStat
          label="Sitting 7+ days"
          value={String(stale)}
          detail="Unchanged in the current stage."
          meter={open.length === 0 ? 0 : Math.round((stale / open.length) * 100)}
        />
      </div>

      <form
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onCreate({
            displayName: String(form.get("displayName") ?? ""),
            title: String(form.get("title") ?? ""),
            email: String(form.get("email") ?? ""),
            source: String(form.get("source") ?? "manual"),
            serviceInterest: String(form.get("serviceInterest") ?? ""),
          });
          event.currentTarget.reset();
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">Add a prospect</h3>
          <div className="flex rounded-md border border-zinc-200 bg-white p-0.5" role="group" aria-label="Pipeline layout">
            <button
              type="button"
              className={`rounded px-2.5 py-1 text-xs font-medium ${listMode ? "text-zinc-500" : "bg-zinc-900 text-white"}`}
              aria-pressed={!listMode}
              onClick={() => {
                if (listMode) onToggle();
              }}
            >
              Board
            </button>
            <button
              type="button"
              className={`rounded px-2.5 py-1 text-xs font-medium ${listMode ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
              aria-pressed={listMode}
              onClick={() => {
                if (!listMode) onToggle();
              }}
            >
              List
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs font-medium text-zinc-600">
            Name
            <input name="displayName" required className="field mt-1" placeholder="Harbor Studio" />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Project
            <input name="title" required className="field mt-1" placeholder="Website redesign" />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Email
            <input name="email" type="email" className="field mt-1" placeholder="name@company.com" />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Source
            <select name="source" className="field mt-1" defaultValue="manual">
              {Object.entries(SOURCE_LABELS)
                .filter(([value]) => value !== "website")
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
          </label>
        </div>
        <button className="btn mt-3 text-xs" type="submit">Add prospect</button>
      </form>

      {open.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          No open opportunities yet. Add a prospect to start the board.
        </p>
      ) : listMode ? (
        <ul className="space-y-2">
          {open.map((row) => (
            <OpportunityCard key={row.id} row={row} onStage={onStage} />
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="rounded-xl border border-zinc-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stage funnel</p>
            <p className="mt-1 text-[11px] text-zinc-500">Bar length is the number of leads. The amount is the estimate.</p>
            <div className="mt-3 space-y-1">
              {stageRows.map((row, index) => {
                const width = row.count === 0 ? 0 : Math.max(12, Math.round((row.count / maxCount) * 100));
                const decision = row.stage === "accepted_pending";
                return (
                  <div key={row.stage}>
                    {decision ? (
                      <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">After acceptance</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelected(row.stage)}
                      aria-pressed={selected === row.stage}
                      className={`w-full rounded-md px-1.5 py-1 text-left ${selected === row.stage ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                    >
                      <span className="flex items-start justify-between gap-2 text-[11px] leading-tight">
                        <span className="min-w-0 font-medium text-zinc-800">{index + 1}. {SALES_STAGE_LABELS[row.stage]}</span>
                        <span className="shrink-0 tabular-nums text-zinc-500">{row.count}</span>
                      </span>
                      <span className="mt-1 block h-1.5 rounded-full bg-zinc-100" aria-hidden>
                        <span className="block h-1.5 rounded-full bg-zinc-900" style={{ width: `${width}%` }} />
                      </span>
                      <span className="mt-0.5 block text-[10px] text-zinc-500">{formatCents(row.value)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            {sources.length > 0 ? (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Where open leads came from</p>
                <ul className="mt-2 space-y-1.5">
                  {sources.map(([source, count]) => (
                    <li key={source} className="grid grid-cols-[72px_1fr_16px] items-center gap-2 text-[11px] text-zinc-600">
                      <span>{SOURCE_LABELS[source] ?? source}</span>
                      <span className="h-1.5 rounded-full bg-zinc-100" aria-hidden>
                        <span
                          className="block h-1.5 rounded-full bg-blue-700"
                          style={{ width: `${Math.max(8, Math.round((count / Math.max(pipeline.length, 1)) * 100))}%` }}
                        />
                      </span>
                      <span className="tabular-nums text-right">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">{SALES_STAGE_LABELS[selected]}</h3>
              <p className="text-xs text-zinc-500">
                {selectedRows.length === 1 ? "1 lead" : `${selectedRows.length} leads`}
              </p>
            </div>
            {selectedRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
                Nothing in this stage. Choose another bar, or add a prospect.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedRows.map((row) => (
                  <OpportunityCard key={row.id} row={row} onStage={onStage} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineStat({
  label,
  value,
  detail,
  meter,
}: {
  label: string;
  value: string;
  detail: string;
  meter: number;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
      <div className="mt-2 h-1.5 rounded-full bg-zinc-100" aria-hidden>
        <div className="h-1.5 rounded-full bg-zinc-900" style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
      </div>
    </article>
  );
}

function OpportunityCard({
  row,
  onStage,
}: {
  row: Opportunity;
  onStage: (id: string, stage: string) => void;
}) {
  const ageDays = daysInStage(row.updated_at);
  const agePercent = Math.min(100, Math.round((ageDays / 14) * 100));
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{row.clients?.display_name || "Client"}</p>
          <p className="truncate text-zinc-600">{row.title}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-base font-semibold tabular-nums text-zinc-900">
            {formatCents(row.estimated_value_cents, row.currency)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-400">Estimate</span>
        </p>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {SOURCE_LABELS[row.source] ?? row.source}
        {row.service_interest ? ` · ${row.service_interest}` : ""}
        {row.follow_up_on ? ` · Follow up ${row.follow_up_on}` : ""}
      </p>
      <p className="mt-2 text-xs text-zinc-800">{row.next_action || "No next action"}</p>
      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>{ageDays} day{ageDays === 1 ? "" : "s"} in this stage</span>
          <span>{ageDays >= 7 ? "Needs attention" : "Recent"}</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-zinc-100" aria-hidden>
          <div className={`h-1.5 rounded-full ${ageDays >= 7 ? "bg-amber-500" : "bg-zinc-900"}`} style={{ width: `${Math.max(agePercent, ageDays > 0 ? 8 : 0)}%` }} />
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <select
          className="field text-xs"
          aria-label={`Stage for ${row.title}`}
          value={row.stage}
          onChange={(event) => onStage(row.id, event.target.value)}
        >
          {SALES_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {SALES_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        <a className="btn-outline text-center text-xs" href={`/invoice?opportunity=${row.id}`}>
          Quote
        </a>
        <button
          type="button"
          className="btn-outline text-xs"
          onClick={async () => {
            try {
              const payload = await readJson(
                await fetch(`/api/crm/quotes?opportunityId=${row.id}`)
              );
              const latest = payload.versions?.[0];
              if (!latest) {
                window.alert("Save a quote version from the editor first.");
                return;
              }
              await readJson(
                await fetch(`/api/crm/quotes/${latest.id}/accept`, { method: "POST" })
              );
              window.location.href = "/admin?view=orders";
            } catch (acceptError) {
              window.alert(acceptError instanceof Error ? acceptError.message : "Could not accept the quote.");
            }
          }}
        >
          Accept latest
        </button>
      </div>
    </article>
  );
}

function OrderList({
  orders,
  onAccept,
}: {
  orders: Array<Record<string, unknown>>;
  onAccept: (agreementId: string) => void;
}) {
  if (orders.length === 0) return <p className="text-sm text-zinc-500">No orders yet. Accept a quote version to create one.</p>;
  return (
    <ul className="space-y-2">
      {orders.map((order) => {
        const agreement = Array.isArray(order.agreements) ? order.agreements[0] : order.agreements;
        const agreementId = (agreement as { id?: string } | null)?.id;
        const status = (agreement as { status?: string } | null)?.status;
        return (
          <li key={String(order.id)} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-medium">{String(order.document_number)} · {String(order.status).replaceAll("_", " ")}</p>
            <p className="text-zinc-600">{formatCents(Number(order.total_cents), String(order.currency))}</p>
            <p className="text-xs text-zinc-500">Agreement: {status || "none"}. Accepting the agreement does not mark any invoice paid.</p>
            {agreementId && status !== "accepted" ? (
              <button type="button" className="btn mt-2 text-xs" onClick={() => onAccept(agreementId)}>
                Record agreement acceptance
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

const DELIVERY_GROUPS: Array<{ title: string; stages: ProjectStage[] }> = [
  { title: "Start", stages: ["awaiting_onboarding", "ready_for_kickoff", "scheduled"] },
  { title: "Build", stages: ["design", "development", "internal_qa"] },
  { title: "Review", stages: ["client_review", "revisions"] },
  { title: "Finish", stages: ["awaiting_final_payment", "ready_to_launch", "delivered", "support"] },
];

const PROJECT_STEPS = ["onboarding", "delivery", "revisions", "client"] as const;
type ProjectStep = (typeof PROJECT_STEPS)[number];

type OnboardingItem = { id: string; label: string; required: boolean; state: string; notes?: string };

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path fill="#F6C945" d="M5 2.5h9.2L20 8.2V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V4A1.5 1.5 0 0 1 5.5 2.5H5z" />
      <path fill="#E2AD1E" d="M14.2 2.6 19.8 8.2H14.2z" />
      <path fill="#FFF8DC" d="M7.2 11.4h8.1v1.15H7.2zm0 2.5h8.1v1.15H7.2zm0 2.5h5.2v1.15H7.2z" />
    </svg>
  );
}
type RevisionRound = { id: string; title: string; state: string; kind: string };
type ProjectClient = {
  display_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
};

function clientInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "C";
}

function clientWebsite(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const NOTE_PAGE_BREAK = "\f";

function splitNotePages(notes: string): string[] {
  if (!notes) return [""];
  const pages = notes.split(NOTE_PAGE_BREAK);
  return pages.length > 0 ? pages : [""];
}

function joinNotePages(pages: string[]): string {
  const kept = [...pages];
  while (kept.length > 1 && kept[kept.length - 1].trim() === "") kept.pop();
  if (kept.length <= 1) return kept[0] ?? "";
  return kept.join(NOTE_PAGE_BREAK);
}

function ProjectList({
  projects,
  onStage,
  onOnboarding,
  onNote,
  onRevision,
  onAcceptRevision,
  onInvite,
}: {
  projects: Array<Record<string, unknown>>;
  onStage: (id: string, stage: string) => void;
  onOnboarding: (projectId: string, itemId: string, state: string) => void;
  onNote: (projectId: string, itemId: string, notes: string) => Promise<boolean>;
  onRevision: (projectId: string, title: string) => void;
  onAcceptRevision: (id: string) => void;
  onInvite: (projectId: string, email: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<ProjectStep>("onboarding");
  const [noteTarget, setNoteTarget] = useState<OnboardingItem | null>(null);
  const [notePages, setNotePages] = useState<string[]>([""]);
  const [notePage, setNotePage] = useState(0);
  const noteAreaRef = useRef<HTMLTextAreaElement>(null);
  const noteCursor = useRef<number | null>(null);
  useEffect(() => {
    if (!noteTarget) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNoteTarget(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noteTarget]);
  useEffect(() => {
    const area = noteAreaRef.current;
    if (!area || noteCursor.current == null) return;
    const pos = noteCursor.current;
    area.focus();
    area.setSelectionRange(pos, pos);
    noteCursor.current = null;
  }, [notePages, notePage]);
  if (projects.length === 0) {
    return <p className="text-sm text-zinc-500">No projects yet. Accept a quote to open one.</p>;
  }
  const current = projects.find((project) => String(project.id) === activeId) ?? projects[0];
  const id = String(current.id);
  const items = (current.onboarding_items as OnboardingItem[]) ?? [];
  const rounds = (current.revision_rounds as RevisionRound[]) ?? [];
  const progress = onboardingPercent(items);
  const meter = revisionMeter(Number(current.rounds_used ?? 0), Number(current.revision_allowance ?? 3));
  const stage = String(current.stage) as ProjectStage;
  const stageLabel = PROJECT_STAGE_LABELS[stage] ?? String(current.stage);
  const nextItem = items.find((item) => item.required && item.state !== "complete" && item.state !== "not_applicable");
  const waitingRounds = rounds.filter((round) => round.state === "submitted" || round.state === "clarification_needed");
  const client = current.clients as ProjectClient | null;
  const companyName = client?.company_name?.trim() ?? "";
  const personName = client?.display_name?.trim() ?? "";
  const clientName = companyName || personName || "Client";
  const contactName = companyName && personName && companyName !== personName ? personName : "";
  const projectName = String(current.name);
  const clientEmail = client?.email?.trim() ?? "";
  const clientPhone = client?.phone?.trim() ?? "";
  const clientSite = client?.website?.trim() ?? "";
  const nextStepTab: ProjectStep = nextItem ? "onboarding" : waitingRounds.length > 0 ? "revisions" : "delivery";
  const nextStep = nextItem
    ? `Mark “${nextItem.label}” done`
    : waitingRounds.length > 0
      ? "Accept or answer the open revision"
      : `Move delivery from ${stageLabel}`;
  const deliveryIndex = DELIVERY_GROUPS.findIndex((group) => group.stages.includes(stage));
  const offPath = stage === "on_hold" || stage === "cancelled";
  const deliveryPath = DELIVERY_GROUPS.flatMap((group) => group.stages);
  const deliveryPlace = deliveryPath.indexOf(stage);
  const deliveryPercent = offPath || deliveryPlace < 0 ? 0 : Math.round(((deliveryPlace + 1) / deliveryPath.length) * 100);
  const revisionPercent = meter.allowance === 0 ? 100 : Math.round((Math.min(meter.used, meter.allowance) / meter.allowance) * 100);
  const clientBits = [clientEmail, clientPhone, clientSite].filter(Boolean);
  const clientPercent = Math.round((clientBits.length / 3) * 100);
  const clientDetail = clientBits.length === 0 ? "No contact details" : clientBits.length === 3 ? "Contact complete" : clientBits.join(" · ");
  const workflowBars: Array<{ id: ProjectStep; label: string; percent: number; detail: string }> = [
    { id: "onboarding", label: "Onboarding", percent: progress.percent, detail: `${progress.complete} of ${progress.total} required` },
    { id: "delivery", label: "Delivery", percent: deliveryPercent, detail: stageLabel },
    { id: "revisions", label: "Revisions", percent: revisionPercent, detail: `${meter.used} of ${meter.allowance} used` },
    { id: "client", label: "Client", percent: clientPercent, detail: clientDetail },
  ];
  const pageText = notePages[notePage] ?? "";

  function writeNotePage(value: string) {
    setNotePages((pages) => pages.map((page, index) => (index === notePage ? value : page)));
  }

  function insertAtCursor(insert: string) {
    const area = noteAreaRef.current;
    const start = area?.selectionStart ?? pageText.length;
    const end = area?.selectionEnd ?? pageText.length;
    writeNotePage(pageText.slice(0, start) + insert + pageText.slice(end));
    noteCursor.current = start + insert.length;
  }

  function insertBullet() {
    const area = noteAreaRef.current;
    const start = area?.selectionStart ?? pageText.length;
    const atLineStart = start === 0 || pageText[start - 1] === "\n";
    insertAtCursor(atLineStart ? "• " : "\n• ");
  }

  function insertPlainLine() {
    insertAtCursor("\n");
  }

  function showPreviousPage() {
    setNotePage((index) => Math.max(0, index - 1));
  }

  function showNextPage() {
    if (notePage < notePages.length - 1) {
      setNotePage(notePage + 1);
      return;
    }
    setNotePages((pages) => [...pages, ""]);
    setNotePage(notePage + 1);
  }

  return (
    <div className="space-y-4">
      {projects.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Projects">
          {projects.map((project) => {
            const projectId = String(project.id);
            const selected = projectId === id;
            return (
              <button
                key={projectId}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`rounded-full border px-3 py-1 text-xs ${selected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600"}`}
                onClick={() => setActiveId(projectId)}
              >
                {String(project.name)}
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white" aria-hidden>
              {clientInitials(clientName)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Client</p>
              <h3 className="truncate text-base font-semibold text-zinc-900">{clientName}</h3>
              <p className="truncate text-sm text-zinc-500">{contactName ? `${contactName} · ${projectName}` : projectName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {clientEmail ? (
                  <a className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-200" href={`mailto:${clientEmail}`}>
                    {clientEmail}
                  </a>
                ) : (
                  <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-400">No email</span>
                )}
                {clientPhone ? (
                  <a className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-200" href={`tel:${clientPhone}`}>
                    {clientPhone}
                  </a>
                ) : (
                  <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-400">No phone</span>
                )}
                {clientSite ? (
                  <a className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-200" href={clientWebsite(clientSite)} target="_blank" rel="noreferrer">
                    {clientSite.replace(/^https?:\/\//i, "")}
                  </a>
                ) : (
                  <span className="rounded-full bg-zinc-50 px-2.5 py-1 text-xs text-zinc-400">No website</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="max-w-56 rounded-lg bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100"
            onClick={() => setStep(nextStepTab)}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Next step</span>
            <span className="mt-1 block text-xs font-medium text-zinc-900">{nextStep}</span>
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            aria-pressed={step === "onboarding"}
            className={`rounded-lg border p-3 text-left ${step === "onboarding" ? "border-zinc-900 bg-white" : "border-transparent bg-zinc-50 hover:bg-zinc-100"}`}
            onClick={() => setStep("onboarding")}
          >
            <span className="flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(#18181b ${progress.percent}%, #e4e4e7 0)` }}
                aria-hidden
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[11px] font-semibold text-zinc-900">
                  {progress.percent}%
                </span>
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Onboarding</span>
                <span className="block text-sm font-semibold text-zinc-900">{progress.complete} of {progress.total} required</span>
                <span className="block text-[11px] text-zinc-500">{progress.total - progress.complete} still open</span>
              </span>
            </span>
          </button>

          <button
            type="button"
            aria-pressed={step === "revisions"}
            className={`rounded-lg border p-3 text-left ${step === "revisions" ? "border-zinc-900 bg-white" : "border-transparent bg-zinc-50 hover:bg-zinc-100"}`}
            onClick={() => setStep("revisions")}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Revisions</span>
            <span className="mt-2 flex gap-1" aria-hidden>
              {meter.segments.map((used, index) => (
                <span key={index} className={`h-2 flex-1 rounded-full ${used ? "bg-zinc-900" : "bg-zinc-200"}`} />
              ))}
            </span>
            <span className="mt-2 block text-sm font-semibold text-zinc-900">{meter.remaining} of {meter.allowance} left</span>
            <span className="block text-[11px] text-zinc-500">
              {waitingRounds.length > 0 ? `${waitingRounds.length} waiting on you` : meter.detail}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={step === "delivery"}
            className={`rounded-lg border p-3 text-left ${step === "delivery" ? "border-zinc-900 bg-white" : "border-transparent bg-zinc-50 hover:bg-zinc-100"}`}
            onClick={() => setStep("delivery")}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Delivery</span>
            {offPath ? (
              <span className="mt-2 block text-sm font-semibold text-zinc-900">{stageLabel}</span>
            ) : (
              <span className="mt-2 flex items-center" aria-hidden>
                {DELIVERY_GROUPS.map((group, index) => {
                  const passed = deliveryIndex > index;
                  const active = deliveryIndex === index;
                  return (
                    <span key={group.title} className="flex min-w-0 flex-1 items-center">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-zinc-900 ring-4 ring-zinc-300" : passed ? "bg-zinc-900" : "bg-zinc-300"}`} />
                      {index < DELIVERY_GROUPS.length - 1 ? (
                        <span className={`mx-1 h-0.5 flex-1 ${passed ? "bg-zinc-900" : "bg-zinc-200"}`} />
                      ) : null}
                    </span>
                  );
                })}
              </span>
            )}
            <span className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-zinc-400" aria-hidden>
              {offPath ? <span>Outside the main path</span> : DELIVERY_GROUPS.map((group) => <span key={group.title}>{group.title}</span>)}
            </span>
            <span className="mt-1 block text-sm font-semibold text-zinc-900">{stageLabel}</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Project workflow">
        {workflowBars.map((bar) => {
          const selected = step === bar.id;
          return (
            <button
              key={bar.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-lg border px-3 py-2 text-left ${selected ? "border-zinc-900 bg-white" : "border-zinc-200 bg-zinc-50 hover:bg-white"}`}
              onClick={() => setStep(bar.id)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{bar.label}</span>
                <span className="text-[11px] font-semibold tabular-nums text-zinc-900">{bar.percent}%</span>
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-zinc-200" aria-hidden>
                <span className="block h-full rounded-full bg-zinc-900" style={{ width: `${bar.percent}%` }} />
              </span>
              <span className="mt-1.5 block truncate text-[11px] text-zinc-600">{bar.detail}</span>
            </button>
          );
        })}
      </div>

      {step === "onboarding" ? (
        <ul className="space-y-2">
          {items.map((item) => {
            const done = item.state === "complete" || item.state === "not_applicable";
            const markedDone = item.state === "complete";
            const hasNotes = Boolean(item.notes?.trim());
            return (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                  markedDone ? "border-red-200 bg-red-500/10" : "border-zinc-200"
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-md text-left hover:bg-amber-50"
                  aria-label={hasNotes ? `Notes for ${item.label}` : `Add notes for ${item.label}`}
                  onClick={() => {
                    setNoteTarget(item);
                    setNotePages(splitNotePages(item.notes ?? ""));
                    setNotePage(0);
                  }}
                >
                  <span className="flex items-center gap-2">
                    {hasNotes ? <NoteIcon /> : null}
                    <span className={`block ${done ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{item.label}</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {item.required ? "Required" : "Optional"}
                    {item.state === "not_applicable" ? " · Not needed" : item.state === "in_progress" ? " · In progress" : ""}
                  </span>
                </button>
                <span className="flex shrink-0 gap-2">
                  {!item.required && item.state !== "not_applicable" && item.state !== "complete" ? (
                    <button type="button" className="btn-outline text-xs" aria-label={`Skip ${item.label}`} onClick={() => onOnboarding(id, item.id, "not_applicable")}>
                      Skip
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn text-xs"
                    aria-label={item.state === "complete" ? `Undo ${item.label}` : `Mark ${item.label} done`}
                    onClick={() => onOnboarding(id, item.id, item.state === "complete" ? "not_requested" : "complete")}
                  >
                    {item.state === "complete" ? "Undo" : "Done"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {step === "delivery" ? (
        <div className="space-y-4">
          {DELIVERY_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{group.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.stages.map((value) => {
                  const selected = stage === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1.5 text-xs ${selected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700"}`}
                      onClick={() => onStage(id, value)}
                    >
                      {PROJECT_STAGE_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="btn-outline text-xs" onClick={() => onStage(id, "on_hold")}>Put on hold</button>
            <button type="button" className="btn-outline text-xs" onClick={() => onStage(id, "cancelled")}>Cancel project</button>
          </div>
        </div>
      ) : null}

      {step === "revisions" ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">{meter.label}. {meter.detail}. Filing a request does not use a round. Accepting an included round uses one.</p>
          {rounds.length === 0 ? (
            <p className="text-sm text-zinc-500">No revision requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {rounds.map((round) => (
                <li key={round.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <span>
                    <span className="block text-zinc-900">{round.title}</span>
                    <span className="text-[11px] text-zinc-500">{round.kind} · {round.state.replaceAll("_", " ")}</span>
                  </span>
                  {round.state === "submitted" || round.state === "clarification_needed" ? (
                    <button type="button" className="btn text-xs" onClick={() => onAcceptRevision(round.id)}>
                      Accept round
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
              if (!title) return;
              onRevision(id, title);
              event.currentTarget.reset();
            }}
          >
            <input name="title" required className="field" placeholder="What should be reviewed?" aria-label="Revision request" />
            <button className="btn shrink-0 text-xs" type="submit">File request</button>
          </form>
        </div>
      ) : null}

      {step === "client" ? (
        <form
          className="max-w-md space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            onInvite(id, email);
            event.currentTarget.reset();
          }}
        >
          <p className="text-sm text-zinc-600">Send a one-time link. The client sees this project only: stage, checklist, revisions, invoices, and files you mark for them.</p>
          <label className="block text-xs font-medium text-zinc-600">
            Client email
            <input name="email" type="email" required className="field mt-1" placeholder="name@company.com" />
          </label>
          <button className="btn text-xs" type="submit">Send portal invite</button>
        </form>
      ) : null}
      {noteTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
              onMouseDown={() => setNoteTarget(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-note-title"
                className="flex w-full max-w-2xl items-center gap-3"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-zinc-900 shadow-md disabled:opacity-40"
                  aria-label="Previous page"
                  disabled={notePage === 0}
                  onClick={showPreviousPage}
                >
                  ‹
                </button>
                <div
                  className="relative min-w-0 flex-1 overflow-hidden rounded-sm shadow-2xl"
                  style={{
                    backgroundColor: "#FFF4B8",
                    backgroundImage:
                      "linear-gradient(90deg, transparent 2.25rem, #f0b4b4 2.25rem, #f0b4b4 2.4rem, transparent 2.4rem), repeating-linear-gradient(to bottom, transparent 0, transparent 31px, #e6d48a 32px)",
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 z-0 h-8 w-8"
                    style={{ background: "linear-gradient(225deg, #eceef1 50%, #E2AD1E 50%)" }}
                  />
                  <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 pr-12">
                    <div className="flex min-w-0 items-center gap-2 pl-8">
                      <NoteIcon />
                      <h2 id="onboarding-note-title" className="truncate text-sm font-semibold text-zinc-900">
                        {noteTarget.label}
                      </h2>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-zinc-600">
                      {notePage + 1} / {notePages.length}
                    </span>
                    <button type="button" className="relative z-20 shrink-0 text-xs font-medium text-zinc-900" onClick={() => setNoteTarget(null)}>
                      Close
                    </button>
                  </div>
                  <textarea
                    ref={noteAreaRef}
                    autoFocus
                    value={pageText}
                    maxLength={4000}
                    onChange={(event) => writeNotePage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (event.shiftKey) {
                        insertPlainLine();
                        return;
                      }
                      insertBullet();
                    }}
                    aria-label={`Notes for ${noteTarget.label}, page ${notePage + 1}`}
                    placeholder="Write a note for this item"
                    className="min-h-72 w-full resize-y bg-transparent px-12 py-1 text-sm leading-8 text-zinc-900 outline-none placeholder:text-zinc-500"
                  />
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <button type="button" className="btn-outline text-xs" onClick={insertBullet}>
                      Enter
                    </button>
                    <button
                      type="button"
                      className="btn text-xs"
                      onClick={async () => {
                        const saved = await onNote(id, noteTarget.id, joinNotePages(notePages));
                        if (saved) setNoteTarget(null);
                      }}
                    >
                      Save notes
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-zinc-900 shadow-md"
                  aria-label={notePage < notePages.length - 1 ? "Next page" : "Add page"}
                  onClick={showNextPage}
                >
                  ›
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PaymentList({
  invoices,
  onIssue,
  onManual,
}: {
  invoices: Array<Record<string, unknown>>;
  onIssue: (invoiceId: string) => void;
  onManual: (body: Record<string, string>) => void;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No CRM invoices yet. Card payments stay unverified until a Stripe webhook secret is configured. This screen never marks an invoice paid from the browser return.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Card payments stay unverified until a Stripe webhook secret is configured. Recording a manual payment requires a method, date, reference, and note.
      </p>
    <ul className="space-y-3">
      {invoices.map((invoice) => (
        <li key={String(invoice.id)} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-medium">{String(invoice.document_number)} · {String(invoice.kind)} · {String(invoice.status)}</p>
          <p>{formatCents(Number(invoice.total_cents), String(invoice.currency))}</p>
          {invoice.status === "draft" ? (
            <button type="button" className="btn mt-2 text-xs" onClick={() => onIssue(String(invoice.id))}>Issue</button>
          ) : null}
          {invoice.status !== "draft" && invoice.status !== "void" && invoice.status !== "paid" ? (
            <form
              className="mt-3 grid gap-2 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onManual({
                  invoiceId: String(invoice.id),
                  amount: String(form.get("amount") ?? ""),
                  method: String(form.get("method") ?? ""),
                  receivedOn: String(form.get("receivedOn") ?? ""),
                  reference: String(form.get("reference") ?? ""),
                  note: String(form.get("note") ?? ""),
                });
              }}
            >
              <input name="amount" required className="field" placeholder="Amount" aria-label="Payment amount" />
              <input name="method" required className="field" placeholder="Method" aria-label="Payment method" />
              <input name="receivedOn" required type="date" className="field" aria-label="Payment date" />
              <input name="reference" required className="field" placeholder="Reference" aria-label="Payment reference" />
              <input name="note" required className="field md:col-span-2" placeholder="Verification note" aria-label="Verification note" />
              <button className="btn text-xs" type="submit">Record manual payment</button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
    </div>
  );
}

function TaskList({
  tasks,
  onComplete,
}: {
  tasks: Array<Record<string, unknown>>;
  onComplete: (id: string) => void;
}) {
  const open = tasks.filter((task) => !task.completed_at);
  if (open.length === 0) return <p className="text-sm text-zinc-500">No open tasks.</p>;
  return (
    <ul className="space-y-2">
      {open.map((task) => (
        <li key={String(task.id)} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-sm">
          <span>
            {String(task.body)}
            {task.due_on ? <span className="text-zinc-500"> · due {String(task.due_on)}</span> : null}
          </span>
          <button type="button" className="btn-outline text-xs" onClick={() => onComplete(String(task.id))}>
            Complete
          </button>
        </li>
      ))}
    </ul>
  );
}

function BudgetList({
  projects,
  onSave,
}: {
  projects: Array<Record<string, unknown>>;
  onSave: (projectId: string, category: string, amount: number) => void;
}) {
  if (projects.length === 0) return <p className="text-sm text-zinc-500">No projects to budget.</p>;
  return (
    <ul className="space-y-3">
      {projects.map((project) => {
        const budgets = (project.project_budgets as Array<{ amount_cents: number }>) ?? [];
        const costs = (project.project_costs as Array<{ amount_cents: number }>) ?? [];
        const time = (project.time_entries as Array<{ hours: number; rate_cents: number | null }>) ?? [];
        const budget = budgets.reduce((sum, row) => sum + row.amount_cents, 0);
        const labor = time.reduce(
          (sum, row) => sum + (row.rate_cents == null ? 0 : Math.round(row.hours * row.rate_cents)),
          0
        );
        const actual = costs.reduce((sum, row) => sum + row.amount_cents, 0) + labor;
        const meter = budgetMeter(budgets.length === 0 ? null : budget, actual);
        return (
          <li key={String(project.id)} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-medium">{String(project.name)}</p>
            <p className="text-zinc-600">{meter.label}{meter.overageCents > 0 ? ` · ${formatCents(meter.overageCents)} over` : ""}</p>
            <p className="text-xs text-zinc-500">Labor is included only when an internal rate is set. Processing fees and sales tax are excluded.</p>
            <div className="mt-2 h-2 rounded bg-zinc-200" aria-hidden>
              <div className="h-2 rounded bg-zinc-900" style={{ width: `${meter.barPercent}%` }} />
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onSave(String(project.id), String(form.get("category")), Number(form.get("amount")));
              }}
            >
              <select name="category" className="field" aria-label="Budget category">
                {["design", "development", "contractors", "software", "hosting", "other", "labor"].map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input name="amount" type="number" min="0" step="0.01" required className="field" aria-label="Budget amount" />
              <button className="btn text-xs" type="submit">Save budget</button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
