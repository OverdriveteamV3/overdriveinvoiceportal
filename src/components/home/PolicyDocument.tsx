import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import type { Locale } from "@/lib/locale";

import type { PolicySection } from "@/lib/policy-docs";

export default function PolicyDocument({
  title,
  locale = "en",
  sections,
}: {
  title: string;
  locale?: Locale;
  sections: PolicySection[];
}) {
  const es = locale === "es";
  const contents = sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.heading);

  return (
    <div className="policy-page">
      <div className="policy-sheet">
        <header className="policy-header">
          <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"}>
            <img src="/overdrive-logo.webp" alt="Over Drive" />
          </Link>
          <span className="policy-header-links">
            <LanguageToggle locale={locale} />
            <Link href="/" className="policy-back">
              {es ? "Volver al inicio" : "Back to Home"}
            </Link>
          </span>
        </header>

        <section className="policy-hero">
          <p className="policy-kicker">{es ? "Políticas" : "Policies"}</p>
          <h1>{title}</h1>
          <p className="policy-updated">
            {es ? "Publicado el 25 de octubre de 2026" : "Posted October 25, 2026"}
          </p>
        </section>

        <div className="policy-layout">
          <aside>
            <p>{es ? "En esta página" : "On this page"}</p>
            <nav aria-label={es ? "Secciones" : "Sections"}>
              {contents.map(({ section, index }) => (
                <a
                  key={section.heading}
                  href={`#policy-${index}`}
                  className={section.part ? "policy-contents-part" : undefined}
                >
                  {section.heading}
                </a>
              ))}
            </nav>
          </aside>

          <article>
            {sections.map((section, index) => {
              const part = section.part;
              return (
                <section
                  key={section.heading || section.paragraphs[0]}
                  id={section.heading ? `policy-${index}` : undefined}
                  className={part ? "policy-part" : undefined}
                >
                  {section.heading ? <h2>{section.heading}</h2> : null}
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items ? (
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </article>
        </div>

        <footer className="policy-footer">
          <nav aria-label={es ? "Políticas" : "Policies"}>
            <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
            <Link href="/terms">{es ? "Términos y facturación" : "Terms & billing"}</Link>
            <Link href="/onboarding">{es ? "Incorporación y soporte" : "Onboarding & support"}</Link>
            <a href="mailto:admin@overdriveio.com">{es ? "Contacto" : "Contact"}</a>
          </nav>
          <span>
            {es
              ? "© 2027 Over Drive. Todos los derechos reservados."
              : "© 2027 Over Drive. All rights reserved."}
          </span>
        </footer>
      </div>

      <style>{`
        .policy-page {
          min-height: 100vh;
          background: #f3f5f7;
          color: #151f24;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.6;
        }
        .policy-page * { box-sizing: border-box; }
        .policy-page a { color: inherit; text-decoration: none; }
        .policy-sheet {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 44px 48px;
          background: #fff;
        }
        .policy-header {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 88px;
          margin: 0 -44px;
          padding: 0 44px;
          background: #fff;
          border-bottom: 1px solid #e7ebef;
        }
        .policy-header img { width: 180px; height: auto; }
        .policy-header-links {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 16px;
        }
        .policy-header .policy-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          background: #fff;
          color: #151f24;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .policy-header .policy-back:hover,
        .policy-header .policy-back:focus-visible {
          border-color: #151f24;
          background: #151f24;
          color: #fff;
        }
        .policy-hero { padding: 48px 0 8px; }
        .policy-kicker {
          margin: 0 0 14px;
          color: #006edb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .policy-page h1 {
          max-width: 760px;
          margin: 0;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: clamp(48px, 6vw, 72px);
          font-weight: 400;
          letter-spacing: 0.4px;
          line-height: 0.92;
        }
        .policy-updated { margin: 16px 0 0; color: #66727e; font-size: 14px; }
        .policy-layout {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 56px;
          align-items: start;
          padding-top: 36px;
        }
        .policy-layout aside {
          position: sticky;
          top: 112px;
        }
        .policy-layout aside > p {
          margin: 0 0 12px;
          color: #66727e;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }
        .policy-layout aside nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: calc(100vh - 150px);
          overflow: auto;
        }
        .policy-layout aside a {
          padding: 7px 0 7px 12px;
          border-left: 2px solid #e7ebef;
          color: #3d4852;
          font-size: 13px;
          line-height: 1.35;
        }
        .policy-layout aside a:hover,
        .policy-layout aside a:focus-visible {
          border-left-color: #0780f7;
          color: #0780f7;
        }
        .policy-layout aside a.policy-contents-part {
          margin-top: 10px;
          color: #151f24;
          font-weight: 700;
        }
        .policy-page article > section {
          padding: 28px 0;
          border-top: 1px solid #e7ebef;
        }
        .policy-page article > section:first-child {
          padding-top: 0;
          border-top: 0;
        }
        .policy-page h2 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.25;
        }
        .policy-part {
          margin-top: 20px;
          padding-top: 36px;
        }
        .policy-part h2 {
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 400;
          letter-spacing: 0.3px;
          line-height: 0.95;
        }
        .policy-page article p {
          max-width: 760px;
          margin: 0 0 12px;
          color: #3d4852;
          font-size: 16px;
        }
        .policy-page article > section:first-child p {
          font-size: 18px;
          line-height: 1.55;
        }
        .policy-page ul {
          display: grid;
          gap: 8px;
          max-width: 760px;
          margin: 4px 0 0;
          padding: 0;
          list-style: none;
        }
        .policy-page li {
          padding: 12px 14px;
          border-left: 3px solid #0780f7;
          background: #f8fafa;
          color: #3d4852;
          font-size: 15px;
        }
        .policy-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #e7ebef;
          color: #66727e;
          font-size: 13px;
        }
        .policy-footer nav { display: flex; flex-wrap: wrap; gap: 18px; }
        .policy-footer a { font-weight: 700; color: #151f24; }
        .policy-footer a:hover,
        .policy-footer a:focus-visible { color: #0780f7; }
        .policy-page :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        @media (max-width: 900px) {
          .policy-layout { grid-template-columns: 1fr; gap: 28px; }
          .policy-layout aside { position: static; }
          .policy-layout aside nav {
            max-height: none;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px;
          }
          .policy-layout aside a {
            padding: 6px 10px;
            border: 1px solid #e7ebef;
            border-left: 1px solid #e7ebef;
            border-radius: 9px;
          }
        }
        @media (max-width: 720px) {
          .policy-sheet { padding: 0 22px 36px; }
          .policy-header {
            flex-wrap: wrap;
            align-items: center;
            row-gap: 12px;
            min-height: 0;
            margin: 0 -22px;
            padding: 16px 22px;
          }
          .policy-header img { width: 140px; }
          .policy-header-links { flex-wrap: wrap; }
          .policy-page h1 { font-size: clamp(36px, 10vw, 48px); }
          .policy-part h2 { font-size: clamp(28px, 8vw, 36px); overflow-wrap: break-word; }
          .policy-footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
