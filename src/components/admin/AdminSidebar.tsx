"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DATA_BINS, type BinSummary, type DataBinId } from "@/lib/storage/dataBins";
import {
  ADMIN_NAV_GROUPS,
  CRM_NAV,
  type AdminView,
  type CrmView,
} from "@/components/admin/admin-nav";
import AdminIcon from "@/components/admin/AdminIcons";
import AdminSidebarSignOut from "@/components/admin/AdminSidebarSignOut";
import type { AdminIconName } from "@/lib/admin-icons";

const WORKSPACE_ICONS: Record<CrmView, AdminIconName> = {
  prospects: "user-plus",
  pipeline: "quotes",
  orders: "documents",
  projects: "folder-open",
  wallet: "credit-card",
  tasks: "clock",
  messages: "mail",
};

export type AdminSidebarProps = {
  bins: BinSummary[];
  activeView: AdminView;
  onSelectHome: () => void;
  onSelectBin: (binId: DataBinId) => void;
  onSelectIntegrations: () => void;
  onSelectCrm?: (view: CrmView) => void;
  onSelectTeam?: () => void;
  onNavigate?: () => void;
  embedded?: boolean;
};

const NAV_SECTIONS = ["people", "documents", "services", "workspace", "connect"] as const;
type NavSectionKey = (typeof NAV_SECTIONS)[number];
type SeenCounts = Partial<Record<NavSectionKey, number>>;

const SEEN_KEY = "admin-nav-seen-counts";

const DEFAULT_EXPANDED = Object.fromEntries(
  NAV_SECTIONS.map((key) => [key, false])
) as Record<NavSectionKey, boolean>;

function readSeen(): SeenCounts {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenCounts;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSeen(value: SeenCounts) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(value));
  } catch {
    // The light still works for this visit when storage is blocked.
  }
}

function countForBin(bins: BinSummary[], binId: DataBinId): number {
  return bins.find((bin) => bin.binId === binId)?.count ?? 0;
}

function groupItemCount(bins: BinSummary[], items: DataBinId[]): number {
  return items.reduce((sum, binId) => sum + countForBin(bins, binId), 0);
}

