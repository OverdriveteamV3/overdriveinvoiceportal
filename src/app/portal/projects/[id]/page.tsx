import { notFound, redirect } from "next/navigation";
import { crmClient } from "@/lib/crm/db";
import { formatCents } from "@/lib/crm/money";
import { revisionMeter } from "@/lib/crm/revisions";
import { getPortalUserId } from "@/lib/crm/portal-session";
import { ONBOARDING_TEMPLATE, onboardingPercent, PROJECT_STAGE_LABELS, type ProjectStage } from "@/lib/crm/stages";
import { submitPortalRevision } from "@/app/portal/projects/[id]/actions";
import { getLocale } from "@/lib/get-locale";
import LanguageToggle from "@/components/home/LanguageToggle";

const STAGE_ES: Record<ProjectStage, string> = {
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

const ITEM_ES: Record<string, string> = {
  "Accepted quote": "Cotización aceptada",
  "Signed agreement": "Acuerdo firmado",
  "Confirmed required deposit": "Depósito requerido confirmado",
  "Primary client contact": "Contacto principal",
  "Goals and success criteria": "Metas y criterios de éxito",
  "Logo and brand assets": "Logo y archivos de marca",
  "Website copy and images": "Textos e imágenes del sitio",
  "Domain and hosting access": "Acceso al dominio y al hosting",
  "Integration access": "Acceso a integraciones",
  "Delivery milestones": "Hitos de entrega",
  "Communication expectations": "Expectativas de comunicación",
  "Kickoff appointment": "Cita de arranque",
};

const STATE_ES: Record<string, string> = {
  complete: "completo",
  requested: "solicitado",
  not_requested: "no solicitado",
  not_applicable: "no aplica",
  draft: "borrador",
  submitted: "enviado",
  clarification_needed: "falta aclarar",
  accepted: "aceptado",
  in_progress: "en curso",
  delivered: "entregado",
  closed: "cerrado",
  rejected: "rechazado",
  withdrawn: "retirado",
  duplicate: "duplicado",
};

const INVOICE_KIND_ES: Record<string, string> = {
  deposit: "depósito",
  milestone: "hito",
  final: "final",
  change: "cambio",
};

const INVOICE_STATUS_ES: Record<string, string> = {
  issued: "emitida",
  partial: "parcial",
  paid: "pagada",
  overdue: "vencida",
  void: "anulada",
};

type Params = { params: Promise<{ id: string }> };

export default async function PortalProjectPage({ params }: Params) {
  const { id } = await params;
  const [userId, locale] = await Promise.all([getPortalUserId(), getLocale()]);
  if (!userId) redirect("/portal");
  const es = locale === "es";

  const supabase = crmClient();
  const { data: membership } = await supabase
    .from("portal_memberships")
    .select("project_id")
    .eq("portal_user_id", userId)
    .eq("project_id", id)
    .maybeSingle();
  if (!membership) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, stage, next_action, next_action_due, revision_allowance, rounds_used, order_id, onboarding_items(label, required, state, due_on)")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, currency, document_number")
    .eq("id", project.order_id)
    .maybeSingle();

  const { data: invoices } = order
    ? await supabase
        .from("invoices")
        .select("id, document_number, kind, status, total_cents, currency")
        .eq("order_id", order.id)
        .neq("status", "draft")
    : { data: [] };

  const { data: rounds } = await supabase
    .from("revision_rounds")
    .select("id, title, state, kind")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: files } = await supabase
    .from("crm_files")
    .select("id, name")
    .eq("project_id", id)
    .eq("visibility", "client");

  const meter = revisionMeter(project.rounds_used, project.revision_allowance);
  const checklist = onboardingPercent(project.onboarding_items ?? []);
  const stage = (es ? STAGE_ES[project.stage as ProjectStage] : PROJECT_STAGE_LABELS[project.stage as ProjectStage]) ?? project.stage;
  const revisionHeading = es
    ? `Revisiones incluidas: ${Math.min(meter.used, meter.allowance)} de ${meter.allowance} usadas`
    : meter.label;
  const revisionDetails = ["Tres restantes", "Dos restantes", "Una restante", "Rondas incluidas usadas"];
  const revisionDetail = es ? revisionDetails[Math.min(meter.used, meter.allowance)] ?? "Rondas incluidas usadas" : meter.detail;
  const labelFor = (label: string) => {
    const known = ONBOARDING_TEMPLATE.find((item) => item.label === label);
    return es && known ? ITEM_ES[known.label] ?? label : label;
  };
  const stateFor = (state: string) => (es ? STATE_ES[state] ?? state.replaceAll("_", " ") : state.replaceAll("_", " "));

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-8 px-6 py-10">
      <div>
        <div className="flex items-start justify-between gap-4">
          <a href="/portal" className="text-sm text-zinc-500">{es ? "Todos los proyectos" : "All projects"}</a>
          <LanguageToggle locale={locale} />
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{project.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {stage}
          {project.next_action ? ` · ${es ? "Siguiente" : "Next"}: ${project.next_action}` : ""}
          {project.next_action_due ? ` · ${es ? "Vence" : "Due"} ${project.next_action_due}` : ""}
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">{es ? "Inicio" : "Onboarding"}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {es
            ? `${checklist.complete} de ${checklist.total} elementos requeridos listos (${checklist.percent}%)`
            : `${checklist.complete} of ${checklist.total} required items complete (${checklist.percent}%)`}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-700">
          {(project.onboarding_items ?? []).map((item) => (
            <li key={item.label}>
              {labelFor(item.label)}: {stateFor(item.state)}
              {item.required ? "" : es ? " (opcional)" : " (optional)"}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">{revisionHeading}</h2>
        <p className="text-sm text-zinc-600">{revisionDetail}</p>
        <div className="mt-3 flex gap-2" aria-label={revisionHeading}>
          {meter.segments.map((used, index) => (
            <div
              key={index}
              className={`h-3 flex-1 rounded ${used ? "bg-zinc-900" : "bg-zinc-200"}`}
            />
          ))}
        </div>
        {meter.exhausted ? (
          <p className="mt-3 text-sm text-zinc-600">
            {es
              ? "Las rondas incluidas ya se usaron. Aún puedes pedir un estimado para cambios adicionales."
              : "Included rounds are used. You can still request an estimate for additional changes."}
          </p>
        ) : null}
        <form action={submitPortalRevision} className="mt-4 space-y-2">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="block text-sm text-zinc-700" htmlFor="revision-title">
            {es ? "Solicitud de revisión" : "Revision request"}
          </label>
          <input id="revision-title" name="title" required className="field w-full" placeholder={es ? "¿Qué debemos revisar?" : "What should we review?"} />
          <textarea name="body" required className="field min-h-24 w-full" placeholder={es ? "Un conjunto de comentarios dentro del alcance" : "One consolidated set of in-scope feedback"} />
          <button className="btn" type="submit">{es ? "Enviar solicitud" : "Submit request"}</button>
        </form>
        <ul className="mt-4 space-y-1 text-sm text-zinc-600">
          {(rounds ?? []).map((round) => (
            <li key={round.id}>{round.title} · {stateFor(round.state)}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">{es ? "Facturas" : "Invoices"}</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {(invoices ?? []).map((invoice) => (
            <li key={invoice.id}>
              {invoice.document_number} · {es ? INVOICE_KIND_ES[invoice.kind] ?? invoice.kind : invoice.kind} · {es ? INVOICE_STATUS_ES[invoice.status] ?? invoice.status : invoice.status} · {formatCents(invoice.total_cents, invoice.currency)}
              {invoice.status !== "paid" && invoice.status !== "void" ? (
                <>
                  {" "}
                  <a className="underline" href={`/api/portal/invoices/${invoice.id}/pay`}>
                    {es ? "Pagar" : "Pay"}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        {order ? (
          <p className="mt-2 text-sm text-zinc-600">
            {es ? "Pedido" : "Order"} {order.document_number}: {formatCents(order.total_cents, order.currency)}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">{es ? "Archivos" : "Files"}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(files ?? []).map((file) => (
            <li key={file.id}>
              <a className="text-zinc-900 underline" href={`/api/portal/files/${file.id}`}>{file.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
