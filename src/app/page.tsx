import OverDriveHome from "@/components/home/OverDriveHome";
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
  const locale = await getLocale();
  return <OverDriveHome locale={locale} />;
}
