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

export default function WorkflowTips({ locale, projects }: Props) {
  const es = locale === "es";
  const activeProjects = projects.filter(
    (project) => project.stage !== "cancelled" && project.stage !== "on_hold"
  );
  const actionSteps = nextClientSteps(activeProjects, 3);

  const phaseProjects = Object.fromEntries(
    PHASE_ORDER.map((id) => [
      id,
      activeProjects.filter((project) => phaseForStage(String(project.stage)) === id),
    ])
  ) as Record<PhaseId, PortalProjectCard[]>;

  const earliestCurrentIndex = (() => {
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      if (phaseProjects[PHASE_ORDER[i]].length > 0) return i;
    }
    return PHASE_ORDER.length - 1;
  })();

  function phaseState(index: number): PhaseState {
    if (phaseProjects[PHASE_ORDER[index]].length > 0) return "current";
    if (index < earliestCurrentIndex) return "done";
    return "upcoming";
  }

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

  return (
    <section className="od-roadmap od-roadmap-landscape" aria-label={es ? "Hoja de ruta" : "Delivery roadmap"}>
      <header className="od-roadmap-head">
        <div>
          <h2>{es ? "Hoja de ruta" : "Delivery roadmap"}</h2>
          <p>
            {es
              ? "Cinco fases de principio a fin — tu rol y el nuestro."
              : "Five phases start to finish — your role and ours."}
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
            {actionSteps.length === 0
              ? es
                ? "Nada pendiente de tu lado"
                : "Nothing waiting on you"
              : es
                ? `${actionSteps.length} en Preparación`
                : `${actionSteps.length} in Setup`}
          </li>
        </ul>
      </header>

      <ol className="od-roadmap-list">
        {phases.map((phase, index) => {
          const state = phaseState(index);
          const inPhase = phaseProjects[phase.id];
          const setupActions = phase.id === "setup" ? actionSteps : [];

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

                {inPhase.length > 0 ? (
                  <ul className="od-roadmap-projects">
                    {inPhase.map((project) => (
                      <li key={project.id}>{cleanName(project.name)}</li>
                    ))}
                  </ul>
                ) : null}

                {setupActions.length > 0 ? (
                  <ul className="od-roadmap-actions">
                    {setupActions.map((step) => (
                      <li key={`${step.projectId}-${step.label}`}>
                        <strong>{step.label}</strong>
                        <span>{cleanName(step.projectName)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
