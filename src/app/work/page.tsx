import type { Metadata } from "next";
import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import { WorkTemplate, WorkTemplateStyles } from "@/components/home/WorkTemplates";
import { getLocale } from "@/lib/get-locale";
import { workContent } from "@/lib/work-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = workContent(await getLocale());
  return { title: copy.title, description: copy.description };
}

export default async function WorkPage() {
  const locale = await getLocale();
  const copy = workContent(locale);

  return (
    <main className="work">
      <div className="work-sheet">
        <header className="work-bar">
          <Link href="/" aria-label={copy.homeAria}>
            <img src="/overdrive-logo.webp" alt="Over Drive" />
          </Link>
          <nav>
            <Link href="/pricing">{copy.pricing}</Link>
            <LanguageToggle locale={locale} />
            <Link href="/quote" className="work-button">
              {copy.quote}
            </Link>
          </nav>
        </header>

        <section className="work-hero">
          <p className="work-kicker">{copy.kicker}</p>
          <h1>
            {copy.hero[0]}
            <br />
            {copy.hero[1]}
          </h1>
          <p className="work-lead">{copy.lead}</p>
        </section>

        <section className="work-list">
          {copy.studies.map((study) => (
            <article key={study.kind}>
              <WorkTemplate study={study} />
              <h2>{study.title}</h2>
              <p>{study.detail}</p>
            </article>
          ))}
        </section>
      </div>
      <WorkTemplateStyles />

      <style>{`
        .work {
          min-height: 100vh;
          background: #f3f5f7;
          color: #151f24;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
        }
        .work * { box-sizing: border-box; }
        .work a { color: inherit; text-decoration: none; }
        .work-hero h1,
        .work-hero p,
        .work-list h2,
        .work-list article > p { margin: 0; }
        .work-hero h1,
        .work-list h2 {
          font-family: Impact, "Arial Narrow", sans-serif;
          font-weight: 400;
          letter-spacing: 0.4px;
          line-height: 0.92;
        }
        .work-sheet {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 44px 64px;
          background: #fff;
        }
        .work-bar {
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
        .work-bar img { width: 180px; height: auto; }
        .work-bar nav {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 18px;
        }
        .work-bar nav > a:first-child {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .work-bar nav > a:first-child:hover,
        .work-bar nav > a:first-child:focus-visible { color: #0780f7; }
        .work .work-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 9px;
          background: #0780f7;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .work .work-button:hover,
        .work .work-button:focus-visible { background: #151f24; color: #fff; }
        .work-hero { padding: 48px 0 8px; }
        .work-kicker {
          margin: 0 0 14px;
          color: #006edb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .work-hero h1 { font-size: clamp(52px, 6vw, 84px); }
        .work-lead {
          max-width: 640px;
          margin-top: 18px;
          color: #2c3942;
          font-size: 18px;
        }
        .work-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px 20px;
          margin-top: 36px;
        }
        .work-list article {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e7ebef;
          border-radius: 12px;
        }
        .work-list h2 { margin: 16px 16px 0; font-size: 28px; }
        .work-list article > p { margin: 6px 16px 16px; color: #56616d; font-size: 15px; }
        .work :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        @media (max-width: 1120px) {
          .work-sheet { padding: 0 30px 56px; }
          .work-bar { margin: 0 -30px; padding: 0 30px; }
        }
        @media (max-width: 800px) {
          .work-bar { align-items: flex-start; flex-direction: column; padding-top: 18px; padding-bottom: 18px; }
          .work-bar nav { flex-wrap: wrap; }
          .work-list { grid-template-columns: 1fr; }
          .work-hero h1 { font-size: 48px; }
        }
        @media (max-width: 480px) {
          .work-sheet { padding: 0 22px 48px; }
          .work-bar { margin: 0 -22px; padding-right: 22px; padding-left: 22px; }
        }
      `}</style>
    </main>
  );
}
