import Link from "next/link";
import { crmClient } from "@/lib/crm/db";
import { getPortalUserId } from "@/lib/crm/portal-session";
import { PROJECT_STAGE_LABELS, type ProjectStage } from "@/lib/crm/stages";
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

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: locale === "es" ? "Portal de clientes | Over Drive" : "Client portal | Over Drive" };
}

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [userId, locale] = await Promise.all([getPortalUserId(), getLocale()]);
  const es = locale === "es";
  if (!userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <div className="mb-4">
          <LanguageToggle locale={locale} />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">{es ? "Portal de clientes" : "Client portal"}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {error
            ? es
              ? "Ese enlace de invitación no es válido o ya se usó. Pide uno nuevo a Over Drive."
              : "That invite link is invalid or already used. Ask Over Drive for a new one."
            : es
              ? "Usa el enlace de invitación de tu correo para abrir tus proyectos."
              : "Use the invite link from your email to open your projects."}
        </p>
      </main>
    );
  }

  const supabase = crmClient();
  const { data: memberships } = await supabase
    .from("portal_memberships")
    .select("project_id, projects(id, name, stage, next_action)")
    .eq("portal_user_id", userId);

  const projects = (memberships ?? []).flatMap((row) => {
    const linked = (row as { projects?: unknown }).projects;
    const value = Array.isArray(linked) ? linked[0] : linked;
    if (!value || typeof value !== "object" || !("id" in value)) return [];
    const project = value as { id: string; name?: string; stage?: string; next_action?: string };
    return [
      {
        id: project.id,
        name: project.name ?? (es ? "Proyecto" : "Project"),
        stage: project.stage ?? "",
        next_action: project.next_action ?? "",
      },
    ];
  });

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Over Drive</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{es ? "Tus proyectos" : "Your projects"}</h1>
        </div>
        <LanguageToggle locale={locale} />
      </div>
      {projects.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">
          {es ? "Todavía no hay proyectos asignados a esta cuenta." : "No projects are assigned to this login yet."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => (
            <li key={project.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <Link href={`/portal/projects/${project.id}`} className="text-base font-medium text-zinc-900">
                {project.name}
              </Link>
              <p className="mt-1 text-sm text-zinc-600">
                {(es ? STAGE_ES[project.stage as ProjectStage] : PROJECT_STAGE_LABELS[project.stage as ProjectStage]) ?? project.stage}
                {project.next_action ? ` · ${es ? "Siguiente" : "Next"}: ${project.next_action}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
