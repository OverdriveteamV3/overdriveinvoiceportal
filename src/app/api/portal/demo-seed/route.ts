import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import {
  DEMO_PROJECT_NAME_PREFIX,
  SEED_DEMO_SPECS,
} from "@/lib/crm/portal-demo-projects";
import { ONBOARDING_TEMPLATE } from "@/lib/crm/stages";
import { getPortalUserId } from "@/lib/crm/portal-session";

export async function POST() {
  const portalUserId = await getPortalUserId();
  if (!portalUserId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const supabase = crmClient();
    const { data: portalUser, error: userError } = await supabase
      .from("portal_users")
      .select("id, client_id, email, name")
      .eq("id", portalUserId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!portalUser?.client_id) {
      return NextResponse.json({ error: "Portal account not found." }, { status: 404 });
    }

    const { data: existingMemberships } = await supabase
      .from("portal_memberships")
      .select("project_id, projects(id, name)")
      .eq("portal_user_id", portalUserId);

    const existingDemoNames = new Set(
      (existingMemberships ?? []).flatMap((row) => {
        const linked = (row as { projects?: unknown }).projects;
        const value = Array.isArray(linked) ? linked[0] : linked;
        if (!value || typeof value !== "object" || !("name" in value)) return [];
        const name = String((value as { name?: string }).name ?? "");
        return name.startsWith(DEMO_PROJECT_NAME_PREFIX) ? [name] : [];
      })
    );

    const missing = SEED_DEMO_SPECS.filter((spec) => !existingDemoNames.has(spec.title));
    if (missing.length === 0) {
      return NextResponse.json({ created: false, count: existingDemoNames.size });
    }

    let created = 0;
    for (const spec of missing) {
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .insert({
          client_id: portalUser.client_id,
          profile_id: "master",
          title: spec.title,
          service_interest: "Website Development",
          description: "Portal dashboard demo project for backtesting.",
          source: "manual",
          stage: "closed_won",
          owner_profile_id: "master",
        })
        .select("id")
        .single();
      if (oppError || !opportunity) throw new Error(oppError?.message ?? "Opportunity failed.");

      const { data: quote, error: quoteError } = await supabase
        .from("quote_versions")
        .insert({
          opportunity_id: opportunity.id,
          version_number: 1,
          snapshot: { demo: true, title: spec.title },
          total_cents: 250000,
          tax_cents: 0,
          currency: "usd",
          deposit_type: "percent",
          deposit_percent: 50,
          deposit_cents: 125000,
          revision_allowance: 3,
          scope_summary: "Demo scope",
        })
        .select("id")
        .single();
      if (quoteError || !quote) throw new Error(quoteError?.message ?? "Quote failed.");

      const { data: acceptance, error: acceptError } = await supabase
        .from("quote_acceptances")
        .insert({
          quote_version_id: quote.id,
          actor: portalUser.email || "portal-demo",
          ip_address: "portal-demo",
          user_agent: "portal-demo-seed",
        })
        .select("id")
        .single();
      if (acceptError || !acceptance) throw new Error(acceptError?.message ?? "Acceptance failed.");

      const { data: docNumber, error: docError } = await supabase.rpc("crm_next_document_number", {
        p_prefix: "QTE",
      });
      if (docError) throw new Error(docError.message);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          quote_acceptance_id: acceptance.id,
          opportunity_id: opportunity.id,
          profile_id: "master",
          status: "active",
          total_cents: 250000,
          tax_cents: 0,
          currency: "usd",
          deposit_type: "percent",
          deposit_required_cents: 125000,
          document_number: String(docNumber ?? `DEMO-${spec.key}`),
        })
        .select("id")
        .single();
      if (orderError || !order) throw new Error(orderError?.message ?? "Order failed.");

      const { data: projectId, error: openError } = await supabase.rpc("crm_open_project", {
        p_order_id: order.id,
      });
      if (openError) throw new Error(openError.message);
      const id = typeof projectId === "string" ? projectId : null;
      if (!id) throw new Error("Project was not created.");

      await supabase
        .from("projects")
        .update({
          stage: spec.stage,
          next_action: spec.nextAction,
          next_action_due: spec.nextActionDue,
          rounds_used: spec.roundsUsed,
          name: spec.title,
        })
        .eq("id", id);

      const { data: items } = await supabase
        .from("onboarding_items")
        .select("id, item_key")
        .eq("project_id", id);

      for (const item of items ?? []) {
        const state = spec.itemStates[item.item_key];
        if (!state) continue;
        await supabase
          .from("onboarding_items")
          .update({
            state,
            completed_at: state === "complete" ? new Date().toISOString() : null,
          })
          .eq("id", item.id);
      }

      // Ensure any template keys missing from seed states stay as created by RPC.
      void ONBOARDING_TEMPLATE;

      const { error: membershipError } = await supabase.from("portal_memberships").upsert({
        portal_user_id: portalUserId,
        project_id: id,
      });
      if (membershipError) throw new Error(membershipError.message);
      created += 1;
    }

    return NextResponse.json({ created: true, count: created });
  } catch (error) {
    console.error("[portal/demo-seed]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not seed demos." },
      { status: 500 }
    );
  }
}
