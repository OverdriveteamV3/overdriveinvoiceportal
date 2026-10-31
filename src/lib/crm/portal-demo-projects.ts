import { ONBOARDING_TEMPLATE, type ProjectStage } from "@/lib/crm/stages";
import { DEFAULT_REVISION_ALLOWANCE } from "@/lib/crm/revisions";

export const DEMO_PROJECT_NAME_PREFIX = "[Demo]";

export type PortalOnboardingItem = {
  label: string;
  required: boolean;
  state: string;
};

export type PortalInvoiceSummary = {
  id: string;
  documentNumber: string;
  kind: string;
  status: string;
  totalCents: number;
  currency: string;
};

export type PortalProjectCard = {
  id: string;
  name: string;
  stage: ProjectStage | string;
  nextAction: string;
  nextActionDue: string | null;
  revisionAllowance: number;
  roundsUsed: number;
  onboardingItems: PortalOnboardingItem[];
  demo: boolean;
  href: string | null;
  orderTotalCents: number;
  paidCents: number;
  balanceCents: number;
  currency: string;
  orderNumber: string | null;
  invoices: PortalInvoiceSummary[];
};

function paymentFields(input: {
  orderTotalCents: number;
  paidCents: number;
  currency?: string;
  orderNumber?: string | null;
  invoices?: PortalInvoiceSummary[];
}) {
  const orderTotalCents = Math.max(0, input.orderTotalCents);
  const paidCents = Math.max(0, input.paidCents);
  return {
    orderTotalCents,
    paidCents,
    balanceCents: Math.max(0, orderTotalCents - paidCents),
    currency: input.currency ?? "usd",
    orderNumber: input.orderNumber ?? null,
    invoices: input.invoices ?? [],
  };
}

function itemsFromStates(
  states: Partial<Record<(typeof ONBOARDING_TEMPLATE)[number]["key"], string>>
): PortalOnboardingItem[] {
  return ONBOARDING_TEMPLATE.map((item) => ({
    label: item.label,
    required: item.required,
    state: states[item.key as keyof typeof states] ?? "not_requested",
  }));
}

/** Static UI demos for layout/backtesting — not written to Supabase. */
export const UI_DEMO_PROJECTS: PortalProjectCard[] = [
  {
    id: "demo-ui-harbor",
    name: `${DEMO_PROJECT_NAME_PREFIX} Harbor Studio Website`,
    stage: "development",
    nextAction: "Approve homepage copy",
    nextActionDue: null,
    revisionAllowance: DEFAULT_REVISION_ALLOWANCE,
    roundsUsed: 1,
    onboardingItems: itemsFromStates({
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "requested",
      domain_access: "in_progress",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    }),
    demo: true,
    href: null,
    ...paymentFields({
      orderTotalCents: 450000,
      paidCents: 225000,
      orderNumber: "DEMO-HARBOR",
      invoices: [
        {
          id: "demo-inv-harbor-deposit",
          documentNumber: "INV-DEMO-01",
          kind: "deposit",
          status: "paid",
          totalCents: 225000,
          currency: "usd",
        },
        {
          id: "demo-inv-harbor-final",
          documentNumber: "INV-DEMO-02",
          kind: "final",
          status: "issued",
          totalCents: 225000,
          currency: "usd",
        },
      ],
    }),
  },
  {
    id: "demo-ui-northline",
    name: `${DEMO_PROJECT_NAME_PREFIX} Northline CRM`,
    stage: "client_review",
    nextAction: "Review dashboard prototype",
    nextActionDue: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    revisionAllowance: DEFAULT_REVISION_ALLOWANCE,
    roundsUsed: 2,
    onboardingItems: itemsFromStates({
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "complete",
      domain_access: "complete",
      integration_access: "requested",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    }),
    demo: true,
    href: null,
    ...paymentFields({
      orderTotalCents: 890000,
      paidCents: 445000,
      orderNumber: "DEMO-NORTH",
      invoices: [
        {
          id: "demo-inv-north-deposit",
          documentNumber: "INV-DEMO-11",
          kind: "deposit",
          status: "paid",
          totalCents: 445000,
          currency: "usd",
        },
        {
          id: "demo-inv-north-milestone",
          documentNumber: "INV-DEMO-12",
          kind: "milestone",
          status: "issued",
          totalCents: 222500,
          currency: "usd",
        },
        {
          id: "demo-inv-north-final",
          documentNumber: "INV-DEMO-13",
          kind: "final",
          status: "issued",
          totalCents: 222500,
          currency: "usd",
        },
      ],
    }),
  },
  {
    id: "demo-ui-orbit",
    name: `${DEMO_PROJECT_NAME_PREFIX} Orbit Brand Kit`,
    stage: "awaiting_onboarding",
    nextAction: "Upload logo files",
    nextActionDue: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    revisionAllowance: DEFAULT_REVISION_ALLOWANCE,
    roundsUsed: 0,
    onboardingItems: itemsFromStates({
      accepted_quote: "complete",
      signed_agreement: "requested",
      confirmed_deposit: "requested",
      primary_contact: "in_progress",
      goals: "requested",
      brand_assets: "requested",
      milestones: "not_requested",
      communication: "not_requested",
      kickoff: "not_requested",
    }),
    demo: true,
    href: null,
    ...paymentFields({
      orderTotalCents: 180000,
      paidCents: 0,
      orderNumber: "DEMO-ORBIT",
      invoices: [
        {
          id: "demo-inv-orbit-deposit",
          documentNumber: "INV-DEMO-21",
          kind: "deposit",
          status: "issued",
          totalCents: 90000,
          currency: "usd",
        },
      ],
    }),
  },
];

