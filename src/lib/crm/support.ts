import { createOpportunity, crmClient } from "@/lib/crm/db";

export const SUPPORT_COOKIE = "overdrive-support-chat";

export type SupportAuthor = "visitor" | "admin";

export type SupportChatMessage = {
  id: string;
  author: SupportAuthor;
  body: string;
  createdAt: string;
};

type MessageRow = {
  id: string;
  author: SupportAuthor;
  body: string;
  created_at: string;
};

function mapMessage(row: MessageRow): SupportChatMessage {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getSupportOnline() {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("support_desk")
    .select("online")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.online);
}

export async function setSupportOnline(online: boolean) {
  const supabase = crmClient();
  const { error } = await supabase.from("support_desk").upsert({
    id: "default",
    online,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

async function messagesForThread(threadId: string) {
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("support_messages")
    .select("id, author, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export async function readVisitorThread(token: string | null) {
  const online = await getSupportOnline();
  if (!token) return { online, name: "", email: "", messages: [] as SupportChatMessage[] };
  const supabase = crmClient();
  const { data, error } = await supabase
    .from("support_threads")
    .select("id, name, email")
    .eq("visitor_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { online, name: "", email: "", messages: [] as SupportChatMessage[] };
  return {
    online,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    messages: await messagesForThread(data.id),
  };
}

export async function postVisitorMessage(input: {
  token: string;
  name: string;
  email: string;
  message: string;
  ip: string;
}) {
  const online = await getSupportOnline();
  const name = input.name.trim().slice(0, 100);
  const email = input.email.trim().slice(0, 200);
  const message = input.message.trim().slice(0, 2000);
  if (!name || message.length < 2) {
    throw new Error("Add your name and a message.");
  }
  if (email && !email.includes("@")) {
    throw new Error("Enter a valid email, or leave it blank while we are online.");
  }
  if (!online && !email.includes("@")) {
    throw new Error("Add your email so we can reply while support is offline.");
  }

  const supabase = crmClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("author", "visitor")
    .eq("ip_address", input.ip)
    .gte("created_at", since);
  if ((count ?? 0) >= 30) {
    throw new Error("Too many messages from this network. Please try again later.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("support_threads")
    .select("id, name, email, opportunity_id")
    .eq("visitor_token", input.token)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  let threadId = existing?.id as string | undefined;
  let opportunityId = (existing?.opportunity_id as string | null) ?? null;
  const nextName = name || String(existing?.name ?? "");
  const nextEmail = email || String(existing?.email ?? "");

  if (!threadId) {
    const { data: created, error } = await supabase
      .from("support_threads")
      .insert({
        visitor_token: input.token,
        name: nextName,
        email: nextEmail,
        ip_address: input.ip,
        admin_unread: true,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not start the chat.");
    threadId = created.id;
  } else {
    const { error } = await supabase
      .from("support_threads")
      .update({
        name: nextName,
        email: nextEmail,
        admin_unread: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId);
    if (error) throw new Error(error.message);
  }

  const { error: messageError } = await supabase.from("support_messages").insert({
    thread_id: threadId,
    author: "visitor",
    body: message,
    ip_address: input.ip,
  });
  if (messageError) throw new Error(messageError.message);

  if (!opportunityId) {
    try {
      const created = await createOpportunity({
        profileId: "master",
        actor: "website",
        displayName: nextName,
        email: nextEmail,
        title: "Support chat",
        description: message,
        source: "website",
        landingPage: "/",
        preferredContact: online ? "Chat" : "Email",
        nextAction: online ? "Reply in the support chat" : "Reply to the support message",
      });
      opportunityId = created.opportunityId;
      await supabase
        .from("support_threads")
        .update({ opportunity_id: opportunityId })
        .eq("id", threadId);
    } catch (error) {
      console.error("Support lead was not created:", error);
    }
  }

  if (!threadId) throw new Error("Could not start the chat.");

  return {
    online,
    name: nextName,
    email: nextEmail,
    messages: await messagesForThread(threadId),
  };
}

export async function listSupportDesk() {
  const supabase = crmClient();
  const online = await getSupportOnline();
  const { data, error } = await supabase
    .from("support_threads")
    .select("id, name, email, admin_unread, updated_at, support_messages(id, author, body, created_at)")
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);

  const threads = (data ?? []).map((thread) => {
    const rows = Array.isArray(thread.support_messages)
      ? (thread.support_messages as MessageRow[])
      : [];
    const messages = rows
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(mapMessage);
    return {
      id: thread.id as string,
      name: String(thread.name ?? ""),
      email: String(thread.email ?? ""),
      unread: Boolean(thread.admin_unread),
      updatedAt: String(thread.updated_at),
      messages,
    };
  });

  return {
    online,
    unread: threads.filter((thread) => thread.unread).length,
    threads,
  };
}

export async function replyToSupportThread(threadId: string, body: string) {
  const message = body.trim().slice(0, 2000);
  if (message.length < 1) throw new Error("Write a reply first.");
  const supabase = crmClient();
  const { data: thread, error: threadError } = await supabase
    .from("support_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) throw new Error(threadError.message);
  if (!thread) throw new Error("That conversation was not found.");

  const { error } = await supabase.from("support_messages").insert({
    thread_id: threadId,
    author: "admin",
    body: message,
  });
  if (error) throw new Error(error.message);
  await supabase
    .from("support_threads")
    .update({ admin_unread: false, updated_at: new Date().toISOString() })
    .eq("id", threadId);
}

export async function markSupportThreadRead(threadId: string) {
  const supabase = crmClient();
  const { error } = await supabase
    .from("support_threads")
    .update({ admin_unread: false })
    .eq("id", threadId);
  if (error) throw new Error(error.message);
}
