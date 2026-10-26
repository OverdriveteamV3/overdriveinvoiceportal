import { getSupabaseAdmin } from "@/lib/storage/supabaseDatabaseStore";
import type { DraftState } from "@/lib/drafts";
import { calculateDraftTotals } from "@/lib/drafts";
import { dollarsToCents, USD, sumUsd } from "@/lib/crm/money";
import { isOpenPipelineStage, isSalesStage, type SalesStage } from "@/lib/crm/stages";

export function crmClient() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export function isCrmEnabled(): boolean {
  const flag = process.env.CRM_ENABLED?.trim().toLowerCase();
  return flag !== "0" && flag !== "false";
}

function snapshotFromDraft(state: DraftState) {
  const totals = calculateDraftTotals(state);
  return {
    snapshot: {
      docType: state.docType,
      taxRate: state.taxRate,
      client: state.client,
      notes: state.notes,
      services: state.services.map((item) => ({
        service: item.service,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: dollarsToCents(item.unitPrice),
      })),
      labor: {
        title: state.laborTitle,
        hours: state.laborHours,
        rateCents: dollarsToCents(state.laborRate),
      },
    },
    totalCents: dollarsToCents(totals.grandTotal),
    taxCents: dollarsToCents(totals.taxAmount),
  };
}

export async function listOpportunities(profileId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, clients(display_name, company_name, email)")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createOpportunity(input: {
  profileId: string;
  actor: string;
  displayName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  title: string;
  serviceInterest?: string;
  description?: string;
  source: string;
  landingPage?: string;
  campaign?: string;
  preferredContact?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  estimatedValueCents?: number;
  nextAction?: string;
  followUpOn?: string | null;
}) {
  const supabase = crmClient();
  const email = (input.email ?? "").trim().toLowerCase();
  let possibleDuplicate: string | null = null;
  if (email) {
    const { data: matches } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", input.profileId)
      .ilike("email", email)
      .limit(1);
    possibleDuplicate = matches?.[0]?.id ?? null;
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      profile_id: input.profileId,
      display_name: input.displayName.trim(),
      company_name: input.companyName?.trim() ?? "",
      email,
      phone: input.phone?.trim() ?? "",
      website: input.website?.trim() ?? "",
      possible_duplicate_of: possibleDuplicate,
    })
    .select("id")
    .single();
  if (clientError || !client) throw new Error(clientError?.message ?? "Client was not created.");

  if (email) {
    await supabase.from("client_contacts").insert({
      client_id: client.id,
      name: input.displayName.trim(),
      email,
      phone: input.phone?.trim() ?? "",
      is_primary: true,
    });
  }

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      client_id: client.id,
      profile_id: input.profileId,
      title: input.title.trim(),
      service_interest: input.serviceInterest?.trim() ?? "",
      description: input.description?.trim() ?? "",
      source: input.source,
      landing_page: input.landingPage?.trim() ?? "",
      campaign: input.campaign?.trim() ?? "",
      preferred_contact: input.preferredContact?.trim() ?? "",
      budget_range: input.budgetRange?.trim() ?? "",
      desired_timeline: input.desiredTimeline?.trim() ?? "",
      owner_profile_id: input.profileId,
      next_action: input.nextAction?.trim() || "Qualify the lead",
      follow_up_on: input.followUpOn ?? null,
      estimated_value_cents: input.estimatedValueCents ?? 0,
      currency: USD,
    })
    .select("id")
    .single();
  if (error || !opportunity) throw new Error(error?.message ?? "Opportunity was not created.");

  await supabase.from("opportunity_stage_events").insert({
    opportunity_id: opportunity.id,
    actor: input.actor,
    from_stage: null,
    to_stage: "new_lead",
    reason: "Created",
  });
  await supabase.from("activities").insert({
    opportunity_id: opportunity.id,
    profile_id: input.profileId,
    kind: "task",
    body: input.nextAction?.trim() || "Qualify the lead",
    due_on: input.followUpOn ?? null,
    assignee_profile_id: input.profileId,
  });
  await supabase.from("audit_events").insert({
    actor: input.actor,
    action: "opportunity_created",
    entity_type: "opportunity",
    entity_id: opportunity.id,
    summary: { source: input.source, possibleDuplicate },
  });

  return { opportunityId: opportunity.id as string, clientId: client.id as string, possibleDuplicate };
}

