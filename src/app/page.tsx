import OverDriveHome from "@/components/home/OverDriveHome";
import { getPortalAccount } from "@/lib/crm/portal-account";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata() {
  const locale = await getLocale();
  return locale === "es"
    ? {
        title: "Inicio | Over Drive",
        description: "Sitios web, paneles, CRMs y software a medida de Over Drive.",
      }
    : {
        title: "Home | Over Drive",
        description: "Websites, dashboards, CRMs, and custom software from Over Drive.",
      };
}

export default async function Home() {
  const [locale, account] = await Promise.all([getLocale(), getPortalAccount()]);
  return (
    <OverDriveHome
      locale={locale}
      account={
        account
          ? { name: account.name, email: account.email, avatarUrl: account.avatarUrl }
          : null
      }
    />
  );
}
