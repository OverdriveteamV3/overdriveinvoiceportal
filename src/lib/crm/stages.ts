export const SALES_STAGES = [
  "new_lead",
  "qualification",
  "discovery",
  "quote_preparation",
  "quote_sent",
  "negotiation",
  "accepted_pending",
  "closed_won",
  "closed_lost",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  new_lead: "New lead",
  qualification: "Qualification",
  discovery: "Discovery",
  quote_preparation: "Quote preparation",
  quote_sent: "Quote sent",
  negotiation: "Negotiation",
  accepted_pending: "Accepted — paperwork / deposit pending",
  closed_won: "Closed won",
  closed_lost: "Closed lost",
};

const OPEN_PIPELINE = new Set<SalesStage>([
  "new_lead",
  "qualification",
  "discovery",
  "quote_preparation",
  "quote_sent",
  "negotiation",
]);

export function isSalesStage(value: string): value is SalesStage {
  return (SALES_STAGES as readonly string[]).includes(value);
}

export function isOpenPipelineStage(stage: SalesStage): boolean {
  return OPEN_PIPELINE.has(stage);
}

export function canCloseWon(input: {
  hasAcceptance: boolean;
  agreementAccepted: boolean;
  depositSatisfied: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.hasAcceptance) {
    return { ok: false, reason: "An accepted quote is required." };
  }
  if (!input.agreementAccepted) {
    return { ok: false, reason: "The agreement must be accepted first." };
  }
  if (!input.depositSatisfied) {
    return {
      ok: false,
      reason: "The required deposit must be confirmed, or a no-deposit exception recorded.",
    };
  }
  return { ok: true };
}

export const PROJECT_STAGES = [
  "awaiting_onboarding",
  "ready_for_kickoff",
  "scheduled",
  "design",
  "development",
  "internal_qa",
  "client_review",
  "revisions",
  "awaiting_final_payment",
  "ready_to_launch",
  "delivered",
  "support",
  "on_hold",
  "cancelled",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  awaiting_onboarding: "Awaiting onboarding",
  ready_for_kickoff: "Ready for kickoff",
  scheduled: "Scheduled",
  design: "Design",
  development: "Development",
  internal_qa: "Internal QA",
  client_review: "Client review",
  revisions: "Revisions",
  awaiting_final_payment: "Awaiting final payment",
  ready_to_launch: "Ready to launch",
  delivered: "Delivered",
  support: "Support / maintenance",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(value);
}

export const ONBOARDING_TEMPLATE: Array<{
  key: string;
  label: string;
  required: boolean;
}> = [
  { key: "accepted_quote", label: "Accepted quote", required: true },
  { key: "signed_agreement", label: "Signed agreement", required: true },
  { key: "confirmed_deposit", label: "Confirmed required deposit", required: true },
  { key: "primary_contact", label: "Primary client contact", required: true },
  { key: "goals", label: "Goals and success criteria", required: true },
  { key: "brand_assets", label: "Logo and brand assets", required: false },
  { key: "copy_images", label: "Website copy and images", required: false },
  { key: "domain_access", label: "Domain and hosting access", required: false },
  { key: "integration_access", label: "Integration access", required: false },
  { key: "milestones", label: "Delivery milestones", required: true },
  { key: "communication", label: "Communication expectations", required: true },
  { key: "kickoff", label: "Kickoff appointment", required: true },
];

export function onboardingPercent(
  items: Array<{ required: boolean; state: string }>
): { complete: number; total: number; percent: number } {
  const required = items.filter(
    (item) => item.required && item.state !== "not_applicable"
  );
  const complete = required.filter((item) => item.state === "complete").length;
  const total = required.length;
  return {
    complete,
    total,
    percent: total === 0 ? 100 : Math.round((complete / total) * 100),
  };
}
