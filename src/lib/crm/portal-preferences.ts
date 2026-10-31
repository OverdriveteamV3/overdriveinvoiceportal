export type PortalPreferences = {
  theme: "light";
  accent: "blue";
  density: "comfortable";
  notifyProjectStatus: boolean;
  notifyInvoiceReminders: boolean;
};

export const DEFAULT_PORTAL_PREFERENCES: PortalPreferences = {
  theme: "light",
  accent: "blue",
  density: "comfortable",
  notifyProjectStatus: true,
  notifyInvoiceReminders: true,
};

export function parsePortalPreferences(value: unknown): PortalPreferences {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    theme: "light",
    accent: "blue",
    density: "comfortable",
    notifyProjectStatus:
      typeof row.notifyProjectStatus === "boolean"
        ? row.notifyProjectStatus
        : DEFAULT_PORTAL_PREFERENCES.notifyProjectStatus,
    notifyInvoiceReminders:
      typeof row.notifyInvoiceReminders === "boolean"
        ? row.notifyInvoiceReminders
        : DEFAULT_PORTAL_PREFERENCES.notifyInvoiceReminders,
  };
}