function NavSection({
  title,
  expanded,
  onToggle,
  updated = false,
  collapsible = true,
  children,
}: {
  title: string;
  expanded?: boolean;
  onToggle?: () => void;
  updated?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  if (!collapsible) {
    return (
      <div>
        <p className="admin-nav-group-label">{title}</p>
        <div className="mt-1.5 space-y-1">{children}</div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="admin-nav-section-toggle"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span>{title}</span>
          {updated && !expanded ? (
            <span className="admin-nav-section-light" title="New updates">
              <span className="sr-only">New updates</span>
            </span>
          ) : null}
        </span>
        <span
          className={`admin-nav-chevron ${expanded ? "admin-nav-chevron-open" : ""}`}
          aria-hidden
        >
          <AdminIcon name="chevron-down" size={16} />
        </span>
      </button>
      <div
        className={`admin-nav-section-body ${expanded ? "admin-nav-section-body-open" : ""}`}
      >
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  active,
  label,
  description,
  icon,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: AdminIconName;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-nav-item ${active ? "admin-nav-item-active" : ""}`}
    >
      <span className="admin-nav-icon" aria-hidden>
        <AdminIcon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold leading-none text-zinc-800">
        {label}
      </span>
      <span className="sr-only">{description}</span>
      {count !== undefined && (
        <span className={`admin-nav-badge ${active ? "admin-nav-badge-active" : ""}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function AdminSidebarNav({
  bins,
  activeView,
  onSelectHome,
  onSelectBin,
  onSelectIntegrations,
  onSelectCrm,
  onSelectTeam,
  onNavigate,
  embedded = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const settingsActive = pathname === "/admin/settings";
  const [expanded, setExpanded] =
    useState<Record<NavSectionKey, boolean>>(DEFAULT_EXPANDED);

  const [supportAlerts, setSupportAlerts] = useState(0);
  const [prospectCount, setProspectCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [seen, setSeen] = useState<SeenCounts | null>(null);
  const baselineSet = useRef(false);
  const binsRef = useRef(bins);
  binsRef.current = bins;

  useEffect(() => {
    let stop = false;
    async function loadAlerts() {
      let nextAlerts = 0;
      let nextProspects = 0;
      let nextTeam = 0;
      try {
        const response = await fetch("/api/crm/support");
        if (response.ok) {
          const body = await response.json();
          nextAlerts = Number(body.unread) || 0;
        }
      } catch {
        // The nav still works when the support desk is unavailable.
      }
      try {
        const response = await fetch("/api/crm/opportunities");
        if (response.ok) {
          const body = await response.json();
          nextProspects = ((body.opportunities ?? []) as Array<{ stage?: string; archived_at?: string | null }>).filter(
            (row) => row.stage === "new_lead" && !row.archived_at
          ).length;
        }
      } catch {
        // The Prospects item still opens when the count cannot load.
      }
      try {
        const response = await fetch("/api/admin/team");
        if (response.ok) {
          const body = await response.json();
          nextTeam = Array.isArray(body.members) ? body.members.length : 0;
        }
      } catch {
        // The Team item still opens when the roster cannot load.
      }
      if (stop) return;
      setSupportAlerts(nextAlerts);
      setProspectCount(nextProspects);
      setTeamCount(nextTeam);
      if (!baselineSet.current) {
        baselineSet.current = true;
        const stored = readSeen();
        const currentBins = binsRef.current;
        const totals: Record<NavSectionKey, number> = {
          people: groupItemCount(currentBins, ["clients"]) + nextTeam,
          documents: groupItemCount(currentBins, ["documents", "quotes", "drafts"]),
          services: groupItemCount(currentBins, ["lineItems", "labor"]),
          workspace: nextProspects + nextAlerts,
          connect: 0,
        };
        const next: SeenCounts = { ...stored };
        for (const key of NAV_SECTIONS) {
          if (typeof next[key] !== "number") next[key] = totals[key];
        }
        writeSeen(next);
        setSeen(next);
      }
    }
    void loadAlerts();
    const timer = window.setInterval(loadAlerts, 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [activeView]);

  const sectionTotals: Record<NavSectionKey, number> = {
    people: groupItemCount(bins, ["clients"]) + teamCount,
    documents: groupItemCount(bins, ["documents", "quotes", "drafts"]),
    services: groupItemCount(bins, ["lineItems", "labor"]),
    workspace: prospectCount + supportAlerts,
    connect: 0,
  };

  const hasUpdate = (key: NavSectionKey) =>
    seen !== null && !expanded[key] && sectionTotals[key] > (seen[key] ?? sectionTotals[key]);

  const markSeen = (key: NavSectionKey) => {
    setSeen((prev) => {
      const next = { ...(prev ?? readSeen()), [key]: sectionTotals[key] };
      writeSeen(next);
      return next;
    });
  };

  const toggle = (key: NavSectionKey) => {
    if (!expanded[key]) markSeen(key);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigate = (action: () => void) => {
    action();
    onNavigate?.();
  };

  const navContent = (
    <>
      {!embedded ? (
        <div className="admin-sidebar-header">
          <img
            src="/overdrive-logo.webp"
            alt="Over Drive"
            className="admin-sidebar-logo"
          />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Navigation
          </p>
        </div>
      ) : null}

      <nav className="space-y-4">
        <NavSection title="Overview" collapsible={false}>
          <NavItem
            active={activeView === "home"}
            label="Home"
            description="Dashboard and business metrics"
            icon="home"
            onClick={() => navigate(onSelectHome)}
          />
        </NavSection>

        {ADMIN_NAV_GROUPS.map((group) => {
          const key = group.title.toLowerCase() as NavSectionKey;
          return (
            <NavSection
              key={group.title}
              title={group.title}
              expanded={expanded[key]}
              onToggle={() => toggle(key)}
              updated={hasUpdate(key)}
            >
              {group.items.map((binId) => {
                const meta = DATA_BINS[binId];
                return (
                  <NavItem
                    key={binId}
                    active={activeView === binId}
                    label={meta.label}
                    description={meta.description}
                    icon={meta.icon}
                    count={countForBin(bins, binId)}
                    onClick={() => navigate(() => onSelectBin(binId))}
                  />
                );
              })}
              {group.title === "People" ? (
                <NavItem
                  active={activeView === "team"}
                  label="Team"
                  description="Admins, agents, and tech seats"
                  icon="user-plus"
                  count={teamCount > 0 ? teamCount : undefined}
                  onClick={() => navigate(() => onSelectTeam?.())}
                />
              ) : null}
            </NavSection>
          );
        })}

        <NavSection
          title="Workspace"
          expanded={expanded.workspace}
          onToggle={() => toggle("workspace")}
          updated={hasUpdate("workspace")}
        >
          {CRM_NAV.map((item) => (
            <NavItem
              key={item.id}
              active={activeView === item.id}
              label={item.label}
              description={item.description}
              icon={WORKSPACE_ICONS[item.id]}
              count={
                item.id === "messages" && supportAlerts > 0
                  ? supportAlerts
                  : item.id === "prospects" && prospectCount > 0
                    ? prospectCount
                    : undefined
              }
              onClick={() => navigate(() => onSelectCrm?.(item.id))}
            />
          ))}
        </NavSection>

        <NavSection
          title="Connect"
          expanded={expanded.connect}
          onToggle={() => toggle("connect")}
        >
          <NavItem
            active={activeView === "integrations"}
            label="Integrations"
            description="Email, payments, and cloud storage"
            icon="integrations"
            onClick={() => navigate(onSelectIntegrations)}
          />
        </NavSection>
      </nav>

      <div className="admin-sidebar-footer">
        <Link
          href="/admin/settings"
          className={`admin-sidebar-link ${settingsActive ? "admin-sidebar-link-active" : ""}`}
          onClick={() => onNavigate?.()}
        >
          <span className="admin-nav-icon admin-nav-icon-muted" aria-hidden>
            <AdminIcon name="settings" size={16} />
          </span>
          <span className="flex-1 text-left text-[13px] font-medium text-zinc-700">
            Settings
          </span>
          <AdminIcon name="chevron-right" size={14} className="text-zinc-300" />
        </Link>
        <AdminSidebarSignOut />
      </div>
    </>
  );

  if (embedded) {
    return <div className="admin-sidebar-embedded">{navContent}</div>;
  }

  return <div className="admin-sidebar-card">{navContent}</div>;
}

export default function AdminSidebar(props: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar hidden lg:block">
      <AdminSidebarNav {...props} />
    </aside>
  );
}