/** Completed engagements for history / backtesting. */
export const UI_HISTORY_PROJECTS: PortalProjectCard[] = [
  {
    id: "demo-hist-lumen",
    name: `${DEMO_PROJECT_NAME_PREFIX} Lumen Landing Page`,
    stage: "delivered",
    nextAction: "",
    nextActionDue: null,
    revisionAllowance: DEFAULT_REVISION_ALLOWANCE,
    roundsUsed: 2,
    onboardingItems: itemsFromStates({
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "complete",
      domain_access: "complete",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    }),
    demo: true,
    href: null,
    ...paymentFields({
      orderTotalCents: 320000,
      paidCents: 320000,
      orderNumber: "DEMO-LUMEN",
      invoices: [
        {
          id: "demo-inv-lumen-dep",
          documentNumber: "INV-H-01",
          kind: "deposit",
          status: "paid",
          totalCents: 160000,
          currency: "usd",
        },
        {
          id: "demo-inv-lumen-final",
          documentNumber: "INV-H-02",
          kind: "final",
          status: "paid",
          totalCents: 160000,
          currency: "usd",
        },
      ],
    }),
  },
  {
    id: "demo-hist-cascade",
    name: `${DEMO_PROJECT_NAME_PREFIX} Cascade Brand Refresh`,
    stage: "delivered",
    nextAction: "",
    nextActionDue: null,
    revisionAllowance: DEFAULT_REVISION_ALLOWANCE,
    roundsUsed: 3,
    onboardingItems: itemsFromStates({
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "complete",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    }),
    demo: true,
    href: null,
    ...paymentFields({
      orderTotalCents: 540000,
      paidCents: 540000,
      orderNumber: "DEMO-CASC",
      invoices: [
        {
          id: "demo-inv-casc-dep",
          documentNumber: "INV-H-11",
          kind: "deposit",
          status: "paid",
          totalCents: 270000,
          currency: "usd",
        },
        {
          id: "demo-inv-casc-final",
          documentNumber: "INV-H-12",
          kind: "final",
          status: "paid",
          totalCents: 270000,
          currency: "usd",
        },
      ],
    }),
  },
];

export const COMPLETED_STAGES = new Set(["delivered", "support", "cancelled"]);

export function isCompletedProject(project: PortalProjectCard): boolean {
  return COMPLETED_STAGES.has(String(project.stage));
}

export function isCurrentProject(project: PortalProjectCard): boolean {
  return !isCompletedProject(project) && project.stage !== "cancelled";
}

export type PortalBalanceEntry = {
  id: string;
  projectId: string;
  projectName: string;
  documentNumber: string;
  kind: string;
  status: string;
  amountCents: number;
  currency: string;
  direction: "charge" | "payment";
};

export function buildBalanceHistory(projects: PortalProjectCard[]): PortalBalanceEntry[] {
  const entries: PortalBalanceEntry[] = [];
  for (const project of projects) {
    const cleanName = project.name.replace(/^\[Demo\]\s*/i, "");
    for (const invoice of project.invoices) {
      entries.push({
        id: `${invoice.id}-charge`,
        projectId: project.id,
        projectName: cleanName,
        documentNumber: invoice.documentNumber,
        kind: invoice.kind,
        status: invoice.status,
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        direction: "charge",
      });
      if (invoice.status === "paid") {
        entries.push({
          id: `${invoice.id}-payment`,
          projectId: project.id,
          projectName: cleanName,
          documentNumber: invoice.documentNumber,
          kind: invoice.kind,
          status: "paid",
          amountCents: invoice.totalCents,
          currency: invoice.currency,
          direction: "payment",
        });
      }
    }
  }
  return entries;
}

export type PortalAlert = {
  id: string;
  tone: "info" | "warn" | "urgent";
  title: string;
  body: string;
  projectId?: string;
};

