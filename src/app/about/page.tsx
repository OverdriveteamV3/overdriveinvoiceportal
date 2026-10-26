import type { Metadata } from "next";
import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import { aboutContent } from "@/lib/about-copy";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const copy = aboutContent(await getLocale());
  return { title: copy.title, description: copy.description };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const copy = aboutContent(locale);

  return (
    <main className="about">
      <div className="about-sheet">
      <header className="about-bar">
        <Link href="/" aria-label={copy.homeAria}>
          <img src="/overdrive-logo.webp" alt="Over Drive" />
        </Link>
        <nav>
          <Link href="/pricing">{copy.pricing}</Link>
          <LanguageToggle locale={locale} />
          <Link href="/quote" className="about-button">
            {copy.quote}
          </Link>
        </nav>
      </header>

      <section className="about-hero">
        <div>
          <p className="about-kicker">{copy.kicker}</p>
          <h1>
            {copy.hero[0]}
            <br />
            {copy.hero[1]}
          </h1>
          <p className="about-lead">{copy.lead}</p>
        </div>
        <dl className="about-facts">
          {copy.facts.map(([title, detail]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-bio">
        {copy.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="about-practice">
        <div className="about-section-head">
          <h2>{copy.practiceTitle}</h2>
          <p>{copy.practiceLead}</p>
        </div>
        <div>
          {copy.practices.map(([title, detail], index) => (
            <article key={title}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-approach">
        <div className="about-section-head">
          <h2>{copy.approachTitle}</h2>
          <p>{copy.approachLead}</p>
        </div>
        <ol>
          {copy.steps.map(([index, title, detail]) => (
            <li key={index}>
              <b>{index}</b>
              <div>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-reasons">
        <h2>{copy.reasonsTitle}</h2>
        <div>
          {copy.reasons.map(([title, detail]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-close">
        <h2>
          {copy.closeTitle[0]}
          <br />
          {copy.closeTitle[1]}
        </h2>
        <p>{copy.closeLead}</p>
        <div className="about-actions">
          <Link href="/quote">{copy.quote}</Link>
          <Link href="/pricing">{copy.pricing}</Link>
        </div>
      </section>
      </div>

      <style>{`
        .about {
          min-height: 100vh;
          background: #f3f5f7;
          color: #151f24;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.55;
        }
        .about * { box-sizing: border-box; }
        .about a { color: inherit; text-decoration: none; }
        .about h1,
        .about h2,
        .about h3,
        .about p { margin: 0; }
        .about h1,
        .about h2 {
          font-family: Impact, "Arial Narrow", sans-serif;
          font-weight: 400;
          letter-spacing: 0.4px;
          line-height: 0.92;
        }
        .about-sheet {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 44px;
          background: #fff;
        }
        .about-bar {
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
        .about-bar img { width: 180px; height: auto; }
        .about-bar nav {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 18px;
        }
        .about-bar nav > a:first-child {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .about-bar nav > a:first-child:hover,
        .about-bar nav > a:first-child:focus-visible { color: #0780f7; }
        .about .about-button,
        .about-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: #0780f7;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .about .about-button:hover,
        .about .about-button:focus-visible {
          background: #151f24;
          color: #fff;
        }
        .about-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.7fr);
          gap: 56px;
          align-items: end;
          padding: 48px 0 12px;
        }
        .about-kicker {
          margin: 0 0 14px;
          color: #006edb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .about-hero h1 { font-size: clamp(52px, 6vw, 84px); }
        .about-lead {
          max-width: 640px;
          margin-top: 22px;
          font-size: 20px;
          line-height: 1.45;
        }
        .about-facts {
          margin: 0;
          border-top: 3px solid #f8f959;
        }
        .about-facts div {
          padding: 16px 0;
          border-bottom: 1px solid #e7ebef;
        }
        .about-facts dt {
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 28px;
          font-weight: 400;
          letter-spacing: 0.3px;
          line-height: 1;
        }
        .about-facts dd { margin: 8px 0 0; color: #56616d; font-size: 14px; }
        .about-bio {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          padding: 42px 0 8px;
        }
        .about-bio p {
          margin: 0;
          padding-top: 14px;
          border-top: 1px solid #e7ebef;
          color: #2c3942;
          font-size: 15px;
        }
        .about-section-head {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(220px, 0.85fr);
          gap: 24px;
          align-items: end;
        }
        .about-section-head p {
          color: #56616d;
          font-size: 16px;
        }
        .about-practice {
          margin: 48px -44px 0;
          padding: 48px 44px 40px;
          background: #f8fafa;
          border-top: 1px solid #e7ebef;
          border-bottom: 1px solid #e7ebef;
        }
        .about-approach { padding: 52px 0 8px; }
        .about-practice h2,
        .about-approach h2,
        .about-reasons h2 { font-size: clamp(36px, 4.4vw, 52px); }
        .about-practice > div:last-child {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
        }
        .about-practice article {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px 16px 18px;
          border: 1px solid #e7ebef;
          border-top: 3px solid #0780f7;
          background: #fff;
        }
        .about-practice b,
        .about-approach b {
          color: #0780f7;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 28px;
          font-weight: 400;
          line-height: 1;
        }
        .about-practice h3,
        .about-reasons h3 { font-size: 18px; }
        .about-practice article p { color: #3d4b55; font-size: 14px; }
        .about-approach ol {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          margin: 28px 0 0;
          padding: 0;
          list-style: none;
          border-top: 1px solid #e7ebef;
        }
        .about-approach li {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin: 0;
          padding: 18px 20px 8px 18px;
          border-left: 1px solid #e7ebef;
        }
        .about-approach li:first-child { padding-left: 0; border-left: 0; }
        .about-approach li > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-approach strong { font-size: 16px; }
        .about-approach span { color: #56616d; font-size: 14px; }
        .about-reasons {
          margin: 48px -44px 0;
          padding: 48px 44px 44px;
          background: #151f24;
          color: #fff;
        }
        .about-reasons h2 { color: #f8f959; }
        .about-reasons > div {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
          margin-top: 28px;
        }
        .about-reasons article {
          padding-top: 14px;
          border-top: 2px solid #f8f959;
        }
        .about-reasons h3 { color: #fff; }
        .about-reasons article p {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
        }
        .about-close {
          margin: 56px -44px 0;
          padding: 56px 44px 48px;
          background: #0780f7;
          color: #fff;
          text-align: center;
        }
        .about-close h2 { font-size: clamp(42px, 6vw, 68px); }
        .about-close > p { max-width: 460px; margin: 16px auto 0; font-size: 16px; }
        .about-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }
        .about-actions a { background: #f8f959; color: #151f24; }
        .about-actions a:last-child {
          background: transparent;
          border-color: #fff;
          color: #fff;
        }
        .about-actions a:hover,
        .about-actions a:focus-visible {
          background: #151f24;
          border-color: #151f24;
          color: #fff;
        }
        .about :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        @media (max-width: 1120px) {
          .about-sheet { padding: 0 30px; }
          .about-bar { margin: 0 -30px; padding: 0 30px; }
          .about-practice,
          .about-reasons { margin-right: -30px; margin-left: -30px; padding-right: 30px; padding-left: 30px; }
          .about-close { margin-right: -30px; margin-left: -30px; padding-right: 30px; padding-left: 30px; }
          .about-practice > div:last-child,
          .about-approach ol,
          .about-reasons > div { grid-template-columns: 1fr 1fr; }
          .about-approach li:nth-child(odd) { padding-left: 0; border-left: 0; }
          .about-approach li:nth-child(n + 3) {
            padding-top: 22px;
            border-top: 1px solid #e7ebef;
          }
        }
        @media (max-width: 800px) {
          .about-bar {
            flex-wrap: wrap;
            align-items: center;
            row-gap: 12px;
            padding-top: 14px;
            padding-bottom: 14px;
          }
          .about-bar nav { flex-shrink: 1; flex-wrap: wrap; justify-content: flex-end; }
          .about-hero,
          .about-bio,
          .about-section-head,
          .about-practice > div:last-child,
          .about-approach ol,
          .about-reasons > div { grid-template-columns: 1fr; }
          .about-hero h1,
          .about-close h2 { font-size: clamp(36px, 10vw, 52px); }
          .about-lead { font-size: 17px; }
          .about-approach li {
            padding-left: 0;
            border-left: 0;
            border-top: 1px solid #e7ebef;
          }
          .about-approach li:first-child { border-top: 0; }
        }
        @media (max-width: 480px) {
          .about-sheet { padding: 0 22px; }
          .about-bar { margin: 0 -22px; padding-right: 22px; padding-left: 22px; }
          .about-bar nav { width: 100%; justify-content: flex-start; }
          .about-practice,
          .about-reasons { margin-right: -22px; margin-left: -22px; padding-right: 22px; padding-left: 22px; }
          .about-close { margin-right: -22px; margin-left: -22px; padding-right: 22px; padding-left: 22px; }
          .about-hero h1,
          .about-close h2 { font-size: clamp(34px, 11vw, 44px); }
          .about-actions { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </main>
  );
}
