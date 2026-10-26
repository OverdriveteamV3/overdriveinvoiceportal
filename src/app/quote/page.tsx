import type { Metadata } from "next";
import QuoteRequestForm from "@/components/home/QuoteRequestForm";
import { getPortalAccount } from "@/lib/crm/portal-account";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? {
        title: "Pedir una cotización | Over Drive",
        description: "Cuéntale a Over Drive tu proyecto, plazo y presupuesto.",
      }
    : {
        title: "Request a quote | Over Drive",
        description: "Tell Over Drive about your project, timeline, and budget.",
      };
}

const QUOTE_SERVICES = new Set([
  "Website Development",
  "Dashboards & CRMs",
  "Apps & Software",
  "UI/UX & Branding",
]);

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; plan?: string }>;
}) {
  const [account, locale, params] = await Promise.all([getPortalAccount(), getLocale(), searchParams]);
  const service = QUOTE_SERVICES.has(params.service ?? "") ? params.service : undefined;
  const plan = params.plan?.trim().slice(0, 140) || undefined;
  return (
    <QuoteRequestForm
      locale={locale}
      defaults={{
        name: account?.name,
        email: account?.email,
        service,
        plan,
      }}
    />
  );
}