export async function setOpportunityStage(input: {
  opportunityId: string;
  profileId: string;
  stage: SalesStage;
  actor: string;
  reason?: string;
}) {
  const supabase = crmClient();
  const { data: row, error } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", input.opportunityId)
    .eq("profile_id", input.profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Opportunity not found.");
  const { error: rpcError } = await supabase.rpc("crm_set_stage", {
    p_opportunity_id: input.opportunityId,
    p_stage: input.stage,
    p_actor: input.actor,
    p_reason: input.reason ?? "",
  });
  if (rpcError) throw new Error(rpcError.message);
}

export async function archiveOpportunity(input: {
  opportunityId: string;
  profileId: string;
  actor: string;
  reason: string;
  reopen?: boolean;
}) {
  const supabase = crmClient();
  const { error } = await supabase
    .from("opportunities")
    .update(
      input.reopen
        ? { archived_at: null, archive_reason: "" }
        : { archived_at: new Date().toISOString(), archive_reason: input.reason }
    )
    .eq("id", input.opportunityId)
    .eq("profile_id", input.profileId);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({
    actor: input.actor,
    action: input.reopen ? "opportunity_reopened" : "opportunity_archived",
    entity_type: "opportunity",
    entity_id: input.opportunityId,
    summary: { reason: input.reason },
  });
}

export async function addTask(input: {
  profileId: string;
  opportunityId?: string;
  projectId?: string;
  body: string;
  dueOn?: string | null;
  assignee?: string;
}) {
  const supabase = crmClient();
  const { error } = await supabase.from("activities").insert({
    profile_id: input.profileId,
    opportunity_id: input.opportunityId ?? null,
    project_id: input.projectId ?? null,
    kind: "task",
    body: input.body,
    due_on: input.dueOn ?? null,
    assignee_profile_id: input.assignee ?? input.profileId,
  });
  if (error) throw new Error(error.message);
}

export async function listTasks(profileId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("profile_id", profileId)
    .eq("kind", "task")
    .order("due_on", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function completeTask(id: string, profileId: string) {
  const supabase = crmClient();
  const { error } = await supabase
    .from("activities")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);
}

export async function listQuoteVersions(profileId: string, opportunityId: string) {
  const supabase = crmClient();
  const { data: opp } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", opportunityId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!opp) return [];
  const { data, error } = await supabase
    .from("quote_versions")
    .select("id, version_number, total_cents, currency")
    .eq("opportunity_id", opportunityId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createQuoteVersion(input: {
  profileId: string;
  opportunityId: string;
  state: DraftState;
  legacyRecordId?: string;
  depositType?: "percent" | "fixed" | "milestone" | "none";
  depositPercent?: number;
  depositCents?: number;
  revisionAllowance?: number;
  expiresOn?: string | null;
  scopeSummary?: string;
  exclusions?: string;
  scheduleNotes?: string;
  terms?: string;
}) {
  const supabase = crmClient();
  const { data: opp, error: oppError } = await supabase
    .from("opportunities")
    .select("id")
    .eq("id", input.opportunityId)
    .eq("profile_id", input.profileId)
    .maybeSingle();
  if (oppError) throw new Error(oppError.message);
  if (!opp) throw new Error("Opportunity not found.");

  const { data: latest } = await supabase
    .from("quote_versions")
    .select("version_number")
    .eq("opportunity_id", input.opportunityId)
    .order("version_number", { ascending: false })
    .limit(1);
  const versionNumber = (latest?.[0]?.version_number ?? 0) + 1;
  const priced = snapshotFromDraft(input.state);
  const { data, error } = await supabase
    .from("quote_versions")
    .insert({
      opportunity_id: input.opportunityId,
      version_number: versionNumber,
      snapshot: priced.snapshot,
      total_cents: priced.totalCents,
      tax_cents: priced.taxCents,
      currency: USD,
      deposit_type: input.depositType ?? "percent",
      deposit_percent: input.depositPercent ?? 50,
      deposit_cents: input.depositCents ?? 0,
      revision_allowance: input.revisionAllowance ?? 3,
      expires_on: input.expiresOn ?? null,
      scope_summary: input.scopeSummary ?? input.state.notes ?? "",
      exclusions: input.exclusions ?? "",
      schedule_notes: input.scheduleNotes ?? "",
      terms: input.terms ?? "",
      legacy_record_id: input.legacyRecordId ?? null,
    })
    .select("id, version_number")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Quote version was not saved.");
  return data;
}

export async function acceptQuoteVersion(input: {
  profileId: string;
  quoteVersionId: string;
  actor: string;
  ip: string;
  userAgent: string;
}) {
  const supabase = crmClient();
  const { data: version, error } = await supabase
    .from("quote_versions")
    .select("id, opportunity_id, opportunities(profile_id)")
    .eq("id", input.quoteVersionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const owner = (version as { opportunities?: { profile_id?: string } } | null)?.opportunities
    ?.profile_id;
  if (!version || owner !== input.profileId) throw new Error("Quote version not found.");

  const { data, error: rpcError } = await supabase.rpc("crm_accept_quote", {
    p_quote_version_id: input.quoteVersionId,
    p_actor: input.actor,
    p_ip: input.ip,
    p_user_agent: input.userAgent,
  });
  if (rpcError) throw new Error(rpcError.message);
  const orderId = (data as { orderId?: string } | null)?.orderId;
  if (!orderId) throw new Error("Order was not created.");
  await supabase.rpc("crm_prepare_billing", { p_order_id: orderId });
  await supabase.rpc("crm_open_project", { p_order_id: orderId });
  return data as { orderId: string; created: boolean };
}

export async function listOrders(profileId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, agreements(id, status, accepted_at), opportunities(title), invoices(id, kind, status, total_cents, currency, document_number, due_on)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function acceptAgreement(input: {
  profileId: string;
  agreementId: string;
  actor: string;
}) {
  const supabase = crmClient();
  const { data: agreement, error } = await supabase
    .from("agreements")
    .select("id, order_id, orders(profile_id)")
    .eq("id", input.agreementId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const owner = (agreement as { orders?: { profile_id?: string } } | null)?.orders?.profile_id;
  if (!agreement || owner !== input.profileId) throw new Error("Agreement not found.");
  const { error: updateError } = await supabase
    .from("agreements")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: input.actor,
    })
    .eq("id", input.agreementId);
  if (updateError) throw new Error(updateError.message);
  const { data: order } = await supabase
    .from("orders")
    .select("deposit_required_cents")
    .eq("id", agreement.order_id)
    .maybeSingle();
  await supabase
    .from("orders")
    .update({
      status: Number(order?.deposit_required_cents ?? 0) > 0 ? "pending_deposit" : "active",
    })
    .eq("id", agreement.order_id);
  await supabase
    .from("onboarding_items")
    .update({ state: "complete", completed_at: new Date().toISOString() })
    .eq("item_key", "signed_agreement")
    .eq(
      "project_id",
      (
        await supabase
          .from("projects")
          .select("id")
          .eq("order_id", agreement.order_id)
          .maybeSingle()
      ).data?.id ?? "00000000-0000-0000-0000-000000000000"
    );
}

export async function issueInvoice(invoiceId: string, profileId: string) {
  const supabase = crmClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "issued" })
    .eq("id", invoiceId)
    .eq("profile_id", profileId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
}

export async function listInvoices(profileId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listProjects(profileId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, onboarding_items(id, item_key, label, required, state, due_on, notes), revision_rounds(id, title, state, kind), clients(display_name, company_name, email, phone, website)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateOnboardingItem(input: {
  profileId: string;
  itemId: string;
  state: string;
}) {
  const supabase = crmClient();
  const { data: item, error } = await supabase
    .from("onboarding_items")
    .select("id, project_id, projects(profile_id)")
    .eq("id", input.itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const owner = (item as { projects?: { profile_id?: string } } | null)?.projects?.profile_id;
  if (!item || owner !== input.profileId) throw new Error("Checklist item not found.");
  const { error: updateError } = await supabase
    .from("onboarding_items")
    .update({
      state: input.state,
      completed_at: input.state === "complete" ? new Date().toISOString() : null,
    })
    .eq("id", input.itemId);
  if (updateError) throw new Error(updateError.message);
}

export async function updateOnboardingNotes(input: {
  profileId: string;
  itemId: string;
  notes: string;
}) {
  const supabase = crmClient();
  const { data: item, error } = await supabase
    .from("onboarding_items")
    .select("id, projects(profile_id)")
    .eq("id", input.itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const owner = (item as { projects?: { profile_id?: string } } | null)?.projects?.profile_id;
  if (!item || owner !== input.profileId) throw new Error("Checklist item not found.");
  const notes = input.notes.trim().slice(0, 4000);
  const { error: updateError } = await supabase.from("onboarding_items").update({ notes }).eq("id", input.itemId);
  if (updateError) throw new Error(updateError.message);
}

export async function updateProject(input: {
  profileId: string;
  projectId: string;
  stage?: string;
  blocker?: string;
  nextAction?: string;
  kickoffOverrideReason?: string;
}) {
  const supabase = crmClient();
  const patch: Record<string, string> = {};
  if (input.stage) patch.stage = input.stage;
  if (input.blocker != null) patch.blocker = input.blocker;
  if (input.nextAction != null) patch.next_action = input.nextAction;
  if (input.kickoffOverrideReason) patch.kickoff_override_reason = input.kickoffOverrideReason;
  const { error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", input.projectId)
    .eq("profile_id", input.profileId);
  if (error) throw new Error(error.message);
  if (input.kickoffOverrideReason) {
    await supabase.from("audit_events").insert({
      actor: input.profileId,
      action: "kickoff_override",
      entity_type: "project",
      entity_id: input.projectId,
      summary: { reason: input.kickoffOverrideReason },
    });
  }
}

export async function saveBudget(input: {
  profileId: string;
  projectId: string;
  category: string;
  amountCents: number;
}) {
  const supabase = crmClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", input.projectId)
    .eq("profile_id", input.profileId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");
  const { error } = await supabase.from("project_budgets").upsert(
    {
      project_id: input.projectId,
      category: input.category,
      amount_cents: input.amountCents,
    },
    { onConflict: "project_id,category" }
  );
  if (error) throw new Error(error.message);
}

export async function addCost(input: {
  profileId: string;
  projectId: string;
  category: string;
  amountCents: number;
  note?: string;
}) {
  const supabase = crmClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", input.projectId)
    .eq("profile_id", input.profileId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");
  const { error } = await supabase.from("project_costs").insert({
    project_id: input.projectId,
    category: input.category,
    amount_cents: input.amountCents,
    note: input.note ?? "",
  });
  if (error) throw new Error(error.message);
}

export async function listBudgetRows(profileId: string) {
  const supabase = crmClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, project_budgets(category, amount_cents), project_costs(category, amount_cents), time_entries(hours, rate_cents)")
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);
  return projects ?? [];
}

export async function overview(profileId: string) {
  const supabase = crmClient();
  const [opps, invoices, payments, refunds, projects, tasks] = await Promise.all([
    supabase.from("opportunities").select("stage, estimated_value_cents, currency, archived_at, no_deposit_exception").eq("profile_id", profileId),
    supabase.from("invoices").select("id, kind, status, total_cents, currency, due_on, order_id").eq("profile_id", profileId),
    supabase.from("payments").select("id, amount_cents, currency, status, created_at").eq("profile_id", profileId),
    supabase.from("refunds").select("amount_cents, payment_id"),
    supabase.from("projects").select("id, stage, rounds_used, revision_allowance").eq("profile_id", profileId),
    supabase.from("activities").select("id").eq("profile_id", profileId).eq("kind", "task").is("completed_at", null),
  ]);
  if (opps.error) throw new Error(opps.error.message);
  if (invoices.error) throw new Error(invoices.error.message);

  const openPipeline = sumUsd(
    (opps.data ?? [])
      .filter((row) => !row.archived_at && isSalesStage(row.stage) && isOpenPipelineStage(row.stage))
      .map((row) => ({ cents: row.estimated_value_cents, currency: row.currency }))
  );
  const invoiceRows = invoices.data ?? [];
  const invoiced = sumUsd(
    invoiceRows
      .filter((row) => row.status !== "void" && row.status !== "draft")
      .map((row) => ({ cents: row.total_cents, currency: row.currency }))
  );
  const collected = sumUsd(
    (payments.data ?? [])
      .filter((row) => row.status === "succeeded")
      .map((row) => ({ cents: row.amount_cents, currency: row.currency }))
  );
  const paymentIds = new Set((payments.data ?? []).map((row) => row.id));
  const refunded = (refunds.data ?? [])
    .filter((row) => paymentIds.has(row.payment_id))
    .reduce((sum, row) => sum + row.amount_cents, 0);
  const overdueRows = invoiceRows.filter((row) => row.status === "overdue");
  const { data: overdueAllocations } = overdueRows.length
    ? await supabase
        .from("payment_allocations")
        .select("invoice_id, amount_cents")
        .in(
          "invoice_id",
          overdueRows.map((row) => row.id)
        )
    : { data: [] as Array<{ invoice_id: string; amount_cents: number }> };
  const allocatedByInvoice = new Map<string, number>();
  for (const row of overdueAllocations ?? []) {
    allocatedByInvoice.set(row.invoice_id, (allocatedByInvoice.get(row.invoice_id) ?? 0) + row.amount_cents);
  }
  const overdue = sumUsd(
    overdueRows.map((row) => ({
      cents: Math.max(0, row.total_cents - (allocatedByInvoice.get(row.id) ?? 0)),
      currency: row.currency,
    }))
  );

  return {
    openPipelineCents: openPipeline,
    invoicedCents: invoiced,
    netCollectedCents: Math.max(0, collected - refunded),
    overdueCents: overdue,
    openTasks: tasks.data?.length ?? 0,
    projects: projects.data?.length ?? 0,
    projectsOverRevision: (projects.data ?? []).filter(
      (row) => row.rounds_used >= row.revision_allowance
    ).length,
  };
}

export async function syncPaidDeposit(invoiceId: string) {
  const supabase = crmClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("kind, status, order_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice || invoice.kind !== "deposit" || invoice.status !== "paid" || !invoice.order_id) {
    return;
  }
  await supabase
    .from("orders")
    .update({ status: "active" })
    .eq("id", invoice.order_id)
    .eq("status", "pending_deposit");
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("order_id", invoice.order_id)
    .maybeSingle();
  if (!project) return;
  await supabase
    .from("onboarding_items")
    .update({ state: "complete", completed_at: new Date().toISOString() })
    .eq("project_id", project.id)
    .eq("item_key", "confirmed_deposit")
    .neq("state", "complete");
}

export async function claimNotification(kind: string, entityKey: string): Promise<boolean> {
  const supabase = crmClient();
  const { error } = await supabase.from("notification_sends").insert({
    kind,
    entity_key: entityKey,
  });
  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);
  return true;
}
