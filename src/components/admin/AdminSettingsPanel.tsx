"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminAccountProfileCard from "@/components/admin/AdminAccountProfileCard";
import AdminSecurityCard from "@/components/admin/AdminSecurityCard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminIcon from "@/components/admin/AdminIcons";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AdminIconName } from "@/lib/admin-icons";
import type { AdminAccountSettings } from "@/lib/admin-account";
import type { SecuritySuggestion } from "@/lib/site-security";
import type { AdminProfileListItem } from "@/lib/admin-profiles";
import { DATA_BINS, type BinSummary, type DataBinId, type DeletedRecord } from "@/lib/storage/dataBins";
import {
  fetchDeletedRecords,
  downloadCsvExport,
  promptSaveCsvExport,
  uploadCsvImport,
  masterResetDatabase,
  purgeAllDeletedRecords,
  restoreDeletedRecord,
} from "@/lib/storage/dbClient";
import type { StorageBackend } from "@/lib/storage/storageBackend";
import type { IntegrationPublicView, IntegrationService } from "@/lib/integration-settings";
import {
  getStorageBackendLabel,
  isCloudStorageBackend,
} from "@/lib/storage/storageBackend";

type AdminSettingsPanelProps = {
  bins: BinSummary[];
  backend: StorageBackend;
  totalRecords: number;
  initialDeletedRecords: DeletedRecord[];
  stripeConfigured: boolean;
  emailConfigured: boolean;
  emailProvider: string | null;
  smsConfigured: boolean;
  twilioFromNumber: string | null;
  isMasterAdmin?: boolean;
  initialAdminProfiles?: AdminProfileListItem[];
  initialAccountSettings: AdminAccountSettings;
  maintenanceEnabled: boolean;
  securitySuggestions: SecuritySuggestion[];
};

function formatProfileDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDeletedDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SetupLines({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="mt-3 rounded-lg bg-white/80 px-3 py-2">
      <p className="text-[11px] font-semibold text-zinc-700">{title}</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-zinc-600">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  secret = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
      {label}
      <input
        type={secret ? "password" : "text"}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-zinc-900"
      />
    </label>
  );
}

