"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import AccountMenu from "@/components/portal/AccountMenu";
import LanguageToggle from "@/components/home/LanguageToggle";
import PortalHistory from "@/components/portal/PortalHistory";
import PortalMessagesPanel from "@/components/portal/PortalMessagesPanel";
import ProjectCard from "@/components/portal/ProjectCard";
import WorkflowTips from "@/components/portal/WorkflowTips";
import {
  buildPortalAlerts,
  isCompletedProject,
  isCurrentProject,
  type PortalProjectCard,
  UI_DEMO_PROJECTS,
  UI_HISTORY_PROJECTS,
} from "@/lib/crm/portal-demo-projects";
import { formatCents } from "@/lib/crm/money";
import "./portal-dashboard.css";

type Account = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Props = {
  locale: "en" | "es";
  account: Account;
  liveProjects: PortalProjectCard[];
  hasSeededDemos: boolean;
};

export default function PortalDashboard({
  locale,
  account,
  liveProjects,
  hasSeededDemos,
}: Props) {
  const es = locale === "es";
  const [view, setView] = useState<"overview" | "history">("overview");
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [messagesTab, setMessagesTab] = useState<"alerts" | "messages">("alerts");
  const [showUiDemos, setShowUiDemos] = useState(true);
  const [seedError, setSeedError] = useState("");
  const [seedMessage, setSeedMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const projects = useMemo(() => {
    const live = liveProjects;
    if (!showUiDemos) return live;
    if (hasSeededDemos) return live;
    return [...live, ...UI_DEMO_PROJECTS];
  }, [liveProjects, showUiDemos, hasSeededDemos]);

  const historyProjects = useMemo(() => {
    const liveCompleted = liveProjects.filter(isCompletedProject);
    const liveCurrent = liveProjects.filter(isCurrentProject);
    if (!showUiDemos) return [...liveCurrent, ...liveCompleted];
    if (hasSeededDemos) {
      // Seeded demos may not include completed ones yet — keep history demos available.
      const hasCompleted = liveCompleted.length > 0;
      return hasCompleted
        ? [...liveCurrent, ...liveCompleted]
        : [...liveCurrent, ...liveCompleted, ...UI_HISTORY_PROJECTS];
    }
    return [...projects.filter(isCurrentProject), ...UI_HISTORY_PROJECTS];
  }, [liveProjects, projects, showUiDemos, hasSeededDemos]);

  const overviewProjects = useMemo(
    () => projects.filter((project) => !isCompletedProject(project)),
    [projects]
  );

  const alerts = useMemo(() => buildPortalAlerts(overviewProjects, es), [overviewProjects, es]);

  const stats = useMemo(() => {
    const active = overviewProjects.filter((project) => project.stage !== "cancelled").length;
    const needsYou = overviewProjects.reduce((count, project) => {
      return (
        count +
        project.onboardingItems.filter(
          (item) => item.required && (item.state === "requested" || item.state === "in_progress")
        ).length
      );
    }, 0);
    const checklistTotal = overviewProjects.reduce((count, project) => {
      return count + project.onboardingItems.filter((item) => item.required).length;
    }, 0);
    const updatesLeft = overviewProjects.reduce((sum, project) => {
      return sum + Math.max(0, project.revisionAllowance - project.roundsUsed);
    }, 0);
    const openBalance = overviewProjects.reduce((sum, project) => sum + project.balanceCents, 0);
    const billed = overviewProjects.reduce((sum, project) => sum + project.orderTotalCents, 0);
    const completed = historyProjects.filter(isCompletedProject).length;
    const jobTotal = active + completed;
    const share = (part: number, total: number) =>
      total > 0 ? Math.max(0, Math.min(100, Math.round((part / total) * 100))) : 0;
    return {
      active,
      needsYou,
      updatesLeft,
      openBalance,
      completed,
      jobTotal,
      checklistTotal,
      billed,
      activeShare: share(active, jobTotal),
      actionShare: share(needsYou, checklistTotal),
      balanceShare: share(openBalance, billed),
      completedShare: share(completed, jobTotal),
    };
  }, [overviewProjects, historyProjects]);

  function openMessages(tab: "alerts" | "messages") {
    setMessagesTab(tab);
    setMessagesOpen(true);
  }

  function seedDemos() {
    setSeedError("");
    setSeedMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/portal/demo-seed", { method: "POST" });
        const body = await response.json();
        if (!response.ok) {
          setSeedError(body.error || (es ? "No se pudo cargar el demo." : "Could not load demos."));
          return;
        }
        setSeedMessage(
          body.created
            ? es
              ? "Demos cargados. Recargando…"
              : "Demos loaded. Reloading…"
            : es
              ? "Demos ya listos. Recargando…"
              : "Demos already ready. Reloading…"
        );
        window.location.reload();
      } catch {
        setSeedError(es ? "No se pudo cargar el demo." : "Could not load demos.");
      }
    });
  }

  return (
    <div className="od-portal" data-theme="light">
      <div className="od-portal-shell">
        <aside className="od-portal-nav">
          <div className="od-portal-brand-row">
            <Link href="/" className="od-portal-brand" aria-label="Over Drive">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="od-portal-brand-logo"
                src="/overdrive-portal-logo.webp"
                alt="Over Drive"
              />
              <span className="od-portal-brand-copy">
                <em>{es ? "Portal de cliente" : "Client portal"}</em>
              </span>
            </Link>
          </div>

          <nav className="od-portal-nav-list" aria-label={es ? "Portal" : "Portal"}>
            <button
              type="button"
              className={view === "overview" ? "is-active" : ""}
              onClick={() => setView("overview")}
            >
              {es ? "Proyectos" : "Projects"}
            </button>
            <button
              type="button"
              className={view === "history" ? "is-active" : ""}
              onClick={() => setView("history")}
            >
              {es ? "Historial" : "History"}
            </button>
            <button type="button" onClick={() => openMessages("alerts")}>
              <span>{es ? "Mensajes" : "Messages"}</span>
              {alerts.length > 0 ? <span className="od-portal-nav-badge">{alerts.length}</span> : null}
            </button>
            <Link href="/quote" className="od-portal-start">
              {es ? "Iniciar un proyecto" : "Start a Project"}
            </Link>
          </nav>

          <div className="od-portal-nav-actions">
            <AccountMenu
              locale={locale}
              name={account.name}
              email={account.email}
              avatarUrl={account.avatarUrl}
              className="od-portal-account"
            />

            <Link href="/" className="od-portal-home">
              {es ? "Volver al sitio" : "Back to website"}
            </Link>
          </div>

          <div className="od-portal-nav-foot">
            <details className="od-portal-tools">
              <summary>{es ? "Herramientas" : "Tools"}</summary>
              <div className="od-portal-tools-body">
                <label>
                  <input
                    type="checkbox"
                    checked={showUiDemos}
                    onChange={(event) => setShowUiDemos(event.target.checked)}
                  />
                  {es ? "Demos UI" : "UI demos"}
                </label>
                <button type="button" disabled={pending} onClick={seedDemos}>
                  {pending
                    ? es
                      ? "Cargando…"
                      : "Loading…"
                    : hasSeededDemos
                      ? es
                        ? "Recargar demos CRM"
                        : "Refresh CRM demos"
                      : es
                        ? "Cargar demos CRM"
                        : "Load CRM demos"}
                </button>
              </div>
            </details>
          </div>
        </aside>

        <div className="od-portal-main">
          <div className="od-portal-topbar">
            <LanguageToggle locale={locale} />
          </div>
          <header className="od-portal-hero">
            <div className="od-portal-hero-copy">
              <p className="od-portal-eyebrow">{es ? "Espacio de trabajo" : "Workspace"}</p>
              <h1>
                {view === "history"
                  ? es
                    ? "Historial de proyectos"
                    : "Project history"
                  : es
                    ? "Resumen de entrega"
                    : "Delivery overview"}
              </h1>
              <p className="od-portal-lead">
                {view === "history"
                  ? es
                    ? "Trabajos en curso, entregas cerradas y movimientos de saldo en un solo lugar."
                    : "Current jobs, closed deliveries, and balance activity in one place."
                  : es
                    ? "Estado de entrega, avance de onboarding, actualizaciones incluidas y saldo pendiente."
                    : "Delivery status, onboarding progress, included updates, and open balance."}
              </p>
            </div>
            <div className="od-portal-stats" aria-label={es ? "Resumen" : "Summary"}>
              <div className="od-portal-stat">
                <div
                  className="od-stat-ring is-jobs"
                  style={{ "--p": `${stats.activeShare}%` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span>{stats.activeShare}%</span>
                </div>
                <div className="od-portal-stat-copy">
                  <span className="od-portal-stat-label">{es ? "Activos" : "Active jobs"}</span>
                  <strong>{stats.active}</strong>
                  <em>
                    {stats.jobTotal > 0
                      ? es
                        ? `${stats.active} de ${stats.jobTotal} trabajos`
                        : `${stats.active} of ${stats.jobTotal} jobs`
                      : es
                        ? "En curso"
                        : "In delivery"}
                  </em>
                </div>
              </div>
              <div className="od-portal-stat">
                <div
                  className="od-stat-ring is-action"
                  style={{ "--p": `${stats.actionShare}%` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span>{stats.actionShare}%</span>
                </div>
                <div className="od-portal-stat-copy">
                  <span className="od-portal-stat-label">{es ? "Acción" : "Action needed"}</span>
                  <strong>{stats.needsYou}</strong>
                  <em>
                    {stats.checklistTotal > 0
                      ? es
                        ? `${stats.needsYou} de ${stats.checklistTotal} pasos`
                        : `${stats.needsYou} of ${stats.checklistTotal} steps`
                      : es
                        ? "Pasos pendientes"
                        : "Open checklist items"}
                  </em>
                </div>
              </div>
              <div className="od-portal-stat">
                <div
                  className="od-stat-ring is-balance"
                  style={{ "--p": `${stats.balanceShare}%` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span>{stats.balanceShare}%</span>
                </div>
                <div className="od-portal-stat-copy">
                  <span className="od-portal-stat-label">{es ? "Saldo" : "Open balance"}</span>
                  <strong>{formatCents(stats.openBalance)}</strong>
                  <em>
                    {stats.billed > 0
                      ? es
                        ? `${stats.balanceShare}% de ${formatCents(stats.billed)}`
                        : `${stats.balanceShare}% of ${formatCents(stats.billed)}`
                      : es
                        ? "Por cobrar"
                        : "Outstanding"}
                  </em>
                </div>
              </div>
              <div className="od-portal-stat">
                <div
                  className="od-stat-ring is-done"
                  style={{ "--p": `${stats.completedShare}%` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span>{stats.completedShare}%</span>
                </div>
                <div className="od-portal-stat-copy">
                  <span className="od-portal-stat-label">{es ? "Completados" : "Completed"}</span>
                  <strong>{stats.completed}</strong>
                  <em>
                    {stats.jobTotal > 0
                      ? es
                        ? `${stats.completed} de ${stats.jobTotal} trabajos`
                        : `${stats.completed} of ${stats.jobTotal} jobs`
                      : es
                        ? "Histórico"
                        : "All time"}
                  </em>
                </div>
              </div>
            </div>
          </header>

          <div className="od-portal-tabs" role="tablist" aria-label={es ? "Vistas" : "Views"}>
            <button
              type="button"
              role="tab"
              aria-selected={view === "overview"}
              className={view === "overview" ? "is-active" : ""}
              onClick={() => setView("overview")}
            >
              {es ? "Entrega" : "Delivery"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "history"}
              className={view === "history" ? "is-active" : ""}
              onClick={() => setView("history")}
            >
              {es ? "Historial de proyectos" : "Project history"}
            </button>
          </div>

          {seedError ? <p className="od-portal-flash is-error">{seedError}</p> : null}
          {seedMessage ? <p className="od-portal-flash is-ok">{seedMessage}</p> : null}

          {view === "overview" ? (
            <div className="od-portal-overview">
              <WorkflowTips locale={locale} projects={overviewProjects} />
              <section className="od-portal-list" aria-label={es ? "Lista de proyectos" : "Project list"}>
                {overviewProjects.length === 0 ? (
                  <div className="od-portal-empty">
                    {es
                      ? "Aún no hay proyectos. Abre Herramientas para activar demos."
                      : "No projects yet. Open Tools to enable demos."}
                  </div>
                ) : (
                  overviewProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} locale={locale} />
                  ))
                )}
              </section>
            </div>
          ) : (
            <PortalHistory locale={locale} projects={historyProjects} />
          )}
        </div>
      </div>

      <PortalMessagesPanel
        locale={locale}
        open={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        alerts={alerts}
        defaultName={account.name}
        defaultEmail={account.email}
        initialTab={messagesTab}
      />
    </div>
  );
}
