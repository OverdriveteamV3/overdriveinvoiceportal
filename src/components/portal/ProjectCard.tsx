"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { PortalProjectCard } from "@/lib/crm/portal-demo-projects";
import { formatCents } from "@/lib/crm/money";
import { revisionMeter } from "@/lib/crm/revisions";
import { onboardingPercent, PROJECT_STAGE_LABELS, type ProjectStage } from "@/lib/crm/stages";

const PAY_PERCENTS = [25, 50, 75, 100] as const;

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

const KIND_ES: Record<string, string> = {
  deposit: "Deposit",
  milestone: "Milestone",
  final: "Final",
  change: "Change order",
};

const KIND_LABEL_ES: Record<string, string> = {
  deposit: "Depósito",
  milestone: "Hito",
  final: "Final",
  change: "Cambio",
};

const STATUS_ES: Record<string, string> = {
  issued: "Due",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  draft: "Draft",
};

const STATUS_LABEL_ES: Record<string, string> = {
  issued: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
  overdue: "Vencida",
  void: "Anulada",
  draft: "Borrador",
};

const STATE_LABEL: Record<string, { en: string; es: string }> = {
  complete: { en: "Complete", es: "Completo" },
  requested: { en: "Requested", es: "Solicitado" },
  in_progress: { en: "In progress", es: "En curso" },
  not_requested: { en: "Not started", es: "Sin iniciar" },
  not_applicable: { en: "N/A", es: "N/A" },
};

type Props = {
  project: PortalProjectCard;
  locale: "en" | "es";
};

function canPayInvoice(status: string) {
  return status !== "paid" && status !== "void" && status !== "draft";
}

