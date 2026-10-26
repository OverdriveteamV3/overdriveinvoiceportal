import { NextResponse } from "next/server";
import { claimNotification, crmClient } from "@/lib/crm/db";
import { sendPlainEmail } from "@/lib/invoice-email-server";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = crmClient();
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  const { data: followUps } = await supabase
    .from("opportunities")
    .select("id, title, clients(email, display_name)")
    .eq("stage", "quote_sent")
    .lte("follow_up_on", today)
    .is("archived_at", null);

  for (const row of followUps ?? []) {
    const client = (row as { clients?: { email?: string; display_name?: string } }).clients;
    const email = client?.email?.trim();
    if (!email) continue;
    const claimed = await claimNotification("quote-follow-up", row.id);
    if (!claimed) continue;
    try {
      await sendPlainEmail({
        to: email,
        subject: `Following up on ${row.title}`,
        text: `Hi ${client?.display_name || "there"},\n\nWe are following up on your quote. Reply to this email if you have questions.\n\nOver Drive`,
      });
      sent += 1;
    } catch (error) {
      await supabase.from("notification_sends").delete().eq("kind", "quote-follow-up").eq("entity_key", row.id);
      console.error(error);
    }
  }

  const { data: overdue } = await supabase
    .from("invoices")
    .select("id, document_number, orders(opportunities(clients(email, display_name)))")
    .eq("kind", "final")
    .eq("status", "overdue");

  for (const row of overdue ?? []) {
    const client = (
      row as {
        orders?: { opportunities?: { clients?: { email?: string; display_name?: string } } };
      }
    ).orders?.opportunities?.clients;
    const email = client?.email?.trim();
    if (!email) continue;
    const week = today.slice(0, 7);
    const key = `${row.id}:${week}`;
    const claimed = await claimNotification("final-overdue", key);
    if (!claimed) continue;
    try {
      await sendPlainEmail({
        to: email,
        subject: `Invoice ${row.document_number} is overdue`,
        text: `Hi ${client?.display_name || "there"},\n\nInvoice ${row.document_number} is still outstanding. Reply if you need a new payment link.\n\nOver Drive`,
      });
      sent += 1;
    } catch (error) {
      await supabase.from("notification_sends").delete().eq("kind", "final-overdue").eq("entity_key", key);
      console.error(error);
    }
  }

  const { data: missing } = await supabase
    .from("onboarding_items")
    .select("id, label, due_on, projects(name, orders(opportunities(clients(email, display_name))))")
    .eq("required", true)
    .in("state", ["not_requested", "requested", "in_progress"])
    .not("due_on", "is", null)
    .lte("due_on", today);

  for (const row of missing ?? []) {
    const client = (
      row as {
        projects?: {
          name?: string;
          orders?: { opportunities?: { clients?: { email?: string; display_name?: string } } };
        };
      }
    ).projects?.orders?.opportunities?.clients;
    const email = client?.email?.trim();
    if (!email) continue;
    const claimed = await claimNotification("onboarding-due", row.id);
    if (!claimed) continue;
    try {
      await sendPlainEmail({
        to: email,
        subject: "Materials still needed",
        text: `Hi ${client?.display_name || "there"},\n\nWe still need: ${row.label}. Reply when it is ready.\n\nOver Drive`,
      });
      sent += 1;
    } catch (error) {
      await supabase.from("notification_sends").delete().eq("kind", "onboarding-due").eq("entity_key", row.id);
      console.error(error);
    }
  }

  return NextResponse.json({ sent, sms: "off" });
}
