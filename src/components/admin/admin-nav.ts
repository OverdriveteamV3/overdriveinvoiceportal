import { DATA_BINS, isDataBinId, type DataBinId } from "@/lib/storage/dataBins";

export const CRM_VIEWS = [
  "pipeline",
  "orders",
  "projects",
  "wallet",
  "tasks",
  "messages",
] as const;

export type CrmView = (typeof CRM_VIEWS)[number];

export function isCrmView(view: AdminView): view is CrmView {
  return (CRM_VIEWS as readonly string[]).includes(view);
}

export const CRM_NAV: Array<{ id: CrmView; label: string; description: string }> = [
  { id: "pipeline", label: "Pipeline", description: "Leads and open opportunities" },
  { id: "orders", label: "Orders", description: "Accepted scope and agreements" },
  { id: "projects", label: "Projects", description: "Delivery, onboarding, and revisions" },
  { id: "wallet", label: "Wallet", description: "Invoices, collected money, and internal budgets" },
  { id: "tasks", label: "Tasks", description: "Follow-ups and next actions" },
  { id: "messages", label: "Messages & Alerts", description: "Support chat and online status" },
];

export type AdminView = DataBinId | "integrations" | "home" | CrmView;

export type AdminNavGroup = {
  title: string;
  items: DataBinId[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "People",
    items: ["clients"],
  },
  {
    title: "Documents",
    items: ["documents", "quotes", "drafts"],
  },
  {
    title: "Services",
    items: ["lineItems", "labor"],
  },
];

export function isDataBinView(view: AdminView): view is DataBinId {
  return view !== "integrations" && view !== "home" && !isCrmView(view);
}

export type DocumentBinId = Extract<DataBinId, "documents" | "quotes" | "drafts">;

export function isDocumentBin(binId: DataBinId): binId is DocumentBinId {
  return binId === "documents" || binId === "quotes" || binId === "drafts";
}

export function parseAdminView(value: string | undefined): AdminView {
  if (!value) return "home";
  if (value === "home" || value === "integrations") return value;
  if (value === "payments" || value === "budgets") return "wallet";
  if ((CRM_VIEWS as readonly string[]).includes(value)) return value as CrmView;
  if (isDataBinId(value)) return value;
  return "home";
}

export type AdminReturnFrom = "dashboard" | "settings" | Exclude<AdminView, "home">;

export function parseAdminReturnFrom(
  value: string | null | undefined
): AdminReturnFrom | null {
  if (!value) return null;
  if (value === "dashboard" || value === "settings") return value;
  if (value === "home") return "dashboard";
  if (value === "integrations") return value;
  if (value === "payments" || value === "budgets") return "wallet";
  if ((CRM_VIEWS as readonly string[]).includes(value)) return value as CrmView;
  if (isDataBinId(value)) return value;
  return null;
}

export function adminViewPath(
  view: AdminView,
  from?: AdminReturnFrom | null
): string {
  if (view === "home") return "/admin";
  const params = new URLSearchParams({ view });
  if (from) params.set("from", from);
  return `/admin?${params.toString()}`;
}

export function adminReturnHref(from: AdminReturnFrom): string {
  if (from === "settings") return "/admin/settings";
  if (from === "dashboard") return "/admin";
  return adminViewPath(from);
}

export function adminReturnLabel(from: AdminReturnFrom): string {
  if (from === "settings") return "Settings";
  if (from === "dashboard") return "Dashboard";
  if (from === "integrations") return "Integrations";
  if (isCrmView(from)) {
    return CRM_NAV.find((item) => item.id === from)?.label ?? "Workspace";
  }
  return DATA_BINS[from].label;
}
