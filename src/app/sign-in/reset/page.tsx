import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/home/ResetPasswordForm";
import { getLocale } from "@/lib/get-locale";
import { readPortalResetToken } from "@/lib/crm/portal-session";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? { title: "Restablecer contraseña | Over Drive" }
    : { title: "Reset password | Over Drive" };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const es = locale === "es";
  const parsed = readPortalResetToken(params.token);

  if (!parsed || !params.token) {
    return (
      <div className="account-page">
        <header className="account-header">
          <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"} className="account-brand">
            <img src="/overdrive-logo.webp" alt="Over Drive" width={340} height={68} />
          </Link>
        </header>
        <main>
          <div className="account-panel">
            <div className="account-copy">
              <p className="account-kicker">{es ? "Portal de clientes" : "Client portal"}</p>
              <h1>{es ? "Enlace caducado." : "Link expired."}</h1>
              <p className="account-intro">
                {es
                  ? "Este enlace de restablecimiento no es válido o ya caducó. Solicita uno nuevo desde Entrar."
                  : "This reset link is invalid or expired. Request a new one from Sign in."}
              </p>
            </div>
            <Link className="account-button" href="/sign-in">
              {es ? "Volver a entrar" : "Back to sign in"}
            </Link>
          </div>
        </main>
        <style>{`
          .account-page {
            min-height: 100vh;
            background: #f3f5f7;
            color: #151f24;
            font-family: Arial, Helvetica, sans-serif;
          }
          .account-page * { box-sizing: border-box; }
          .account-header {
            display: flex;
            justify-content: center;
            margin-bottom: 36px;
            padding-top: 48px;
          }
          .account-brand img {
            width: min(340px, 72vw);
            height: auto;
            display: block;
          }
          .account-page main {
            width: min(480px, calc(100% - 40px));
            margin: 0 auto;
            padding-bottom: 72px;
          }
          .account-panel {
            padding: 36px 32px 40px;
            border: 1px solid #e7ebef;
            border-radius: 16px;
            background: #fff;
          }
          .account-copy {
            display: grid;
            gap: 12px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e7ebef;
          }
          .account-kicker {
            margin: 0;
            color: #006edb;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .account-page h1 {
            margin: 0;
            font-family: Impact, "Arial Narrow", sans-serif;
            font-size: clamp(40px, 8vw, 52px);
            font-weight: 400;
            line-height: 0.95;
          }
          .account-intro {
            margin: 4px 0 0;
            padding: 0 0 0 14px;
            border-left: 3px solid #0780f7;
            color: #3f505a;
            font-size: 15px;
            line-height: 1.5;
          }
          .account-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 50px;
            margin-top: 24px;
            border-radius: 10px;
            background: #0780f7;
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  return <ResetPasswordForm token={params.token} email={parsed.email} locale={locale} />;
}
