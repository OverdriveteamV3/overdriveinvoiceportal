import Link from "next/link";
import {
  buildBalanceHistory,
  isCompletedProject,
  isCurrentProject,
  type PortalProjectCard,
} from "@/lib/crm/portal-demo-projects";
import { formatCents } from "@/lib/crm/money";
import { PROJECT_STAGE_LABELS, type ProjectStage } from "@/lib/crm/stages";

const STAGE_ES: Record<string, string> = {
  awaiting_onboarding: "Esperando el inicio",
  ready_for_kickoff: "Listo para arrancar",
  scheduled: "Programado",
  design: "Diseño",
  development: "Desarrollo",
  internal_qa: "Control interno",
  client_review: "Revisión del cliente",
  revisions: "Revisiones",
  awaiting_final_payment: "Esperando el pago final",
  ready_to_launch: "Listo para lanzar",
  delivered: "Entregado",
  support: "Soporte",
  on_hold: "En pausa",
  cancelled: "Cancelado",
};

type Props = {
  locale: "en" | "es";
  projects: PortalProjectCard[];
};

export default function PortalHistory({ locale, projects }: Props) {
  const es = locale === "es";
  const current = projects.filter(isCurrentProject);
  const completed = projects.filter(isCompletedProject);
  const ledger = buildBalanceHistory(projects);
  const totalBilled = projects.reduce((sum, project) => sum + project.orderTotalCents, 0);
  const totalPaid = projects.reduce((sum, project) => sum + project.paidCents, 0);
  const totalBalance = projects.reduce((sum, project) => sum + project.balanceCents, 0);

  function stageLabel(stage: string) {
    return (es ? STAGE_ES[stage] : PROJECT_STAGE_LABELS[stage as ProjectStage]) ?? stage;
  }

  function cleanName(name: string) {
    return name.replace(/^\[Demo\]\s*/i, "");
  }

  return (
    <div className="od-history">
      <section className="od-history-summary" aria-label={es ? "Totales" : "Totals"}>
        <div>
          <span>{es ? "Facturado" : "Billed"}</span>
          <strong>{formatCents(totalBilled)}</strong>
        </div>
        <div>
          <span>{es ? "Cobrado" : "Collected"}</span>
          <strong>{formatCents(totalPaid)}</strong>
        </div>
        <div>
          <span>{es ? "Saldo abierto" : "Open balance"}</span>
          <strong>{formatCents(totalBalance)}</strong>
        </div>
        <div>
          <span>{es ? "Completados" : "Completed"}</span>
          <strong>{completed.length}</strong>
        </div>
      </section>

      <div className="od-history-grid">
        <section className="od-history-panel">
          <header>
            <h2>{es ? "Trabajos actuales" : "Current jobs"}</h2>
            <p>{es ? "Engagements en curso" : "Engagements in progress"}</p>
          </header>
          {current.length === 0 ? (
            <p className="od-history-empty">{es ? "No hay trabajos actuales." : "No current jobs."}</p>
          ) : (
            <table className="od-history-table">
              <thead>
                <tr>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>{es ? "Estado" : "Stage"}</th>
                  <th>{es ? "Precio" : "Price"}</th>
                  <th>{es ? "Saldo" : "Balance"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {current.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {cleanName(project.name)}
                      {project.demo ? <em className="od-history-demo">Demo</em> : null}
                    </td>
                    <td>{stageLabel(String(project.stage))}</td>
                    <td>{formatCents(project.orderTotalCents, project.currency)}</td>
                    <td>{formatCents(project.balanceCents, project.currency)}</td>
                    <td>
                      {project.href ? (
                        <Link href={project.href}>{es ? "Ver" : "View"}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="od-history-panel">
          <header>
            <h2>{es ? "Trabajos completados" : "Completed jobs"}</h2>
            <p>{es ? "Entregas cerradas" : "Past delivered work"}</p>
          </header>
          {completed.length === 0 ? (
            <p className="od-history-empty">
              {es ? "Todavía no hay trabajos completados." : "No completed jobs yet."}
            </p>
          ) : (
            <table className="od-history-table">
              <thead>
                <tr>
                  <th>{es ? "Proyecto" : "Project"}</th>
                  <th>{es ? "Estado" : "Stage"}</th>
                  <th>{es ? "Total" : "Total"}</th>
                  <th>{es ? "Pagado" : "Paid"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {completed.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {cleanName(project.name)}
                      {project.demo ? <em className="od-history-demo">Demo</em> : null}
                    </td>
                    <td>{stageLabel(String(project.stage))}</td>
                    <td>{formatCents(project.orderTotalCents, project.currency)}</td>
                    <td>{formatCents(project.paidCents, project.currency)}</td>
                    <td>
                      {project.href ? (
                        <Link href={project.href}>{es ? "Ver" : "View"}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="od-history-panel">
        <header>
          <h2>{es ? "Historial de saldos" : "Balance history"}</h2>
          <p>
            {es
              ? "Cargos y pagos registrados por factura"
              : "Invoice charges and recorded payments"}
          </p>
        </header>
        {ledger.length === 0 ? (
          <p className="od-history-empty">
            {es ? "Todavía no hay movimientos." : "No balance activity yet."}
          </p>
        ) : (
          <table className="od-history-table">
            <thead>
              <tr>
                <th>{es ? "Proyecto" : "Project"}</th>
                <th>{es ? "Documento" : "Document"}</th>
                <th>{es ? "Tipo" : "Type"}</th>
                <th>{es ? "Movimiento" : "Entry"}</th>
                <th>{es ? "Importe" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.projectName}</td>
                  <td>{entry.documentNumber}</td>
                  <td>{entry.kind}</td>
                  <td>
                    <span
                      className={`od-history-tag ${
                        entry.direction === "payment" ? "is-payment" : "is-charge"
                      }`}
                    >
                      {entry.direction === "payment"
                        ? es
                          ? "Pago"
                          : "Payment"
                        : es
                          ? "Cargo"
                          : "Charge"}
                    </span>
                  </td>
                  <td>
                    {entry.direction === "payment" ? "−" : "+"}
                    {formatCents(entry.amountCents, entry.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
