import type { PortalAlert } from "@/lib/crm/portal-demo-projects";

export function portalDecisionAlerts(
  notes: Array<{ id: string; body: string }>,
  es: boolean
): PortalAlert[] {
  const alerts: PortalAlert[] = [];
  for (const note of notes) {
    const [head, ...rest] = note.body.split("\n");
    const accepted = head.startsWith("[portal:accepted] ");
    const declined = head.startsWith("[portal:declined] ");
    if (!accepted && !declined) continue;
    const title = head.slice(head.indexOf("] ") + 2).trim() || (es ? "tu solicitud" : "your request");
    const memo = rest.join("\n").trim();
    alerts.push(
      accepted
        ? {
            id: note.id,
            tone: "info",
            title: es ? "Solicitud aceptada" : "Request accepted",
            body: es ? `Aceptamos “${title}”.` : `We accepted “${title}”.`,
          }
        : {
            id: note.id,
            tone: "urgent",
            title: es ? "Solicitud rechazada" : "Request declined",
            body: memo
              ? es
                ? `“${title}” no siguió. ${memo}`
                : `“${title}” did not move forward. ${memo}`
              : es
                ? `“${title}” no siguió.`
                : `“${title}” did not move forward.`,
          }
    );
  }
  return alerts;
}