export default function ProjectCard({ project, locale }: Props) {
  const es = locale === "es";
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payPercent, setPayPercent] = useState<(typeof PAY_PERCENTS)[number]>(50);
  const panelId = useId();
  const payPanelId = useId();
  const progress = onboardingPercent(project.onboardingItems);
  const meter = revisionMeter(project.roundsUsed, project.revisionAllowance);
  const stageLabel =
    (es ? STAGE_ES[project.stage] : PROJECT_STAGE_LABELS[project.stage as ProjectStage]) ??
    project.stage;
  const cleanName = project.name.replace(/^\[Demo\]\s*/i, "");
  const paidPercent =
    project.orderTotalCents > 0
      ? Math.min(100, Math.round((project.paidCents / project.orderTotalCents) * 100))
      : 0;
  const checklistPreview = project.onboardingItems.filter(
    (item) => item.required && item.state !== "not_applicable"
  );
  const unpaidInvoices = project.invoices.filter((invoice) => canPayInvoice(invoice.status));
  const primaryUnpaid = unpaidInvoices[0] ?? null;
  const openBalance = Math.max(0, project.balanceCents);
  const hasOpenBalance = openBalance > 0 && unpaidInvoices.length > 0;
  const payTargetCents = Math.min(
    primaryUnpaid?.totalCents ?? 0,
    Math.round((openBalance * payPercent) / 100)
  );

  function openPayPortal() {
    setOpen(true);
    setPayOpen(true);
  }

  function payHref(amountCents: number) {
    if (!primaryUnpaid || project.demo) return null;
    const capped = Math.min(amountCents, primaryUnpaid.totalCents);
    if (capped < 50) return null;
    return `/api/portal/invoices/${primaryUnpaid.id}/pay?amountCents=${capped}`;
  }

  return (
    <article className={`od-project-shell${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="od-project"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <div className="od-project-kicker">
            <span className="od-project-stage">{stageLabel}</span>
            {project.demo ? <span className="od-project-demo">Demo</span> : null}
          </div>
          <h3>{cleanName}</h3>
          {project.nextAction ? (
            <p className="od-project-next">
              <strong>{es ? "Siguiente" : "Next"}:</strong> {project.nextAction}
              {project.nextActionDue ? ` · ${project.nextActionDue}` : ""}
            </p>
          ) : null}
        </div>

        <div className="od-project-metrics">
          <div className="od-project-metric od-project-metric-progress">
            <div className="od-project-metric-head">
              <span>{es ? "Checklist" : "Checklist"}</span>
              <strong>{progress.percent}%</strong>
            </div>
            <div className="od-project-metric-bar">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <p>
              {es
                ? `${progress.complete} de ${progress.total} pasos listos`
                : `${progress.complete} of ${progress.total} steps done`}
            </p>
          </div>

          <div className="od-project-metric od-project-metric-updates">
            <div className="od-project-metric-head">
              <span>{es ? "Revisiones" : "Revisions"}</span>
              <strong>
                {meter.remaining}
                <small>/{meter.allowance}</small>
              </strong>
            </div>
            <div className="od-project-metric-slots">
              {meter.segments.map((used, index) => (
                <span
                  key={index}
                  className={used ? "is-used" : "is-available"}
                  title={
                    used
                      ? es
                        ? `Ronda ${index + 1} usada`
                        : `Round ${index + 1} used`
                      : es
                        ? `Ronda ${index + 1} disponible`
                        : `Round ${index + 1} available`
                  }
                />
              ))}
            </div>
            <p>
              {es
                ? `${meter.remaining} incluidas restantes`
                : `${meter.remaining} included remaining`}
            </p>
          </div>
        </div>

        <span className="od-project-chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <div id={panelId} className="od-project-panel">
          <div className="od-project-kpi">
            <div>
              <span>{es ? "Checklist" : "Checklist"}</span>
              <strong>
                {progress.complete}/{progress.total}
              </strong>
              <em>{progress.percent}%</em>
              <div className="od-project-kpi-bar">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
            <div>
              <span>{es ? "Pagado" : "Paid"}</span>
              <strong>{formatCents(project.paidCents, project.currency)}</strong>
              <em>{paidPercent}%</em>
              <div className="od-project-kpi-bar is-paid">
                <span style={{ width: `${paidPercent}%` }} />
              </div>
            </div>
            {hasOpenBalance ? (
              <button
                type="button"
                className={`od-project-kpi-pay${payOpen ? " is-active" : ""}`}
                aria-expanded={payOpen}
                aria-controls={payPanelId}
                onClick={openPayPortal}
              >
                <span>{es ? "Saldo" : "Balance due"}</span>
                <strong>{formatCents(openBalance, project.currency)}</strong>
                <em>{es ? "Pagar con Stripe →" : "Pay with Stripe →"}</em>
              </button>
            ) : (
              <div>
                <span>{es ? "Saldo" : "Balance due"}</span>
                <strong>{formatCents(project.balanceCents, project.currency)}</strong>
                <em>
                  {project.orderNumber
                    ? `${es ? "Pedido" : "Order"} ${project.orderNumber}`
                    : "—"}
                </em>
              </div>
            )}
            <div>
              <span>{es ? "Actualizaciones" : "Updates left"}</span>
              <strong>
                {meter.remaining}/{meter.allowance}
              </strong>
              <em>{es ? "Incluidas" : "Included"}</em>
            </div>
          </div>

          {payOpen && hasOpenBalance ? (
            <section id={payPanelId} className="od-stripe-portal" aria-label={es ? "Pago Stripe" : "Stripe payment"}>
              <header className="od-stripe-portal-head">
                <div>
                  <p className="od-stripe-portal-eyebrow">Stripe</p>
                  <h4>{es ? "Pagar saldo abierto" : "Pay open balance"}</h4>
                  <p>
                    {es
                      ? "Elige qué porcentaje del saldo quieres pagar ahora."
                      : "Choose what percent of the open balance to pay now."}
                  </p>
                </div>
                <button type="button" className="od-stripe-portal-close" onClick={() => setPayOpen(false)}>
                  {es ? "Cerrar" : "Close"}
                </button>
              </header>

              <div className="od-stripe-portal-summary">
                <div>
                  <span>{es ? "Saldo abierto" : "Open balance"}</span>
                  <strong>{formatCents(openBalance, project.currency)}</strong>
                </div>
                <div>
                  <span>{es ? "Vas a pagar" : "You’ll pay"}</span>
                  <strong>{formatCents(payTargetCents, project.currency)}</strong>
                </div>
                <div>
                  <span>{es ? "Restará" : "Left after"}</span>
                  <strong>{formatCents(Math.max(0, openBalance - payTargetCents), project.currency)}</strong>
                </div>
              </div>

              <div className="od-stripe-percent" role="tablist" aria-label={es ? "Porcentaje" : "Percent"}>
                {PAY_PERCENTS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    role="tab"
                    aria-selected={payPercent === percent}
                    className={payPercent === percent ? "is-active" : ""}
                    onClick={() => setPayPercent(percent)}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              {project.demo ? (
                <p className="od-stripe-portal-demo">
                  {es
                    ? "Demo: elige un % para previsualizar el importe. Stripe se abre en proyectos reales."
                    : "Demo: pick a % to preview the amount. Stripe opens on live projects."}
                </p>
              ) : payHref(payTargetCents) ? (
                <a className="od-stripe-portal-cta" href={payHref(payTargetCents)!}>
                  {es
                    ? `Pagar ${formatCents(payTargetCents, project.currency)} con Stripe`
                    : `Pay ${formatCents(payTargetCents, project.currency)} with Stripe`}
                </a>
              ) : (
                <p className="od-stripe-portal-demo">
                  {es
                    ? "El importe seleccionado es demasiado bajo para Stripe."
                    : "Selected amount is too low for Stripe checkout."}
                </p>
              )}
            </section>
          ) : null}

          <div className="od-project-details-grid">
            <section>
              <header className="od-project-section-head">
                <h4>{es ? "Estado del proyecto" : "Project status"}</h4>
                <p>{es ? "Controlado desde el panel de administración" : "Controlled from the admin dashboard"}</p>
              </header>
              <table className="od-project-table">
                <thead>
                  <tr>
                    <th scope="col">{es ? "Elemento" : "Item"}</th>
                    <th scope="col">{es ? "Estado" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistPreview.map((item) => (
                    <tr key={item.label} data-state={item.state}>
                      <td>{item.label}</td>
                      <td>
                        <span className={`od-project-status od-project-status-${item.state}`}>
                          {STATE_LABEL[item.state]?.[es ? "es" : "en"] ?? item.state.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="od-project-pay">
              <header className="od-project-section-head">
                <h4>{es ? "Facturación" : "Billing"}</h4>
                <p>
                  {es
                    ? "Resumen del proyecto y pagos con Stripe"
                    : "Project total and Stripe payments"}
                </p>
              </header>

              <dl className="od-project-billing">
                <div>
                  <dt>{es ? "Precio del proyecto" : "Project price"}</dt>
                  <dd>{formatCents(project.orderTotalCents, project.currency)}</dd>
                </div>
                <div>
                  <dt>{es ? "Pagado" : "Paid to date"}</dt>
                  <dd>{formatCents(project.paidCents, project.currency)}</dd>
                </div>
                <div>
                  <dt>{es ? "Saldo pendiente" : "Outstanding balance"}</dt>
                  <dd>{formatCents(project.balanceCents, project.currency)}</dd>
                </div>
              </dl>

              {hasOpenBalance ? (
                <button type="button" className="od-project-pay-open" onClick={openPayPortal}>
                  {es ? "Abrir portal de pago Stripe" : "Open Stripe payment portal"}
                </button>
              ) : null}

              <table className="od-project-table">
                <thead>
                  <tr>
                    <th scope="col">{es ? "Factura" : "Invoice"}</th>
                    <th scope="col">{es ? "Tipo" : "Type"}</th>
                    <th scope="col">{es ? "Estado" : "Status"}</th>
                    <th scope="col">{es ? "Importe" : "Amount"}</th>
                    <th scope="col">{es ? "Acción" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {project.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5}>{es ? "Todavía no hay facturas." : "No invoices issued yet."}</td>
                    </tr>
                  ) : (
                    project.invoices.map((invoice) => {
                      const payable = canPayInvoice(invoice.status);
                      return (
                        <tr key={invoice.id}>
                          <td>{invoice.documentNumber}</td>
                          <td>
                            {es
                              ? KIND_LABEL_ES[invoice.kind] ?? invoice.kind
                              : KIND_ES[invoice.kind] ?? invoice.kind}
                          </td>
                          <td>
                            <span className={`od-project-status od-project-status-${invoice.status}`}>
                              {es
                                ? STATUS_LABEL_ES[invoice.status] ?? invoice.status
                                : STATUS_ES[invoice.status] ?? invoice.status}
                            </span>
                          </td>
                          <td>{formatCents(invoice.totalCents, invoice.currency)}</td>
                          <td>
                            {payable ? (
                              project.demo ? (
                                <button
                                  type="button"
                                  className="od-project-pay-btn"
                                  onClick={openPayPortal}
                                >
                                  {es ? "Demo" : "Demo"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="od-project-pay-btn"
                                  onClick={openPayPortal}
                                >
                                  {es ? "Pagar" : "Pay"}
                                </button>
                              )
                            ) : invoice.status === "paid" ? (
                              <span className="od-project-pay-done">{es ? "Pagada" : "Paid"}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {!project.demo && project.balanceCents > 0 ? (
                <p className="od-project-pay-note">
                  {es
                    ? "Los pagos se procesan de forma segura con Stripe."
                    : "Payments are processed securely with Stripe."}
                </p>
              ) : null}
            </section>
          </div>

          {project.href ? (
            <div className="od-project-panel-actions">
              <Link href={project.href}>{es ? "Ver proyecto completo" : "View full project"}</Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
