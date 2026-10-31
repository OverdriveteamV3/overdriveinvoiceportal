import Link from "next/link";
import { redirect } from "next/navigation";
import AccountMenu from "@/components/portal/AccountMenu";
import LanguageToggle from "@/components/home/LanguageToggle";
import PortalSettingsForm from "@/components/portal/PortalSettingsForm";
import { getPortalAccount } from "@/lib/crm/portal-account";
import { getLocale } from "@/lib/get-locale";
import "@/components/portal/portal-dashboard.css";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: locale === "es" ? "Ajustes | Over Drive" : "Settings | Over Drive",
  };
}

export default async function PortalSettingsPage() {
  const [account, locale] = await Promise.all([getPortalAccount(), getLocale()]);
  if (!account) redirect("/sign-in?next=/portal/settings");
  const es = locale === "es";

  return (
    <div className="od-portal">
      <div className="od-portal-shell">
        <aside className="od-portal-nav">
          <div className="od-portal-brand-row">
            <Link href="/" className="od-portal-brand" aria-label="Over Drive">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="od-portal-brand-logo"
                src="/overdrive-portal-logo.webp"
                alt="Over Drive"
              />
              <span className="od-portal-brand-copy">
                <em>{es ? "Portal de cliente" : "Client portal"}</em>
              </span>
            </Link>
          </div>

          <nav className="od-portal-nav-list" aria-label={es ? "Portal" : "Portal"}>
            <Link href="/portal">{es ? "Proyectos" : "Projects"}</Link>
            <Link href="/quote" className="od-portal-start">
              {es ? "Iniciar un proyecto" : "Start a Project"}
            </Link>
          </nav>

          <div className="od-portal-nav-actions">
            <AccountMenu
              locale={locale}
              name={account.name}
              email={account.email}
              avatarUrl={account.avatarUrl}
              className="od-portal-account"
            />

            <Link href="/" className="od-portal-home">
              {es ? "Volver al sitio" : "Back to website"}
            </Link>
          </div>
        </aside>

        <div className="od-portal-main">
          <div className="od-portal-topbar">
            <LanguageToggle locale={locale} />
          </div>
          <header className="od-portal-hero" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <h1>{es ? "Ajustes." : "Settings."}</h1>
              <p>
                {es
                  ? "Actualiza cómo aparece tu cuenta en el portal."
                  : "Update how your account appears in the portal."}
              </p>
            </div>
          </header>

          <section className="od-portal-panel" style={{ maxWidth: 560 }}>
            <PortalSettingsForm
              locale={locale}
              name={account.name}
              email={account.email}
              avatarUrl={account.avatarUrl}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
