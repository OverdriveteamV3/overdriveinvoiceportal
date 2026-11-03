import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import PortalDashboard from "@/components/portal/PortalDashboard";
import { getPortalAccount } from "@/lib/crm/portal-account";
import { crmClient, listClientQuoteOffers } from "@/lib/crm/db";
import {
  DEMO_PROJECT_NAME_PREFIX,
  type PortalInvoiceSummary,
  type PortalProjectCard,
} from "@/lib/crm/portal-demo-projects";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: locale === "es" ? "Panel de cliente | Over Drive" : "Client dashboard | Over Drive",
  };
}

type ProjectRow = {
  id: string;
  name?: string;
  created_at?: string;
  stage?: string;
  next_action?: string | null;
  next_action_due?: string | null;
  revision_allowance?: number | null;
  rounds_used?: number | null;
  order_id?: string | null;
  onboarding_items?: Array<{ label?: string; required?: boolean; state?: string }> | null;
  orders?:
    | {
        id?: string;
        document_number?: string;
        total_cents?: number;
        currency?: string;
        invoices?: Array<{
          id?: string;
          document_number?: string;
          kind?: string;
          status?: string;
          total_cents?: number;
          currency?: string;
        }> | null;
      }
    | Array<{
        id?: string;
        document_number?: string;
        total_cents?: number;
        currency?: string;
        invoices?: Array<{
          id?: string;
          document_number?: string;
          kind?: string;
          status?: string;
          total_cents?: number;
          currency?: string;
        }> | null;
      }>
    | null;
};

function mapProject(row: ProjectRow): PortalProjectCard {
  const name = row.name ?? "Project";
  const orderRaw = row.orders;
  const order = Array.isArray(orderRaw) ? orderRaw[0] : orderRaw;
  const invoicesRaw = order?.invoices ?? [];
  const invoices: PortalInvoiceSummary[] = invoicesRaw
    .filter((invoice) => invoice?.id && invoice.status !== "draft")
    .map((invoice) => ({
      id: String(invoice.id),
      documentNumber: String(invoice.document_number ?? ""),
      kind: String(invoice.kind ?? ""),
      status: String(invoice.status ?? ""),
      totalCents: Number(invoice.total_cents ?? 0),
      currency: String(invoice.currency ?? "usd"),
    }));
  const orderTotalCents = Number(order?.total_cents ?? 0);
  const paidCents = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.totalCents, 0);

  return {
    id: row.id,
    name,
    createdAt: row.created_at ?? "",
    stage: row.stage ?? "awaiting_onboarding",
    nextAction: row.next_action ?? "",
    nextActionDue: row.next_action_due ?? null,
    revisionAllowance: row.revision_allowance ?? 3,
    roundsUsed: row.rounds_used ?? 0,
    onboardingItems: (row.onboarding_items ?? []).map((item) => ({
      label: item.label ?? "",
      required: Boolean(item.required),
      state: item.state ?? "not_requested",
    })),
    demo: name.startsWith(DEMO_PROJECT_NAME_PREFIX),
    href: `/portal/projects/${row.id}`,
    orderTotalCents,
    paidCents,
    balanceCents: Math.max(0, orderTotalCents - paidCents),
    currency: String(order?.currency ?? "usd"),
    orderNumber: order?.document_number ? String(order.document_number) : null,
    invoices,
  };
}

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [account, locale] = await Promise.all([getPortalAccount(), getLocale()]);
  const es = locale === "es";

  if (!account) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <LanguageToggle locale={locale} />
          <Link
            href="/"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {es ? "Volver al inicio" : "Back to Home"}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {es ? "Panel de cliente" : "Client dashboard"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {error
            ? es
              ? "Ese enlace de invitación no es válido o ya se usó. Pide uno nuevo a Over Drive."
              : "That invite link is invalid or already used. Ask Over Drive for a new one."
            : es
              ? "Entra para ver el progreso de tus proyectos y las actualizaciones."
              : "Sign in to see project progress and updates."}
        </p>
        <p className="mt-4">
          <Link href="/sign-in?next=/portal" className="text-sm font-medium text-zinc-900 underline">
            {es ? "Entrar" : "Sign in"}
          </Link>
        </p>
      </main>
    );
  }

  const supabase = crmClient();
  const [{ data: memberships }, quoteOffers] = await Promise.all([
    supabase
      .from("portal_memberships")
      .select(
        "project_id, projects(id, name, created_at, stage, next_action, next_action_due, revision_allowance, rounds_used, order_id, onboarding_items(label, required, state), orders(id, document_number, total_cents, currency, invoices(id, document_number, kind, status, total_cents, currency)))"
      )
      .eq("portal_user_id", account.id),
    listClientQuoteOffers(account.email).catch(() => []),
  ]);

  const liveProjects = (memberships ?? []).flatMap((row) => {
    const linked = (row as { projects?: unknown }).projects;
    const value = Array.isArray(linked) ? linked[0] : linked;
    if (!value || typeof value !== "object" || !("id" in value)) return [];
    return [mapProject(value as ProjectRow)];
  });

  const hasSeededDemos = liveProjects.some((project) => project.demo);

  return (
    <PortalDashboard
      locale={locale}
      account={{
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl,
      }}
      liveProjects={liveProjects}
      hasSeededDemos={hasSeededDemos}
      quoteOffers={quoteOffers}
    />
  );
}
