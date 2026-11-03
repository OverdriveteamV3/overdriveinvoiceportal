import type { Metadata } from "next";
import { publicMaintenancePage } from "@/components/home/public-maintenance";
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
  searchParams: Promise<{ service?: string; plan?: string; step?: string; error?: string; stack?: string; paid?: string }>;
}) {
  const down = await publicMaintenancePage();
  if (down) return down;
  const [account, locale, params] = await Promise.all([getPortalAccount(), getLocale(), searchParams]);
  const service = QUOTE_SERVICES.has(params.service ?? "") ? params.service : undefined;
  const plan = params.plan?.trim().slice(0, 140) || undefined;
  const step = Number(params.step);
  const notice = params.error
    ? `${params.stack ? `${params.stack}: ` : ""}${params.error === "github_off" ? "GitHub sign-in is turned off for this project." : params.error === "not_configured" ? "Connection is not configured." : params.error === "plan" ? "The paid plan was not confirmed." : params.error === "mismatch" ? "That account email does not match the project Gmail." : params.error === "gmail" ? "Use a Gmail address." : "That check did not verify."}`
    : params.paid
      ? "Deposit confirmed."
      : "";
  return (
    <QuoteRequestForm
      locale={locale}
      resumeStep={step >= 1 && step <= 4 ? step : 0}
      notice={notice}
      defaults={{
        name: account?.name,
        email: account?.email,
        service,
        plan,
      }}
    />
  );
}
