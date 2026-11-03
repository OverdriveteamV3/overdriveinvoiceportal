export const TEAM_ROLES = [
  {
    id: "admin",
    label: "Admin",
    access: "Full access to the platform.",
  },
  {
    id: "agent",
    label: "Agent",
    access:
      "Pipeline, invoices, quotes, and the rest of the work an agent needs to execute jobs and process orders.",
  },
  {
    id: "tech",
    label: "Tech",
    access:
      "For I.T. and subcontractors who add APIs, change settings, and update the system.",
  },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["id"];

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  createdAt: string;
};
