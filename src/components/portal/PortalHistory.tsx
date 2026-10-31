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

type JobRow = {
  id: string;
  name: string;
  demo: boolean;
  stage: string;
  primary: string;
  secondary: string;
  href: string | null;
};

function JobList({
  title,
  empty,
  columns,
  rows,
}: {
  title: string;
  empty: string;
  columns: { project: string; stage: string; primary: string; secondary: string };
  rows: JobRow[];
}) {
  return (
    <section className="od-history-panel">
      <header className="od-history-panel-head">
        <h2>{title}</h2>
        <span>{rows.length}</span>
      </header>
      {rows.length === 0 ? (
        <p className="od-history-empty">{empty}</p>
      ) : (
        <>
          <div className="od-history-line od-history-line-label" aria-hidden="true">
            <span>{columns.project}</span>
            <span>{columns.stage}</span>
            <span>{columns.primary}</span>
            <span>{columns.secondary}</span>
          </div>
          <ul className="od-history-rows">
            {rows.map((row) => {
              const body = (
                <>
                  <span className="od-history-name">
                    <span>{row.name}</span>
                    {row.demo ? <em className="od-history-demo">Demo</em> : null}
                  </span>
                  <span className="od-history-stage">{row.stage}</span>
                  <span className="od-history-money">{row.primary}</span>
                  <span className="od-history-money">{row.secondary}</span>
                </>
              );
              return (
                <li key={row.id}>
                  {row.href ? (
                    <Link className="od-history-line" href={row.href}>
                      {body}
                    </Link>
                  ) : (
                    <div className="od-history-line">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default function PortalHistory({ locale, projects }: Props) {
  const es = locale === "es";
  const current = projects.filter(isCurrentProject);
  const completed = projects.filter(isCompletedProject);
  const ledger = buildBalanceHistory(projects);
  const totalBilled = projects.reduce((sum, project) => sum + project.orderTotalCents, 0);
  const totalPaid = projects.reduce((sum, project) => sum + project.paidCents, 0);
  const totalBalance = projects.reduce((sum, project) => sum + project.balanceCents, 0);
  const moneyTotal = Math.max(totalBilled, totalPaid + totalBalance);
  const collectedPct = moneyTotal > 0 ? (totalPaid / moneyTotal) * 100 : 0;
  const openPct = moneyTotal > 0 ? (totalBalance / moneyTotal) * 100 : 0;

  function stageLabel(stage: string) {
    return (es ? STAGE_ES[stage] : PROJECT_STAGE_LABELS[stage as ProjectStage]) ?? stage;
  }

  function cleanName(name: string) {
    return name.replace(/^\[Demo\]\s*/i, "");
  }

  return (
    <div className="od-history">
      <section className="od-history-summary" aria-label={es ? "Totales" : "Totals"}>
        <div className="od-history-meter">
          <header className="od-history-meter-head">
            <div>
              <span>{es ? "Facturado" : "Billed"}</span>
              <strong>{formatCents(totalBilled)}</strong>
            </div>
            <div className="od-history-meter-done">
              <i className="is-done" aria-hidden="true" />
              <span>{es ? "Completados" : "Completed"}</span>
              <strong>{completed.length}</strong>
            </div>
          </header>
          <div
            className="od-history-meter-track"
            role="img"
            aria-label={
              es
                ? `${formatCents(totalPaid)} cobrado, ${formatCents(totalBalance)} abierto`
                : `${formatCents(totalPaid)} collected, ${formatCents(totalBalance)} open`
            }
          >
            <span className="is-collected" style={{ width: `${collectedPct}%` }} />
            <span className="is-open" style={{ width: `${openPct}%` }} />
          </div>
          <ul className="od-history-meter-legend">
            <li>
              <i className="is-collected" aria-hidden="true" />
              <span>{es ? "Cobrado" : "Collected"}</span>
              <strong>{formatCents(totalPaid)}</strong>
            </li>
            <li>
              <i className="is-open" aria-hidden="true" />
              <span>{es ? "Saldo abierto" : "Open balance"}</span>
              <strong>{formatCents(totalBalance)}</strong>
            </li>
          </ul>
        </div>
      </section>

      <div className="od-history-grid">
        <JobList
          title={es ? "Trabajos actuales" : "Current jobs"}
          empty={es ? "No hay trabajos actuales." : "No current jobs."}
          columns={{
            project: es ? "Proyecto" : "Project",
            stage: es ? "Estado" : "Stage",
            primary: es ? "Precio" : "Price",
            secondary: es ? "Saldo" : "Balance",
          }}
          rows={current.map((project) => ({
            id: project.id,
            name: cleanName(project.name),
            demo: project.demo,
            stage: stageLabel(String(project.stage)),
            primary: formatCents(project.orderTotalCents, project.currency),
            secondary: formatCents(project.balanceCents, project.currency),
            href: project.href,
          }))}
        />
        <JobList
          title={es ? "Trabajos completados" : "Completed jobs"}
          empty={es ? "Todavía no hay trabajos completados." : "No completed jobs yet."}
          columns={{
            project: es ? "Proyecto" : "Project",
            stage: es ? "Estado" : "Stage",
            primary: es ? "Total" : "Total",
            secondary: es ? "Pagado" : "Paid",
          }}
          rows={completed.map((project) => ({
            id: project.id,
            name: cleanName(project.name),
            demo: project.demo,
            stage: stageLabel(String(project.stage)),
            primary: formatCents(project.orderTotalCents, project.currency),
            secondary: formatCents(project.paidCents, project.currency),
            href: project.href,
          }))}
        />
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
