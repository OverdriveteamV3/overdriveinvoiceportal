import { NextResponse } from "next/server";
import { crmClient } from "@/lib/crm/db";
import { getPortalAccount } from "@/lib/crm/portal-account";
import { parsePortalPreferences } from "@/lib/crm/portal-preferences";
import { formatClientAddress } from "@/lib/client-form";
import { ACCOUNT_CSV_COLUMNS, csvRecords, toCsv } from "@/lib/crm/portal-csv";
import { isUsState } from "@/lib/us-states";

const MAX_CSV_BYTES = 1_000_000;

function money(cents: unknown): string {
  const value = typeof cents === "number" ? cents : Number(cents);
  if (!Number.isFinite(value)) return "";
  return (value / 100).toFixed(2);
}

function asList<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dateOnly(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function cells(values: Partial<Record<(typeof ACCOUNT_CSV_COLUMNS)[number], string>>): string[] {
  return ACCOUNT_CSV_COLUMNS.map((column) => values[column] ?? "");
}

function flag(value: string): boolean | null {
  const text = value.trim().toLowerCase();
  if (text === "true" || text === "yes" || text === "1") return true;
  if (text === "false" || text === "no" || text === "0") return false;
  return null;
}

export async function GET() {
  const account = await getPortalAccount();
  if (!account) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data: memberships } = await crmClient()
    .from("portal_memberships")
    .select(
      "project_id, projects(name, stage, created_at, orders(invoices(document_number, kind, status, total_cents, currency)))"
    )
    .eq("portal_user_id", account.id);

  const accountRow = cells({
    record_type: "account",
    name: account.name,
    phone: account.phone,
    business_name: account.businessName,
    email: account.email,
    secondary_email: account.secondaryEmail,
    notify_project_status: account.preferences.notifyProjectStatus ? "true" : "false",
    notify_invoice_reminders: account.preferences.notifyInvoiceReminders ? "true" : "false",
    billing_contact_name: account.billingContactName,
    billing_business_name: account.billingBusinessName,
    billing_email: account.billingEmail,
    billing_country: account.billingCountry,
    billing_address: account.billingAddress,
    billing_street: account.billingAddressLine1,
    billing_line2: account.billingAddressLine2,
    billing_city: account.billingCity,
    billing_state: account.billingState,
    billing_postal_code: account.billingPostalCode,
  });

  const projectRows: string[][] = [];
  for (const membership of memberships ?? []) {
    const projects = asList((membership as { projects?: unknown }).projects);
    for (const project of projects) {
      const row = project as {
        name?: string;
        stage?: string;
        created_at?: string;
        orders?: { invoices?: unknown } | Array<{ invoices?: unknown }> | null;
      };
      const orders = asList(row.orders);
      const invoices = orders.flatMap((order) => asList(order?.invoices));
      const lines = invoices.length > 0 ? invoices : [null];
      for (const invoice of lines) {
        const bill = invoice as {
          document_number?: string;
          kind?: string;
          status?: string;
          total_cents?: number;
          currency?: string;
        } | null;
        projectRows.push(
          cells({
            record_type: "project",
            project_name: String(row.name ?? ""),
            project_stage: String(row.stage ?? ""),
            project_created: dateOnly(row.created_at),
            invoice_number: String(bill?.document_number ?? ""),
            invoice_kind: String(bill?.kind ?? ""),
            invoice_status: String(bill?.status ?? ""),
            invoice_total: money(bill?.total_cents),
            currency: String(bill?.currency ?? ""),
          })
        );
      }
    }
  }

  const csv = toCsv([[...ACCOUNT_CSV_COLUMNS], accountRow, ...projectRows]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="overdrive-account.csv"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const account = await getPortalAccount();
  if (!account) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a CSV file." }, { status: 400 });
  }
  if (file.size > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "That CSV is larger than 1 MB." }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (name && !name.endsWith(".csv") && file.type && file.type !== "text/csv") {
    return NextResponse.json({ error: "Choose a CSV file." }, { status: 400 });
  }

  const records = csvRecords(await file.text());
  const row =
    records.find((record) => record.record_type?.trim().toLowerCase() === "account") ??
    records.find((record) => "name" in record);
  if (!row || !("name" in row)) {
    return NextResponse.json({ error: "This CSV is missing the account columns." }, { status: 400 });
  }

  const profileName = (row.name ?? "").trim().slice(0, 100);
  const phone = (row.phone ?? account.phone).trim().slice(0, 40);
  const businessName = (row.business_name ?? account.businessName).trim().slice(0, 160);
  if (!profileName) return NextResponse.json({ error: "Add your name." }, { status: 400 });
  if (phone && !/^[0-9+().\-\s]{6,40}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const billingEmail = (row.billing_email ?? account.billingEmail).trim().toLowerCase().slice(0, 200);
  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return NextResponse.json({ error: "Enter a valid billing email." }, { status: 400 });
  }
  const state = (row.billing_state ?? account.billingState).trim().toUpperCase().slice(0, 2);
  if (state && !isUsState(state)) {
    return NextResponse.json({ error: "Choose a state." }, { status: 400 });
  }
  const postalCode = (row.billing_postal_code ?? account.billingPostalCode).trim().slice(0, 12);
  if (postalCode && !/^[A-Za-z0-9 -]{3,12}$/.test(postalCode)) {
    return NextResponse.json({ error: "Enter a valid postal code." }, { status: 400 });
  }
  const addressLine1 = (row.billing_street ?? account.billingAddressLine1).trim().slice(0, 120);
  const addressLine2 = (row.billing_line2 ?? account.billingAddressLine2).trim().slice(0, 120);
  const city = (row.billing_city ?? account.billingCity).trim().slice(0, 80);
  const billing = {
    contactName: (row.billing_contact_name ?? account.billingContactName).trim().slice(0, 120),
    businessName: (row.billing_business_name ?? account.billingBusinessName).trim().slice(0, 160),
    email: billingEmail,
    country: (row.billing_country ?? account.billingCountry).trim().slice(0, 80),
    addressLine1: addressLine1 || (row.billing_street == null ? account.billingAddress : ""),
    addressLine2,
    city,
    state,
    postalCode,
  };

  const projectStatus = flag(row.notify_project_status ?? "");
  const invoiceReminders = flag(row.notify_invoice_reminders ?? "");
  const preferences = parsePortalPreferences({
    notifyProjectStatus: projectStatus ?? account.preferences.notifyProjectStatus,
    notifyInvoiceReminders: invoiceReminders ?? account.preferences.notifyInvoiceReminders,
  });

  const { error } = await crmClient()
    .from("portal_users")
    .update({
      name: profileName,
      phone,
      business_name: businessName,
      billing_contact_name: billing.contactName,
      billing_business_name: billing.businessName,
      billing_email: billing.email,
      billing_country: billing.country,
      billing_address: formatClientAddress({
        addressLine1: billing.addressLine1,
        addressLine2: billing.addressLine2,
        city: billing.city,
        state: billing.state,
        zipCode: billing.postalCode,
      }).slice(0, 300),
      billing_address_line1: billing.addressLine1,
      billing_address_line2: billing.addressLine2,
      billing_city: billing.city,
      billing_state: billing.state,
      billing_postal_code: billing.postalCode,
      preferences,
    })
    .eq("id", account.id);
  if (error) return NextResponse.json({ error: "Could not import that CSV." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    name: profileName,
    phone,
    businessName,
    billing,
    notifyProjectStatus: preferences.notifyProjectStatus,
    notifyInvoiceReminders: preferences.notifyInvoiceReminders,
  });
}
