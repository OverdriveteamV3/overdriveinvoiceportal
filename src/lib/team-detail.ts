import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import { crmClient, isCrmEnabled } from "@/lib/crm/db";
import { formatCents } from "@/lib/crm/money";
import type { TeamRole } from "@/lib/team-roles";

export type TeamActivity = {
  id: string;
  label: string;
  when: string;
};

export type TeamDetail = {
  jobsProcessed: number;
  openJobs: number;
  moneyGeneratedCents: number;
  payoutsCents: number;
  activity: TeamActivity[];
  suggestions: string[];
};

const EMPTY: TeamDetail = {
  jobsProcessed: 0,
  openJobs: 0,
  moneyGeneratedCents: 0,
  payoutsCents: 0,
  activity: [],
  suggestions: [],
};

type OwnedJob = {
  id: string;
  title: string;
  stage: string;
  updated_at: string;
  follow_up_on: string | null;
  archived_at: string | null;
};

export async function getTeamDetail(ownerId: string, role: TeamRole): Promise<TeamDetail> {
  if (!isCrmEnabled()) {
    return { ...EMPTY, suggestions: suggestionsFor(role, EMPTY, 0) };
  }

  try {
    const supabase = crmClient();
    const { data, error } = await supabase
      .from("opportunities")
      .select("id, title, stage, updated_at, follow_up_on, archived_at")
      .eq("profile_id", MASTER_PROFILE_ID)
      .eq("owner_profile_id", ownerId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const jobs = (data ?? []) as OwnedJob[];
    const active = jobs.filter((job) => !job.archived_at);
    const processed = active.filter((job) => job.stage === "closed_won");
    const open = active.filter((job) => job.stage !== "closed_won" && job.stage !== "closed_lost");
    const today = new Date().toISOString().slice(0, 10);
    const followUpsDue = open.filter((job) => job.follow_up_on && job.follow_up_on <= today).length;

    const moneyGeneratedCents = await collectedForJobs(
      processed.map((job) => job.id)
    );

    const { data: notes } = await supabase
      .from("activities")
      .select("id, kind, body, created_at")
      .eq("profile_id", MASTER_PROFILE_ID)
      .eq("assignee_profile_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(6);

    const activity: TeamActivity[] = [
      ...active.slice(0, 6).map((job) => ({
        id: job.id,
        label: job.title || "Untitled job",
        when: job.updated_at,
      })),
      ...((notes ?? []) as Array<{ id: string; kind: string; body: string; created_at: string }>).map(
        (note) => ({
          id: note.id,
          label: note.body.trim() || note.kind,
          when: note.created_at,
        })
      ),
    ]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 6);

    const detail: TeamDetail = {
      jobsProcessed: processed.length,
      openJobs: open.length,
      moneyGeneratedCents,
      payoutsCents: 0,
      activity,
      suggestions: [],
    };
    detail.suggestions = suggestionsFor(role, detail, followUpsDue);
    return detail;
  } catch {
    return { ...EMPTY, suggestions: suggestionsFor(role, EMPTY, 0) };
  }
}

async function collectedForJobs(opportunityIds: string[]): Promise<number> {
  if (opportunityIds.length === 0) return 0;
  const supabase = crmClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .in("opportunity_id", opportunityIds);
  const orderIds = (orders ?? []).map((row) => row.id as string);
  if (orderIds.length === 0) return 0;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .in("order_id", orderIds)
    .neq("status", "void");
  const invoiceIds = (invoices ?? []).map((row) => row.id as string);
  if (invoiceIds.length === 0) return 0;

  const { data: allocations } = await supabase
    .from("payment_allocations")
    .select("payment_id, amount_cents")
    .in("invoice_id", invoiceIds);
  const rows = (allocations ?? []) as Array<{ payment_id: string; amount_cents: number }>;
  if (rows.length === 0) return 0;

  const { data: payments } = await supabase
    .from("payments")
    .select("id, status")
    .in("id", rows.map((row) => row.payment_id));
  const paid = new Set(
    ((payments ?? []) as Array<{ id: string; status: string }>)
      .filter((row) => row.status === "succeeded")
      .map((row) => row.id)
  );
  return rows
    .filter((row) => paid.has(row.payment_id))
    .reduce((sum, row) => sum + row.amount_cents, 0);
}

function suggestionsFor(role: TeamRole, detail: TeamDetail, followUpsDue: number): string[] {
  const notes: string[] = [];
  if (role === "tech") {
    notes.push("Tech seats are for APIs, settings, and system updates. Client jobs and payouts stay with an agent.");
  }
  if (detail.openJobs > 0) {
    notes.push(
      `${detail.openJobs} open ${detail.openJobs === 1 ? "job is" : "jobs are"} still owned here. The latest update in the activity list is the one to check first.`
    );
  }
  if (followUpsDue > 0) {
    notes.push(
      `${followUpsDue} follow-${followUpsDue === 1 ? "up is" : "ups are"} due. Clear those before taking another job.`
    );
  }
  if (detail.jobsProcessed > 0 && detail.payoutsCents === 0) {
    notes.push(
      `Record a payout when this person is paid. ${formatCents(detail.moneyGeneratedCents)} collected on their finished jobs is still all platform revenue.`
    );
  }
  if (role === "agent" && detail.jobsProcessed === 0 && detail.openJobs === 0) {
    notes.push("Give this agent a quote or order to own. Work with no owner stays on the master admin.");
  }
  if (detail.activity.length === 0) {
    notes.push("Nothing is logged for this seat yet. A note, call, or job update is what makes recent activity useful.");
  }
  if (role === "admin" && detail.openJobs > 3) {
    notes.push("This admin owns a lot of open work. Move jobs to an agent so the admin is not the only person executing them.");
  }
  notes.push("Add a phone number on this seat so someone can reach them when a client is waiting.");
  return notes.slice(0, 4);
}