function ConfigPanel({
  children,
  busy,
  error,
  onSave,
  onRemove,
}: {
  children: React.ReactNode;
  busy: boolean;
  error: string;
  onSave?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 space-y-2 border-t border-zinc-200/80 pt-3">
      {children}
      {error ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          Remove settings
        </button>
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="rounded-md bg-[#0780f7] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save connection"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function IntegrationTile({
  icon,
  title,
  detail,
  connected,
  facts,
  configOpen = false,
  onConfigure,
  children,
}: {
  icon: AdminIconName;
  title: string;
  detail: string;
  connected: boolean;
  facts: Array<[string, string]>;
  configOpen?: boolean;
  onConfigure?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-xl border px-4 py-3 ${
        connected ? "border-emerald-100 bg-emerald-50/50" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${
              connected ? "text-emerald-600" : "text-zinc-400"
            }`}
          >
            <AdminIcon name={icon} size={16} />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
            <p className="truncate text-xs text-zinc-500">{detail}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          {onConfigure ? (
            <button
              type="button"
              aria-label={`Configure ${title}`}
              aria-expanded={configOpen}
              title="Configure"
              onClick={onConfigure}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white hover:text-zinc-900"
            >
              <AdminIcon name="settings" size={15} />
            </button>
          ) : null}
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-300"}`}
            aria-hidden
          />
        </span>
      </div>
      {facts.length > 0 ? (
        <dl className="mt-3 space-y-1.5">
          {facts.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 text-xs">
              <dt className="text-zinc-500">{label}</dt>
              <dd className="truncate font-medium text-zinc-800">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </article>
  );
}

export default function AdminSettingsPanel({
  bins,
  backend,
  totalRecords,
  initialDeletedRecords,
  stripeConfigured,
  emailConfigured,
  emailProvider,
  smsConfigured,
  twilioFromNumber,
  isMasterAdmin = false,
  initialAdminProfiles = [],
  initialAccountSettings,
  maintenanceEnabled,
  securitySuggestions,
}: AdminSettingsPanelProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [csvPromptOpen, setCsvPromptOpen] = useState(false);
  const [savingCsv, setSavingCsv] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletedRecords, setDeletedRecords] = useState(initialDeletedRecords);
  const [trashLoading, setTrashLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingAll, setPurgingAll] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [integrationView, setIntegrationView] = useState<IntegrationPublicView | null>(null);
  const [configService, setConfigService] = useState<IntegrationService | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [configBusy, setConfigBusy] = useState(false);
  const [configError, setConfigError] = useState("");
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [dataTransferBusy, setDataTransferBusy] = useState<
    "export" | "import" | null
  >(null);
  const [adminProfiles, setAdminProfiles] = useState(initialAdminProfiles);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(
    null
  );
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingPasswordIds, setLoadingPasswordIds] = useState<Set<string>>(
    new Set()
  );
  const importInputRef = useRef<HTMLInputElement>(null);

  const togglePasswordVisibility = (profileId: string) => {
    setVisiblePasswordIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const handlePasswordToggle = async (profile: AdminProfileListItem) => {
    if (visiblePasswordIds.has(profile.id)) {
      togglePasswordVisibility(profile.id);
      return;
    }

    let password = profile.password;

    if (!password) {
      setLoadingPasswordIds((current) => new Set(current).add(profile.id));
      try {
        const response = await fetch(`/api/admin/profiles/${profile.id}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await response.json()) as {
          password?: string | null;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load password.");
        }
        password = data.password?.trim() || null;
        if (password) {
          setAdminProfiles((current) =>
            current.map((entry) =>
              entry.id === profile.id ? { ...entry, password } : entry
            )
          );
        }
      } catch {
        setError("Failed to load password for this profile.");
        return;
      } finally {
        setLoadingPasswordIds((current) => {
          const next = new Set(current);
          next.delete(profile.id);
          return next;
        });
      }
    }

    if (!password) {
      setError(
        "Password not stored for this profile. It will appear after the user signs in again."
      );
      return;
    }

    togglePasswordVisibility(profile.id);
  };

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await fetchDeletedRecords();
      setDeletedRecords(data.deleted);
    } catch {
      setError("Failed to load recently deleted records.");
    } finally {
      setTrashLoading(false);
    }
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    setError(null);
    try {
      await restoreDeletedRecord(id);
      setDeletedRecords((current) =>
        current.filter((entry) => entry.record.id !== id)
      );
      setMessage("Record restored.");
      router.refresh();
    } catch {
      setError("Failed to restore record.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePurgeAll = async () => {
    if (
      !window.confirm(
        "Permanently delete all items in Recently Deleted? This cannot be undone."
      )
    ) {
      return;
    }

    setPurgingAll(true);
    setError(null);
    try {
      await purgeAllDeletedRecords();
      setDeletedRecords([]);
      setMessage("Recently deleted list cleared.");
      router.refresh();
    } catch {
      setError("Failed to delete all records from trash.");
    } finally {
      setPurgingAll(false);
    }
  };

  const handleExportCsv = async () => {
    setDataTransferBusy("export");
    setError(null);
    setMessage(null);

    try {
      await downloadCsvExport("all");
      setMessage("CSV export downloaded.");
    } catch {
      setError("Failed to generate CSV export.");
    } finally {
      setDataTransferBusy(null);
    }
  };

  const handleImportCsv = async (file: File) => {
    setDataTransferBusy("import");
    setError(null);
    setMessage(null);

    try {
      const result = await uploadCsvImport(file);
      setMessage(`Imported ${result.imported} record${result.imported === 1 ? "" : "s"}.`);
      router.refresh();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import CSV."
      );
    } finally {
      setDataTransferBusy(null);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const handleMasterReset = () => {
    if (confirmText !== "RESET") {
      setError('Type "RESET" to confirm.');
      return;
    }
    setError(null);
    setMessage(null);
    setCsvPromptOpen(true);
  };

  const runMasterReset = async () => {
    setResetting(true);
    setMessage(null);
    setError(null);

    try {
      await masterResetDatabase();
      setMessage("This dashboard was reset. Other accounts were not changed.");
      setConfirmText("");
      setDeletedRecords([]);
      router.refresh();
    } catch {
      setError("Master reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const handleSaveCsvBackup = async () => {
    setSavingCsv(true);
    setError(null);
    let saved = false;
    try {
      saved = await promptSaveCsvExport("all");
    } catch {
      setError("Failed to save the CSV backup.");
      return;
    } finally {
      setSavingCsv(false);
    }
    if (!saved) return;

    setCsvPromptOpen(false);

    if (
      !window.confirm(
        "CSV backup saved. This permanently deletes this dashboard's drafts, clients, invoices, and notes. Other accounts stay. This cannot be undone."
      )
    ) {
      setMessage("CSV backup saved. Database was not reset.");
      return;
    }

    await runMasterReset();
  };

  const handleContinueReset = () => {
    setCsvPromptOpen(false);
    if (
      !window.confirm(
        "This permanently deletes this dashboard's drafts, clients, invoices, and notes. Other accounts stay. This cannot be undone."
      )
    ) {
      setMessage("Database was not reset.");
      return;
    }
    void runMasterReset();
  };

  const integrationsConnected = [
    isCloudStorageBackend(backend),
    emailConfigured,
    stripeConfigured,
  ].filter(Boolean).length;

  const loadIntegrations = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/integrations", { cache: "no-store" });
      const body = (await response.json()) as { integrations?: IntegrationPublicView; error?: string };
      if (response.ok && body.integrations) setIntegrationView(body.integrations);
    } catch {
      setConfigError("Could not load connection settings.");
    }
  }, []);

  useEffect(() => {
    if (!integrationsOpen) return;
    void loadIntegrations();
  }, [integrationsOpen, loadIntegrations]);

  function openIntegrationConfig(service: IntegrationService) {
    const view = integrationView;
    setConfigError("");
    if (configService === service) {
      setConfigService(null);
      return;
    }
    if (service === "email") {
      setConfigDraft({
        host: view?.email.host ?? "",
        port: view?.email.port || "465",
        user: view?.email.user ?? "",
        pass: "",
        secure: view?.email.secure === false ? "false" : "true",
      });
    } else if (service === "sms") {
      setConfigDraft({
        accountSid: view?.sms.accountSid ?? "",
        fromNumber: view?.sms.fromNumber ?? "",
        authToken: "",
      });
    } else if (service === "stripe") {
      setConfigDraft({ secretKey: "" });
    } else {
      setConfigDraft({});
    }
    setConfigService(service);
  }

  async function submitIntegration(action: "save" | "remove") {
    if (!configService) return;
    if (action === "remove") {
      const label = configService === "storage" ? "cloud storage" : configService;
      if (!window.confirm(`Remove the current ${label} settings and start from scratch?`)) return;
    }
    setConfigBusy(true);
    setConfigError("");
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: configService, action, ...configDraft }),
      });
      const body = (await response.json()) as { integrations?: IntegrationPublicView; error?: string };
      if (!response.ok || !body.integrations) {
        setConfigError(body.error || "Could not update this connection.");
        return;
      }
      setIntegrationView(body.integrations);
      setConfigService(null);
    } catch {
      setConfigError("Could not update this connection.");
    } finally {
      setConfigBusy(false);
    }
  }

  const loadAdminProfiles = useCallback(async () => {
    if (!isMasterAdmin) return;

    setProfilesLoading(true);
    try {
      const response = await fetch("/api/admin/profiles", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        profiles?: AdminProfileListItem[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load profiles.");
      }
      setAdminProfiles(data.profiles ?? []);
    } catch {
      setError("Failed to load user profiles.");
    } finally {
      setProfilesLoading(false);
    }
  }, [isMasterAdmin]);

  const handleDeleteProfile = async (profile: AdminProfileListItem) => {
    if (
      !window.confirm(
        `Delete profile "${profile.displayName}" (@${profile.username})? This permanently removes their account and all dashboard data.`
      )
    ) {
      return;
    }

    setDeletingProfileId(profile.id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/profiles/${profile.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        error?: string;
        deletedRecords?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete profile.");
      }

      setAdminProfiles((current) =>
        current.filter((entry) => entry.id !== profile.id)
      );
      setMessage(
        `Deleted @${profile.username}${
          typeof data.deletedRecords === "number" && data.deletedRecords > 0
            ? ` and ${data.deletedRecords} associated record${data.deletedRecords === 1 ? "" : "s"}.`
            : "."
        }`
      );
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete profile."
      );
    } finally {
      setDeletingProfileId(null);
    }
  };

  return (
    <div className="admin-shell admin-shell-flow">
      <AdminHeader
        sidebar={{
          bins,
          activeView: "home",
          onSelectHome: () => router.push("/admin"),
          onSelectBin: (binId: DataBinId) =>
            router.push(`/admin?view=${binId}&from=settings`),
          onSelectIntegrations: () =>
            router.push("/admin?view=integrations&from=settings"),
          onSelectCrm: (view) => router.push(`/admin?view=${view}&from=settings`),
          onSelectTeam: () => router.push("/admin?view=team&from=settings"),
        }}
      />

      <div className="admin-shell-body">
        <AdminSidebar
          bins={bins}
          activeView="home"
          onSelectHome={() => router.push("/admin")}
          onSelectBin={(binId: DataBinId) =>
            router.push(`/admin?view=${binId}&from=settings`)
          }
          onSelectIntegrations={() =>
            router.push("/admin?view=integrations&from=settings")
          }
          onSelectCrm={(view) => router.push(`/admin?view=${view}&from=settings`)}
          onSelectTeam={() => router.push("/admin?view=team&from=settings")}
        />

        <main className="admin-shell-main">
          <div className="space-y-6 p-6">
            <section className="admin-settings-hero">
              <div className="admin-settings-hero-inner">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/80">
                    Configuration
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                    Settings
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100/80">
                    Storage, integrations, deleted records, and database controls.
                  </p>
                </div>
                <div className="admin-settings-hero-stats">
                  <div className="admin-dash-hero-stat">
                    <p className="admin-dash-hero-stat-label">Records</p>
                    <p className="admin-dash-hero-stat-value">{totalRecords}</p>
                  </div>
                  <div className="admin-dash-hero-stat">
                    <p className="admin-dash-hero-stat-label">In trash</p>
                    <p className="admin-dash-hero-stat-value">
                      {deletedRecords.length}
                    </p>
                  </div>
                  <div className="admin-dash-hero-stat">
                    <p className="admin-dash-hero-stat-label">Integrations</p>
                    <p className="admin-dash-hero-stat-value">
                      {integrationsConnected}/3
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <AdminAccountProfileCard initialSettings={initialAccountSettings} />

            {(message || error) && (
              <div
                className={`admin-settings-toast ${
                  error
                    ? "admin-settings-toast-error"
                    : "admin-settings-toast-success"
                }`}
              >
                {error ?? message}
              </div>
            )}

            <section className="admin-settings-card">
              <button
                type="button"
                onClick={() => setIntegrationsOpen((open) => !open)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={integrationsOpen}
              >
                <span className="admin-dash-action-icon mt-0.5 shrink-0">
                  <AdminIcon name="integrations" size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Storage & integrations
                    </h3>
                    <AdminIcon
                      name="chevron-down"
                      size={16}
                      className={`shrink-0 text-zinc-400 transition-transform ${
                        integrationsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                  {!integrationsOpen ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      {integrationsConnected}/3 integrations connected — click to
                      expand
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      Cloud storage, email, SMS, Stripe, and data transfer.
                    </p>
                  )}
                </span>
              </button>

              {integrationsOpen ? (
                <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <p className="font-semibold uppercase tracking-wide text-zinc-400">
                        Connections
                      </p>
                      <p className="font-semibold text-zinc-700">
                        {(integrationView
                          ? [
                              integrationView.storage.connected,
                              integrationView.email.connected,
                              integrationView.sms.connected,
                              integrationView.stripe.connected,
                            ]
                          : [
                              isCloudStorageBackend(backend),
                              emailConfigured,
                              smsConfigured,
                              stripeConfigured,
                            ]
                        ).filter(Boolean).length}{" "}
                        of 4 live
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {(integrationView
                        ? [
                            integrationView.storage.connected,
                            integrationView.email.connected,
                            integrationView.sms.connected,
                            integrationView.stripe.connected,
                          ]
                        : [
                            isCloudStorageBackend(backend),
                            emailConfigured,
                            smsConfigured,
                            stripeConfigured,
                          ]
                      ).map((live, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full ${live ? "bg-[#0780f7]" : "bg-zinc-200"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <IntegrationTile
                      icon="cloud"
                      title="Cloud storage"
                      detail="Quotes, invoices, and catalog data"
                      connected={integrationView ? integrationView.storage.connected : isCloudStorageBackend(backend)}
                      configOpen={configService === "storage"}
                      onConfigure={() => openIntegrationConfig("storage")}
                      facts={[
                        ["Backend", integrationView?.storage.label ?? getStorageBackendLabel(backend)],
                        ["Records", String(totalRecords)],
                      ]}
                    >
                      {configService === "storage" ? (
                        <ConfigPanel
                          busy={configBusy}
                          error={configError}
                          onRemove={() => void submitIntegration("remove")}
                        >
                          <p className="text-xs text-zinc-600">
                            Remove clears this connection from settings. Records already stored stay on the server.
                          </p>
                        </ConfigPanel>
                      ) : null}
                    </IntegrationTile>
                    <IntegrationTile
                      icon="mail"
                      title="Email"
                      detail="Invoices from admin@overdriveio.com"
                      connected={integrationView ? integrationView.email.connected : emailConfigured}
                      configOpen={configService === "email"}
                      onConfigure={() => openIntegrationConfig("email")}
                      facts={[
                        [
                          "Provider",
                          integrationView
                            ? integrationView.email.provider || "Not set up"
                            : emailConfigured
                              ? (emailProvider ?? "Configured")
                              : "Not set up",
                        ],
                      ]}
                    >
                      {configService === "email" ? (
                        <ConfigPanel
                          busy={configBusy}
                          error={configError}
                          onSave={() => void submitIntegration("save")}
                          onRemove={() => void submitIntegration("remove")}
                        >
                          <ConfigField label="Host" value={configDraft.host ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, host: value }))} />
                          <ConfigField label="Port" value={configDraft.port ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, port: value }))} />
                          <ConfigField label="Username" value={configDraft.user ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, user: value }))} />
                          <ConfigField label="Password" secret placeholder={integrationView?.email.hasPassword ? "Saved — leave blank to keep" : "Password"} value={configDraft.pass ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, pass: value }))} />
                        </ConfigPanel>
                      ) : !(integrationView ? integrationView.email.connected : emailConfigured) ? (
                        <SetupLines
                          title="Hostinger SMTP variables"
                          lines={[
                            "SMTP_HOST=smtp.hostinger.com",
                            "SMTP_PORT=465",
                            "SMTP_SECURE=true",
                            "SMTP_USER=admin@overdriveio.com",
                            "SMTP_PASS=your email password",
                          ]}
                        />
                      ) : null}
                    </IntegrationTile>
                    <IntegrationTile
                      icon="notes"
                      title="SMS"
                      detail="Text quotes and invoices via Twilio"
                      connected={integrationView ? integrationView.sms.connected : smsConfigured}
                      configOpen={configService === "sms"}
                      onConfigure={() => openIntegrationConfig("sms")}
                      facts={[
                        ["Provider", (integrationView ? integrationView.sms.connected : smsConfigured) ? "Twilio" : "Not set up"],
                        ...((integrationView?.sms.fromNumber || twilioFromNumber)
                          ? ([["From", integrationView?.sms.fromNumber || twilioFromNumber || ""]] as Array<[string, string]>)
                          : []),
                      ]}
                    >
                      {configService === "sms" ? (
                        <ConfigPanel
                          busy={configBusy}
                          error={configError}
                          onSave={() => void submitIntegration("save")}
                          onRemove={() => void submitIntegration("remove")}
                        >
                          <ConfigField label="Account SID" value={configDraft.accountSid ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, accountSid: value }))} />
                          <ConfigField label="Auth token" secret placeholder={integrationView?.sms.hasToken ? "Saved — leave blank to keep" : "Auth token"} value={configDraft.authToken ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, authToken: value }))} />
                          <ConfigField label="From number" value={configDraft.fromNumber ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, fromNumber: value }))} />
                        </ConfigPanel>
                      ) : !(integrationView ? integrationView.sms.connected : smsConfigured) ? (
                        <SetupLines
                          title="Twilio environment variables"
                          lines={[
                            "TWILIO_ACCOUNT_SID=ACxxxxxxxx",
                            "TWILIO_AUTH_TOKEN=your auth token",
                            "TWILIO_PHONE_NUMBER=+15551234567",
                          ]}
                        />
                      ) : null}
                    </IntegrationTile>
                    <IntegrationTile
                      icon="credit-card"
                      title="Stripe"
                      detail={
                        (integrationView ? integrationView.stripe.connected : stripeConfigured)
                          ? "Checkout is ready for invoice emails"
                          : "Checkout links in invoice emails"
                      }
                      connected={integrationView ? integrationView.stripe.connected : stripeConfigured}
                      configOpen={configService === "stripe"}
                      onConfigure={() => openIntegrationConfig("stripe")}
                      facts={[]}
                    >
                      {configService === "stripe" ? (
                        <ConfigPanel
                          busy={configBusy}
                          error={configError}
                          onSave={() => void submitIntegration("save")}
                          onRemove={() => void submitIntegration("remove")}
                        >
                          <ConfigField label="Secret key" secret placeholder={integrationView?.stripe.hasKey ? "Saved — leave blank to keep" : "sk_live_..."} value={configDraft.secretKey ?? ""} onChange={(value) => setConfigDraft((current) => ({ ...current, secretKey: value }))} />
                        </ConfigPanel>
                      ) : !(integrationView ? integrationView.stripe.connected : stripeConfigured) ? (
                        <p className="mt-3 text-xs text-zinc-500">
                          Add <span className="font-mono text-zinc-700">STRIPE_SECRET_KEY</span> to connect checkout.
                        </p>
                      ) : null}
                    </IntegrationTile>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-900">Data transfer</h4>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Export or import dashboard records as CSV.
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleExportCsv()}
                          disabled={dataTransferBusy !== null || totalRecords === 0}
                          className="btn-outline px-3 py-1.5 text-xs"
                        >
                          {dataTransferBusy === "export" ? "Exporting…" : "Export CSV"}
                        </button>
                        <label
                          className={`btn-outline inline-flex cursor-pointer px-3 py-1.5 text-xs ${
                            dataTransferBusy !== null ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          {dataTransferBusy === "import" ? "Importing…" : "Import CSV"}
                          <input
                            ref={importInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="sr-only"
                            disabled={dataTransferBusy !== null}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleImportCsv(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <Link
                      href="/admin?view=integrations"
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-[#f4f8ff] px-4 py-3 text-sm font-semibold text-[#0560b5] hover:border-[#0780f7]"
                    >
                      <span>
                        Integrations hub
                        <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                          All connection details
                        </span>
                      </span>
                      <AdminIcon name="chevron-right" size={16} />
                    </Link>
                  </div>
                </div>
              ) : null}
            </section>

            <AdminSecurityCard
              initialMaintenance={maintenanceEnabled}
              suggestions={securitySuggestions}
              canToggle={isMasterAdmin}
            />

            {isMasterAdmin ? (
              <section className="admin-settings-card">
                <button
                  type="button"
                  onClick={() => setProfilesOpen((open) => !open)}
                  className="flex w-full items-start gap-3 text-left"
                  aria-expanded={profilesOpen}
                >
                  <span className="admin-dash-action-icon mt-0.5 shrink-0">
                    <AdminIcon name="clients" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Users & profiles
                      </h3>
                      <AdminIcon
                        name="chevron-down"
                        size={16}
                        className={`shrink-0 text-zinc-400 transition-transform ${
                          profilesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                    {!profilesOpen ? (
                      <p className="mt-1 text-sm text-zinc-500">
                        {adminProfiles.length > 0
                          ? `${adminProfiles.length} profile${adminProfiles.length === 1 ? "" : "s"} — click to expand`
                          : "No user profiles yet — click to expand"}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-500">
                        Dashboard accounts created from the sign-in page.
                      </p>
                    )}
                  </span>
                </button>

                {profilesOpen ? (
                  <div className="mt-4 border-t border-zinc-100 pt-4">
                    <div className="mb-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void loadAdminProfiles()}
                        className="btn-outline px-3 py-1.5 text-xs"
                        disabled={profilesLoading}
                      >
                        {profilesLoading ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>

                <div className="admin-settings-trash-table">
                  <div className="admin-settings-profiles-head">
                    <span>User</span>
                    <span>Username</span>
                    <span>Password</span>
                    <span>Created</span>
                    <span className="text-right">Action</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {adminProfiles.length === 0 ? (
                      <p className="bg-white px-4 py-10 text-center text-sm text-zinc-500">
                        No user profiles yet — accounts appear here after someone
                        creates a profile on the sign-in page.
                      </p>
                    ) : (
                      adminProfiles.map((profile, index) => (
                        <div
                          key={profile.id}
                          className={`admin-settings-profiles-row ${
                            index % 2 === 0 ? "bg-white" : "bg-zinc-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {profile.displayName}
                            </p>
                          </div>
                          <span className="truncate font-mono text-xs text-zinc-600">
                            @{profile.username}
                          </span>
                          <div className="flex min-w-0 items-center gap-1">
                            <span className="truncate font-mono text-xs tracking-wider text-zinc-700">
                              {visiblePasswordIds.has(profile.id) && profile.password
                                ? profile.password
                                : "*".repeat(
                                    profile.password
                                      ? Math.min(profile.password.length, 10)
                                      : 8
                                  )}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handlePasswordToggle(profile);
                              }}
                              disabled={loadingPasswordIds.has(profile.id)}
                              className="shrink-0 rounded p-0.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-wait disabled:opacity-50"
                              aria-label={
                                visiblePasswordIds.has(profile.id)
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              <AdminIcon
                                name={
                                  visiblePasswordIds.has(profile.id)
                                    ? "eye-off"
                                    : "eye"
                                }
                                size={14}
                              />
                            </button>
                          </div>
                          <span className="truncate text-xs tabular-nums text-zinc-500">
                            {formatProfileDate(profile.createdAt)}
                          </span>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleDeleteProfile(profile)}
                              disabled={
                                deletingProfileId === profile.id ||
                                profilesLoading
                              }
                              className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingProfileId === profile.id
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {adminProfiles.length > 0 ? (
                    <div className="admin-settings-trash-foot">
                      <p className="text-xs text-zinc-500">
                        {adminProfiles.length} profile
                        {adminProfiles.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : null}
                </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="admin-settings-card">
              <button
                type="button"
                onClick={() => setTrashOpen((open) => !open)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={trashOpen}
              >
                <span className="admin-dash-action-icon mt-0.5 shrink-0">
                  <AdminIcon name="folder-open" size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Recently deleted
                    </h3>
                    <AdminIcon
                      name="chevron-down"
                      size={16}
                      className={`shrink-0 text-zinc-400 transition-transform ${
                        trashOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                  {!trashOpen ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      {deletedRecords.length > 0
                        ? `${deletedRecords.length} item${deletedRecords.length === 1 ? "" : "s"} in trash — click to expand`
                        : "Trash is empty — click to expand"}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">
                      Restore records or permanently remove them from trash.
                    </p>
                  )}
                </span>
              </button>

              {trashOpen ? (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void loadTrash()}
                      className="btn-outline px-3 py-1.5 text-xs"
                      disabled={trashLoading}
                    >
                      {trashLoading ? "Refreshing…" : "Refresh"}
                    </button>
                  </div>

                  <div className="admin-settings-trash-table">
                    <div className="admin-settings-trash-head">
                      <span>Record</span>
                      <span className="hidden sm:block">Type</span>
                      <span>Deleted</span>
                      <span className="text-right">Action</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {deletedRecords.length === 0 ? (
                        <p className="bg-white px-4 py-10 text-center text-sm text-zinc-500">
                          Trash is empty — deleted records will appear here.
                        </p>
                      ) : (
                        deletedRecords.map((entry, index) => (
                          <div
                            key={entry.record.id}
                            className={`admin-settings-trash-row ${
                              index % 2 === 0 ? "bg-white" : "bg-zinc-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-zinc-900">
                                {entry.record.label}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-zinc-500 sm:hidden">
                                {DATA_BINS[entry.record.binId].label}
                              </p>
                            </div>
                            <span className="hidden truncate text-xs text-zinc-500 sm:block">
                              {DATA_BINS[entry.record.binId].label}
                            </span>
                            <span className="truncate text-xs tabular-nums text-zinc-500">
                              {formatDeletedDate(entry.deletedAt)}
                            </span>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => void handleRestore(entry.record.id)}
                                disabled={
                                  restoringId === entry.record.id || purgingAll
                                }
                                className="btn-outline px-2.5 py-1 text-[11px]"
                              >
                                {restoringId === entry.record.id
                                  ? "Restoring…"
                                  : "Recover"}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {deletedRecords.length > 0 ? (
                      <div className="admin-settings-trash-foot">
                        <p className="text-xs text-zinc-500">
                          {deletedRecords.length} item
                          {deletedRecords.length === 1 ? "" : "s"} in trash
                        </p>
                        <button
                          type="button"
                          onClick={() => void handlePurgeAll()}
                          disabled={purgingAll || restoringId !== null}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {purgingAll ? "Deleting…" : "Delete all permanently"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="admin-settings-danger">
              <button
                type="button"
                onClick={() => setDangerZoneOpen((open) => !open)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={dangerZoneOpen}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <AdminIcon name="trash" size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-red-800">
                      Danger zone
                    </h3>
                    <AdminIcon
                      name="chevron-down"
                      size={16}
                      className={`shrink-0 text-red-400 transition-transform ${
                        dangerZoneOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                  {!dangerZoneOpen ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      Master reset — click to expand
                    </p>
                  ) : null}
                </span>
              </button>

              {dangerZoneOpen ? (
                <div className="mt-4 border-t border-red-100 pt-4 pl-12">
                  <p className="text-sm text-zinc-600">
                    Master reset deletes this dashboard's drafts, clients,
                    invoices, and notes, plus trash and local drafts on this
                    device. Other accounts stay.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="doc-label" htmlFor="settings-reset-confirm">
                        Type RESET to confirm
                      </label>
                      <input
                        id="settings-reset-confirm"
                        type="text"
                        value={confirmText}
                        onChange={(e) =>
                          setConfirmText(e.target.value.toUpperCase())
                        }
                        placeholder="RESET"
                        className="field mt-1 max-w-xs"
                        disabled={resetting}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleMasterReset()}
                      disabled={resetting || confirmText !== "RESET"}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resetting ? "Resetting…" : "Master reset database"}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            {csvPromptOpen ? (
              <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 p-4">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="reset-csv-title"
                  className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
                >
                  <h3 id="reset-csv-title" className="text-base font-semibold text-zinc-900">
                    Save a CSV backup
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    Save a CSV of this dashboard before the reset continues. Other accounts stay.
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() => setCsvPromptOpen(false)}
                      disabled={savingCsv}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-[#0780f7] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={() => void handleSaveCsvBackup()}
                      disabled={savingCsv || resetting}
                    >
                      {savingCsv ? "Saving…" : "Save CSV"}
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      onClick={handleContinueReset}
                      disabled={savingCsv || resetting}
                    >
                      {resetting ? "Resetting…" : "Reset"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
