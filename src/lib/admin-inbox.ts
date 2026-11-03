import { MASTER_PROFILE_ID } from "@/lib/admin-auth-constants";
import { crmClient, isCrmEnabled } from "@/lib/crm/db";
import { listSupportDesk } from "@/lib/crm/support";

export type InboxItem = {
  id: string;
  title: string;
  detail: string;
  body: string;
  when: string;
};

export type AdminInbox = {
  support: InboxItem[];
  emails: InboxItem[];
  contactForms: InboxItem[];
  alerts: InboxItem[];
};

const EMPTY: AdminInbox = {
  support: [],
  emails: [],
  contactForms: [],
  alerts: [],
};

type QuoteRow = {
  id: string;
  title: string;
  description: string;
  preferred_contact: string;
  campaign: string;
  stage: string;
  created_at: string;
  clients: { display_name?: string; company_name?: string; email?: string } | { display_name?: string; company_name?: string; email?: string }[] | null;
};

function clientOf(row: QuoteRow) {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return {
    name: client?.display_name?.trim() || "Website visitor",
    company: client?.company_name?.trim() || "",
    email: client?.email?.trim() || "",
  };
}

export async function getAdminInbox(): Promise<AdminInbox> {
  if (!isCrmEnabled()) return EMPTY;

  try {
    const supabase = crmClient();
    const [desk, quotesResult, signupsResult] = await Promise.all([
      listSupportDesk(),
      supabase
        .from("opportunities")
        .select("id, title, description, preferred_contact, campaign, stage, created_at, clients(display_name, company_name, email)")
        .eq("profile_id", MASTER_PROFILE_ID)
        .eq("source", "website")
        .eq("landing_page", "/quote")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("portal_users")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    if (quotesResult.error) throw new Error(quotesResult.error.message);
    const quotes = (quotesResult.data ?? []) as QuoteRow[];

    const support: InboxItem[] = desk.threads.map((thread) => {
      const latest = thread.messages.at(-1);
      return {
        id: thread.id,
        title: thread.name || "Visitor",
        detail: thread.email || "Home chat",
        body: latest?.body || "No message yet.",
        when: latest?.createdAt || thread.updatedAt,
      };
    });

    const emails: InboxItem[] = quotes
      .filter((row) => clientOf(row).email)
      .map((row) => {
        const client = clientOf(row);
        const request = row.campaign?.trim() || "Quote request";
        return {
          id: row.id,
          title: client.name,
          detail: client.email,
          body: [request, row.title, row.description?.trim()].filter(Boolean).join("\n"),
          when: row.created_at,
        };
      });

    const contactForms: InboxItem[] = quotes.map((row) => {
      const client = clientOf(row);
      return {
        id: row.id,
        title: client.name,
        detail: row.campaign?.trim() || "Contact form",
        body: [row.title, client.company, client.email, row.description?.trim()].filter(Boolean).join("\n"),
        when: row.created_at,
      };
    });

    const quoteAlerts: InboxItem[] = quotes
      .filter((row) => row.stage === "new_lead")
      .map((row) => {
        const client = clientOf(row);
        const request = row.campaign?.trim() || "New quote request";
        return {
          id: `quote-${row.id}`,
          title: request,
          detail: client.name,
          body: [row.title, client.email, row.description?.trim()].filter(Boolean).join("\n") || "New website request",
          when: row.created_at,
        };
      });

    const signupAlerts: InboxItem[] = signupsResult.error
      ? []
      : ((signupsResult.data ?? []) as Array<{ id: string; name?: string; email?: string; created_at: string }>).map(
          (user) => ({
            id: `signup-${user.id}`,
            title: "New client signup",
            detail: user.name?.trim() || user.email || "Client",
            body: user.email || "A client created a portal account.",
            when: user.created_at,
          })
        );

    const alerts = [...quoteAlerts, ...signupAlerts].sort(
      (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
    );

    return { support, emails, contactForms, alerts };
  } catch {
    return EMPTY;
  }
}
