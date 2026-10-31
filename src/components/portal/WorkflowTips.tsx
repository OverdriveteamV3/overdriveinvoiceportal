import type { PortalProjectCard } from "@/lib/crm/portal-demo-projects";
import { nextClientSteps } from "@/lib/crm/portal-demo-projects";

type Props = {
  locale: "en" | "es";
  projects: PortalProjectCard[];
};

type PhaseId = "setup" | "build" | "review" | "launch" | "live";
type PhaseState = "done" | "current" | "upcoming";

const PHASE_STAGES: Record<PhaseId, string[]> = {
  setup: ["awaiting_onboarding", "ready_for_kickoff"],
  build: ["scheduled", "design", "development", "internal_qa"],
  review: ["client_review", "revisions"],
  launch: ["awaiting_final_payment", "ready_to_launch"],
  live: ["delivered", "support"],
};

const PHASE_ORDER: PhaseId[] = ["setup", "build", "review", "launch", "live"];

function phaseForStage(stage: string): PhaseId | null {
  for (const id of PHASE_ORDER) {
    if (PHASE_STAGES[id].includes(stage)) return id;
  }
  return null;
}

function cleanName(name: string) {
  return name.replace(/^\[Demo\]\s*/i, "");
}

function formatCreated(value: string, locale: "en" | "es") {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function stateFor(index: number, currentIndex: number): PhaseState {
  if (currentIndex < 0) return "upcoming";
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export default function WorkflowTips({ locale, projects }: Props) {
  const es = locale === "es";
  const activeProjects = projects.filter(
    (project) => project.stage !== "cancelled" && project.stage !== "on_hold"
  );

  const phases: Array<{
    id: PhaseId;
    title: string;
    client: string;
    us: string;
  }> = es
    ? [
        {
          id: "setup",
          title: "Preparación",
          client: "Firma, depósito y materiales.",
          us: "Confirmamos alcance y arranque.",
        },
        {
          id: "build",
          title: "Construcción",
          client: "Espera; responde si pedimos algo.",
          us: "Diseñamos y desarrollamos.",
        },
        {
          id: "review",
          title: "Tu revisión",
          client: "Revisa y usa actualizaciones.",
          us: "Aplicamos comentarios.",
        },
        {
          id: "launch",
          title: "Lanzamiento",
          client: "Pago final y go-live.",
          us: "Publicamos y entregamos.",
        },
        {
          id: "live",
          title: "En vivo",
          client: "Usa el producto; pide soporte.",
          us: "Mantenimiento disponible.",
        },
      ]
    : [
        {
          id: "setup",
          title: "Setup",
          client: "Sign, deposit, share materials.",
          us: "We lock scope and kickoff.",
        },
        {
          id: "build",
          title: "Build",
          client: "Sit tight; reply if asked.",
          us: "We design and develop.",
        },
        {
          id: "review",
          title: "Your review",
          client: "Review and use updates.",
          us: "We apply your feedback.",
        },
        {
          id: "launch",
          title: "Launch",
          client: "Final payment and go-live.",
          us: "We publish and hand off.",
        },
        {
          id: "live",
          title: "Live",
          client: "Use it; ask for support.",
          us: "Maintenance available.",
        },
      ];

  const stateLabel: Record<PhaseState, string> = es
    ? { done: "Listo", current: "Ahora", upcoming: "Próximo" }
    : { done: "Done", current: "Now", upcoming: "Next" };

  const jobs = activeProjects.map((project) => {
    const phaseId = phaseForStage(String(project.stage));
    const currentIndex = phaseId ? PHASE_ORDER.indexOf(phaseId) : -1;
    return {
      project,
      currentIndex,
      steps: nextClientSteps([project], 8),
    };
  });

  return (
    <section className="od-roadmap" aria-label={es ? "Hojas de ruta" : "Delivery roadmaps"}>
      <header className="od-roadmap-head">
        <div>
          <h2>{es ? "Hojas de ruta" : "Delivery roadmaps"}</h2>
          <p>
            {es
              ? "Cada trabajo tiene su propia ruta. Ábrela para ver tu rol y el nuestro."
              : "Each job has its own roadmap. Open one to see your role and ours."}
          </p>
        </div>
        <ul className="od-roadmap-legend-inline" aria-label={es ? "Leyenda" : "Legend"}>
          <li>
            <span className="od-roadmap-legend-mark is-current" />
            {es ? "Ahora" : "Now"}
          </li>
          <li>
            <span className="od-roadmap-legend-mark is-done" />
            {es ? "Listo" : "Done"}
          </li>
          <li>
            <span className="od-roadmap-legend-mark is-upcoming" />
            {es ? "Próximo" : "Next"}
          </li>
          <li className="od-roadmap-legend-actions">
            {jobs.length === 0
              ? es
                ? "Sin trabajos activos"
                : "No active jobs"
              : es
                ? `${jobs.length} ${jobs.length === 1 ? "trabajo" : "trabajos"}`
                : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}`}
          </li>
        </ul>
      </header>

      {jobs.length === 0 ? (
        <p className="od-roadmap-empty">
          {es
            ? "Las rutas aparecen cuando hay un trabajo activo."
            : "Roadmaps appear when a job is active."}
        </p>
      ) : (
        <div className="od-roadmap-jobs">
          {jobs.map(({ project, currentIndex, steps }) => {
            const currentPhase = currentIndex >= 0 ? phases[currentIndex] : null;
            const createdLabel = formatCreated(project.createdAt, locale);
            return (
              <details key={project.id} className="od-roadmap-job">
                <summary>
                  <span className="od-roadmap-job-title">
                    <span className="od-roadmap-job-name">{cleanName(project.name)}</span>
                    {createdLabel ? (
                      <time className="od-roadmap-job-date" dateTime={project.createdAt}>
                        {createdLabel}
                      </time>
                    ) : null}
                  </span>
                  <span className="od-roadmap-job-phase">
                    {currentPhase
                      ? `${currentPhase.title} · ${stateLabel.current}`
                      : es
                        ? "Sin fase"
                        : "No phase"}
                    {steps.length > 0
                      ? es
                        ? ` · ${steps.length} pendientes`
                        : ` · ${steps.length} waiting`
                      : ""}
                  </span>
                  <span className="od-roadmap-mini" aria-hidden="true">
                    {PHASE_ORDER.map((id, index) => (
                      <i key={id} className={`is-${stateFor(index, currentIndex)}`} />
                    ))}
                  </span>
                  <span className="od-roadmap-chevron" aria-hidden="true" />
                </summary>

                <ol className="od-roadmap-list">
                  {phases.map((phase, index) => {
                    const state = stateFor(index, currentIndex);
                    const setupActions = phase.id === "setup" ? steps : [];

                    return (
                      <li key={phase.id} className={`od-roadmap-phase is-${state}`}>
                        <div className="od-roadmap-rail" aria-hidden="true">
                          <span className="od-roadmap-dot">{index + 1}</span>
                        </div>
                        <div className="od-roadmap-body">
                          <div className="od-roadmap-title-row">
                            <h3>{phase.title}</h3>
                            <span className="od-roadmap-state">{stateLabel[state]}</span>
                          </div>

                          <dl className="od-roadmap-roles">
                            <div>
                              <dt>{es ? "Tú" : "You"}</dt>
                              <dd>{phase.client}</dd>
                            </div>
                            <div>
                              <dt>Over Drive</dt>
                              <dd>{phase.us}</dd>
                            </div>
                          </dl>

                          {setupActions.length > 0 ? (
                            <ul className="od-roadmap-actions">
                              {setupActions.map((step) => (
                                <li key={`${step.projectId}-${step.label}`}>
                                  <strong>{step.label}</strong>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
