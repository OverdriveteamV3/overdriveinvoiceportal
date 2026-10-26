"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminClientDetailModal from "@/components/admin/AdminClientDetailModal";
import { AdminClientAvatar } from "@/components/admin/AdminClientProfileUpload";
import AdminIcon from "@/components/admin/AdminIcons";
import { PROJECT_STAGE_LABELS, type ProjectStage } from "@/lib/crm/stages";
import {
  clientCatalogFromRecord,
  computeClientBalanceStats,
} from "@/lib/client-balances";
import { isDirectoryClientRecord } from "@/lib/catalog-clients";
import { formatMoney } from "@/lib/drafts";
import type { StoredRecord } from "@/lib/storage/dataBins";
import { fetchBinRecords } from "@/lib/storage/dbClient";

type AdminClientsPanelProps = {
  records: StoredRecord[];
  loading: boolean;
  onRefresh: () => void | Promise<void>;
};

type JobProject = {
  id: string;
  name: string;
  stage: string;
  clients?: { display_name?: string; company_name?: string; email?: string } | null;
};

function clientInitials(clientName: string, companyName: string): string {
  const source = (clientName || companyName || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function clientMeta(catalog: ReturnType<typeof clientCatalogFromRecord>): string {
  const parts = [
    catalog.companyName,
    catalog.email,
    catalog.phone,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "No contact details";
}

export default function AdminClientsPanel({
  records,
  loading,
  onRefresh,
}: AdminClientsPanelProps) {
  const [selectedClient, setSelectedClient] = useState<StoredRecord | null>(
    null
  );
  const [documentRecords, setDocumentRecords] = useState<StoredRecord[]>([]);
  const [jobs, setJobs] = useState<JobProject[]>([]);

  const loadDocumentRecords = useCallback(async () => {
    try {
      const [drafts, documents, quotes] = await Promise.all([
        fetchBinRecords("drafts"),
        fetchBinRecords("documents"),
        fetchBinRecords("quotes"),
      ]);

      setDocumentRecords([
        ...(drafts.records ?? []),
        ...(documents.records ?? []),
        ...(quotes.records ?? []),
      ]);
    } catch {
      setDocumentRecords([]);
    }
  }, []);

  useEffect(() => {
    void loadDocumentRecords();
  }, [loadDocumentRecords, records]);

  useEffect(() => {
    setSelectedClient((current) => {
      if (!current) return current;
      const next = records.find((record) => record.id === current.id) ?? null;
      return next === current ? current : next;
    });
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crm/projects")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled) setJobs(body?.projects ?? []);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [records]);

  const jobFor = useCallback(
    (record: StoredRecord) => {
      const catalog = clientCatalogFromRecord(record);
      const email = catalog.email.trim().toLowerCase();
      const name = (catalog.clientName || record.label).trim().toLowerCase();
      return jobs.find((job) => {
        const client = job.clients;
        const jobEmail = client?.email?.trim().toLowerCase() ?? "";
        const jobName = (client?.company_name || client?.display_name || "").trim().toLowerCase();
        return (email !== "" && email === jobEmail) || (name !== "" && name === jobName);
      });
    },
    [jobs]
  );

  const sortedRecords = useMemo(
    () =>
      [...records]
        .filter(isDirectoryClientRecord)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [records]
  );

  const handleRefresh = async () => {
    await onRefresh();
    await loadDocumentRecords();
  };

  if (loading) {
    return <p className="p-6 text-sm text-zinc-500">Loading clients…</p>;
  }

  if (sortedRecords.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <AdminIcon name="clients" size={22} />
          </span>
          <p className="mt-4 text-sm font-medium text-zinc-700">No clients yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add a client from the dashboard or save one from the invoice app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-client-list">
        <div className="admin-client-list-header">
          <p className="admin-client-list-title">Directory</p>
          <span className="admin-client-list-count">
            {sortedRecords.length} client{sortedRecords.length === 1 ? "" : "s"}
          </span>
        </div>

        <ul className="space-y-2">
          {sortedRecords.map((record) => {
            const catalog = clientCatalogFromRecord(record);
            const balances = computeClientBalanceStats(
              catalog,
              documentRecords,
              record
            );
            const hasOpenBalance = balances.openBalance > 0.01;
            const hasOverdue = balances.overdueBalance > 0.01;
            const job = jobFor(record);
            const stageLabel = job
              ? PROJECT_STAGE_LABELS[job.stage as ProjectStage] ?? job.stage
              : "";

            const expanded = selectedClient?.id === record.id;

            return (
              <li
                key={record.id}
                className={`admin-client-card${expanded ? " admin-client-card-open" : ""}`}
              >
                <div className="flex items-stretch">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setSelectedClient((current) =>
                      current?.id === record.id ? null : record
                    )
                  }
                  className="admin-client-row admin-client-row-inset group min-w-0 flex-1"
                >
                  <AdminClientAvatar
                    profileImage={catalog.profileImage}
                    initials={clientInitials(
                      catalog.clientName,
                      catalog.companyName
                    )}
                  />

                  <span className="admin-client-info">
                    <span className="admin-client-name">{record.label}</span>
                    <span className="admin-client-meta">
                      {clientMeta(catalog)}
                      {job ? ` · ${job.name}` : ""}
                      {stageLabel ? ` · ${stageLabel}` : ""}
                    </span>
                  </span>

                  <span className="admin-client-tabs">
                    <span
                      className={`admin-client-tab ${
                        hasOpenBalance
                          ? "admin-client-tab-open"
                          : "admin-client-tab-open-zero"
                      }`}
                    >
                      {formatMoney(balances.openBalance)} open
                    </span>
                    {hasOverdue ? (
                      <span className="admin-client-tab admin-client-tab-overdue">
                        {formatMoney(balances.overdueBalance)} overdue
                      </span>
                    ) : null}
                  </span>

                  <AdminIcon
                    name={expanded ? "chevron-down" : "chevron-right"}
                    size={16}
                    className="admin-client-chevron"
                  />
                </button>
                </div>
                {expanded ? (
                  <AdminClientDetailModal
                    embedded
                    client={record}
                    documentRecords={documentRecords}
                    onClose={() => setSelectedClient(null)}
                    onSaved={handleRefresh}
                    onDeleted={handleRefresh}
                    onDocumentsChanged={handleRefresh}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
