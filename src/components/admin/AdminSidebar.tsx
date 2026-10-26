"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DATA_BINS, type BinSummary, type DataBinId } from "@/lib/storage/dataBins";
import {
  ADMIN_NAV_GROUPS,
  CRM_NAV,
  isCrmView,
  isDataBinView,
  type AdminView,
  type CrmView,
} from "@/components/admin/admin-nav";
import AdminIcon from "@/components/admin/AdminIcons";
import AdminSidebarSignOut from "@/components/admin/AdminSidebarSignOut";
import type { AdminIconName } from "@/lib/admin-icons";

export type AdminSidebarProps = {
  bins: BinSummary[];
  activeView: AdminView;
  onSelectHome: () => void;
  onSelectBin: (binId: DataBinId) => void;
  onSelectIntegrations: () => void;
  onSelectCrm?: (view: CrmView) => void;
  onNavigate?: () => void;
  embedded?: boolean;
};

const NAV_SECTIONS = ["overview", "people", "documents", "services", "connect"] as const;
type NavSectionKey = (typeof NAV_SECTIONS)[number];

const DEFAULT_EXPANDED = Object.fromEntries(
  NAV_SECTIONS.map((key) => [key, true])
) as Record<NavSectionKey, boolean>;

function sectionKeyForView(view: AdminView): NavSectionKey {
  if (view === "home" || isCrmView(view)) return "overview";
  if (view === "integrations") return "connect";
  for (const group of ADMIN_NAV_GROUPS) {
    if (isDataBinView(view) && group.items.includes(view)) {
      return group.title.toLowerCase() as NavSectionKey;
    }
  }
  return "overview";
}

function countForBin(bins: BinSummary[], binId: DataBinId): number {
  return bins.find((bin) => bin.binId === binId)?.count ?? 0;
}

function groupItemCount(bins: BinSummary[], items: DataBinId[]): number {
  return items.reduce((sum, binId) => sum + countForBin(bins, binId), 0);
}

const COLLAPSIBLE_SECTIONS = new Set<NavSectionKey>(["documents", "services"]);

function NavSection({
  title,
  expanded,
  onToggle,
  summary,
  collapsible = true,
  children,
}: {
  title: string;
  expanded?: boolean;
  onToggle?: () => void;
  summary?: number;
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
          {summary !== undefined && !expanded && (
            <span className="admin-nav-section-summary">{summary}</span>
          )}
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
        <AdminIcon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-medium leading-tight">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11px] leading-tight text-zinc-400">
          {description}
        </span>
      </span>
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
  onNavigate,
  embedded = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const settingsActive = pathname === "/admin/settings";
  const [expanded, setExpanded] =
    useState<Record<NavSectionKey, boolean>>(DEFAULT_EXPANDED);

  const [supportAlerts, setSupportAlerts] = useState(0);

  useEffect(() => {
    const key = sectionKeyForView(activeView);
    setExpanded((prev) => ({ ...prev, [key]: true }));
  }, [activeView]);

  useEffect(() => {
    let stop = false;
    async function loadAlerts() {
      try {
        const response = await fetch("/api/crm/support");
        if (!response.ok) return;
        const body = await response.json();
        if (!stop) setSupportAlerts(Number(body.unread) || 0);
      } catch {
        // The nav still works when the support desk is unavailable.
      }
    }
    void loadAlerts();
    const timer = window.setInterval(loadAlerts, 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [activeView]);

  const toggle = (key: NavSectionKey) => {
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Navigation
          </p>
        </div>
      ) : null}

      <nav className="space-y-3">
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
          const collapsible = COLLAPSIBLE_SECTIONS.has(key);
          return (
            <NavSection
              key={group.title}
              title={group.title}
              collapsible={collapsible}
              expanded={expanded[key]}
              onToggle={() => toggle(key)}
              summary={groupItemCount(bins, group.items)}
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
            </NavSection>
          );
        })}

        <NavSection title="Workspace" collapsible={false}>
          {CRM_NAV.map((item) => (
            <NavItem
              key={item.id}
              active={activeView === item.id}
              label={item.label}
              description={item.description}
              icon={
                item.id === "messages"
                  ? "mail"
                  : item.id === "pipeline"
                  ? "quotes"
                  : item.id === "orders"
                    ? "documents"
                    : item.id === "projects"
                      ? "folder-open"
                      : item.id === "wallet"
                        ? "credit-card"
                        : "clock"
              }
              count={item.id === "messages" && supportAlerts > 0 ? supportAlerts : undefined}
              onClick={() => navigate(() => onSelectCrm?.(item.id))}
            />
          ))}
        </NavSection>

        <NavSection title="Connect" collapsible={false}>
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