export function buildPortalAlerts(
  projects: PortalProjectCard[],
  es: boolean
): PortalAlert[] {
  const alerts: PortalAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const project of projects) {
    const remaining = Math.max(0, project.revisionAllowance - project.roundsUsed);
    const incomplete = project.onboardingItems.filter(
      (item) =>
        item.required &&
        item.state !== "complete" &&
        item.state !== "not_applicable" &&
        (item.state === "requested" || item.state === "in_progress")
    );

    if (remaining <= 1 && project.revisionAllowance > 0) {
      alerts.push({
        id: `${project.id}-revisions`,
        tone: remaining === 0 ? "urgent" : "warn",
        title: es
          ? remaining === 0
            ? "Actualizaciones incluidas agotadas"
            : "Queda 1 actualización incluida"
          : remaining === 0
            ? "Included updates used up"
            : "1 included update left",
        body: project.name,
        projectId: project.id,
      });
    }

    if (incomplete.length > 0) {
      alerts.push({
        id: `${project.id}-onboarding`,
        tone: "info",
        title: es
          ? `${incomplete.length} paso${incomplete.length === 1 ? "" : "s"} de inicio pendientes`
          : `${incomplete.length} onboarding step${incomplete.length === 1 ? "" : "s"} pending`,
        body: `${project.name} · ${incomplete[0]?.label ?? ""}`,
        projectId: project.id,
      });
    }

    if (project.stage === "client_review" || project.stage === "revisions") {
      alerts.push({
        id: `${project.id}-review`,
        tone: "warn",
        title:
          project.stage === "client_review"
            ? es
              ? "Listo para tu revisión"
              : "Ready for your review"
            : es
              ? "En revisiones"
              : "In revisions",
        body: project.name,
        projectId: project.id,
      });
    }

    if (project.nextActionDue && project.nextActionDue < today) {
      alerts.push({
        id: `${project.id}-overdue`,
        tone: "urgent",
        title: es ? "Acción vencida" : "Action overdue",
        body: `${project.name} · ${project.nextAction || (es ? "Sin detalle" : "No detail")}`,
        projectId: project.id,
      });
    }

    if (project.balanceCents > 0) {
      alerts.push({
        id: `${project.id}-balance`,
        tone: "warn",
        title: es ? "Saldo pendiente" : "Balance due",
        body: project.name,
        projectId: project.id,
      });
    }
  }

  return alerts;
}

export function nextClientSteps(
  projects: PortalProjectCard[],
  limit = 5
): Array<{ projectName: string; label: string; projectId: string }> {
  const steps: Array<{ projectName: string; label: string; projectId: string }> = [];
  for (const project of projects) {
    for (const item of project.onboardingItems) {
      if (
        item.required &&
        (item.state === "requested" || item.state === "in_progress")
      ) {
        steps.push({
          projectName: project.name,
          label: item.label,
          projectId: project.id,
        });
        if (steps.length >= limit) return steps;
      }
    }
  }
  return steps;
}

/** Specs used when seeding real CRM demo projects for a portal user. */
export const SEED_DEMO_SPECS = [
  {
    key: "harbor",
    title: `${DEMO_PROJECT_NAME_PREFIX} Harbor Studio Website`,
    stage: "development" as ProjectStage,
    nextAction: "Approve homepage copy",
    nextActionDue: null as string | null,
    roundsUsed: 1,
    itemStates: {
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "requested",
      domain_access: "in_progress",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    } as Record<string, string>,
  },
  {
    key: "northline",
    title: `${DEMO_PROJECT_NAME_PREFIX} Northline CRM`,
    stage: "client_review" as ProjectStage,
    nextAction: "Review dashboard prototype",
    nextActionDue: null as string | null,
    roundsUsed: 2,
    itemStates: {
      accepted_quote: "complete",
      signed_agreement: "complete",
      confirmed_deposit: "complete",
      primary_contact: "complete",
      goals: "complete",
      brand_assets: "complete",
      copy_images: "complete",
      domain_access: "complete",
      integration_access: "requested",
      milestones: "complete",
      communication: "complete",
      kickoff: "complete",
    } as Record<string, string>,
  },
  {
    key: "orbit",
    title: `${DEMO_PROJECT_NAME_PREFIX} Orbit Brand Kit`,
    stage: "awaiting_onboarding" as ProjectStage,
    nextAction: "Upload logo files",
    nextActionDue: null as string | null,
    roundsUsed: 0,
    itemStates: {
      accepted_quote: "complete",
      signed_agreement: "requested",
      confirmed_deposit: "requested",
      primary_contact: "in_progress",
      goals: "requested",
      brand_assets: "requested",
    } as Record<string, string>,
  },
] as const;
