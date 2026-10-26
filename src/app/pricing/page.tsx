import type { Metadata } from "next";
import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import { getLocale } from "@/lib/get-locale";
import { pricingContent } from "@/lib/pricing-copy";

function quoteHref(service: string, plan: string) {
  return `/quote?${new URLSearchParams({ service, plan }).toString()}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = pricingContent(await getLocale());
  return { title: copy.title, description: copy.description };
}


export default async function PricingPage() {
  const locale = await getLocale();
  const copy = pricingContent(locale);
  return (
    <main className="price">
      <header className="price-top">
        <div className="price-bar">
          <span />
          <Link href="/" aria-label={copy.homeAria}>
            <img src="/overdrive-logo.webp" alt="Over Drive" />
          </Link>
          <LanguageToggle locale={locale} tone="dark" />
        </div>
        <p>{copy.tagline}</p>
        <p className="price-kicker">{copy.kicker}</p>
      </header>

      <section className="price-hero">
        <h1>
          {copy.hero[0]}
          <br />
          {copy.hero[1]}
        </h1>
        <p>{copy.heroLead}</p>
      </section>

      <div className="price-list">
        {copy.services.map((service) => (
          <section className="price-service" key={service.title}>
            <h2>{service.title}</h2>
            <div className="price-plans">
              {service.plans.map((plan) => (
                <Link className="price-card" href={quoteHref(service.service, plan.name)} key={plan.name}>
                  <header>
                    <h3>{plan.name}</h3>
                    <p>
                      <span>{copy.from}</span>
                      {plan.price}
                    </p>
                  </header>
                  <ul>
                    {plan.items.map(([name, detail]) => (
                      <li key={name}>
                        <strong>{name}</strong>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="price-card-cta">{copy.quote}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="price-service">
          <h2>{copy.brandTitle}</h2>
          <div className="price-plans">
            <Link className="price-card" href={quoteHref(copy.brandService, copy.brandName)}>
              <header>
                <h3>{copy.brandName}</h3>
                <p>
                  <span>{copy.from}</span>
                  $99
                </p>
              </header>
              <ul>
                {copy.brandItems.map(([name, detail]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <span className="price-card-cta">{copy.quote}</span>
            </Link>
          </div>
        </section>

        <p className="price-note">{copy.note}</p>
      </div>

      <section className="price-start">
        <h2>
          {copy.startTitle[0]}
          <br />
          {copy.startTitle[1]}
        </h2>
        <p>{copy.startLead}</p>
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

      <section className="price-facts">
        <h2>{copy.expectTitle}</h2>
        <div>
          {copy.facts.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="price-note">{copy.expectNote}</p>
      </section>

      <footer className="price-foot">
        <h2>{copy.footTitle}</h2>
        <div className="price-actions">
          <a href="mailto:admin@overdriveio.com?subject=Book%20a%20consultation">
            {copy.consult}
          </a>
          <Link href="/quote">{copy.quote}</Link>
        </div>
        <p className="price-fine">{copy.fine}</p>
      </footer>

      <style>{`
        .price {
          min-height: 100vh;
          background:
            linear-gradient(rgba(7, 128, 247, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(7, 128, 247, 0.08) 1px, transparent 1px),
            #071018;
          background-size: 48px 48px, 48px 48px, auto;
          color: #f4f7f8;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
        }

        .price * { box-sizing: border-box; }

        .price a { color: inherit; text-decoration: none; }

        .price h1,
        .price h2 {
          margin: 0;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-weight: 400;
          letter-spacing: 0.5px;
          line-height: 0.92;
        }

        .price-top,
        .price-hero,
        .price-list,
        .price-start,
        .price-facts {
          width: min(980px, calc(100% - 40px));
          margin: 0 auto;
        }

        .price-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 28px 0 10px;
          text-align: center;
        }

        .price-bar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          width: min(980px, calc(100% - 40px));
        }

        .price-bar .od-lang { justify-self: end; }

        .price-top img {
          width: 240px;
          height: auto;
        }

        .price-top p {
          margin: 0;
          color: #f8f959;
          font-size: 13px;
          letter-spacing: 1.5px;
          text-transform: lowercase;
        }

        .price-kicker {
          color: #9eb0c0 !important;
          letter-spacing: 2.4px !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
        }

        .price-hero {
          padding: 28px 0 10px;
          text-align: center;
        }

        .price-hero h1 {
          color: #f8f959;
          font-size: clamp(46px, 7vw, 76px);
        }

        .price-hero p,
        .price-start > p {
          max-width: 560px;
          margin: 16px auto 0;
          color: #c5d0d8;
          font-size: 16px;
        }

        .price-list { padding: 28px 0 10px; }

        .price-service { margin-top: 28px; }

        .price-service > h2,
        .price-facts > h2 {
          color: #f8f959;
          font-size: 34px;
        }

        .price-plans {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 14px;
        }

        .price-card,
        .price-facts article {
          border: 1px solid rgba(7, 128, 247, 0.45);
          border-radius: 16px;
          background: rgba(8, 14, 22, 0.92);
        }

        .price-facts article { padding: 18px 18px 8px; }

        .price-card {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 20px 20px 16px;
        }

        .price-card:hover,
        .price-card:focus-visible {
          border-color: #f8f959;
          background: #0c1826;
        }

        .price-card:focus-visible {
          outline: 2px solid #f8f959;
          outline-offset: 3px;
        }

        .price-card header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
        }

        .price h3 {
          margin: 0;
          font-size: 18px;
        }

        .price-card header p {
          margin: 0;
          color: #f8f959;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 34px;
          line-height: 0.9;
          text-align: right;
        }

        .price-card header span {
          display: block;
          color: #9eb0c0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .price ul,
        .price ol {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .price li {
          display: grid;
          gap: 2px;
          padding: 10px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .price li strong { font-size: 14px; }

        .price li span {
          color: #b7c3cc;
          font-size: 13px;
        }

        .price-card ul { flex: 1; }

        .price-plans .price-card:only-child ul {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 28px;
        }

        .price-plans .price-card:only-child li {
          border-top: 0;
          padding: 8px 0;
        }

        .price .price-card-cta {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          color: #f8f959;
          font-size: 13px;
          font-weight: 700;
        }

        .price-card:hover .price-card-cta,
        .price-card:focus-visible .price-card-cta {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .price-note {
          margin: 18px 0 0;
          color: #8ea0ae;
          font-size: 13px;
        }

        .price-start,
        .price-facts { padding: 42px 0 10px; }

        .price-start { text-align: center; }

        .price-start h2 {
          color: #f8f959;
          font-size: clamp(48px, 7vw, 72px);
        }

        .price-start ol {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 28px;
          text-align: left;
        }

        .price-start li {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin: 0;
          padding: 18px 18px 20px;
          border: 1px solid rgba(7, 128, 247, 0.35);
          border-radius: 16px;
          background: rgba(8, 14, 22, 0.88);
        }

        .price-start li > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .price-start b {
          color: #f8f959;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 32px;
          font-weight: 400;
          line-height: 1;
        }

        .price-start strong {
          font-size: 16px;
        }

        .price-facts > div {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .price-facts article { padding-bottom: 18px; }

        .price-facts p { margin: 8px 0 0; color: #c5d0d8; font-size: 14px; }

        .price-foot {
          margin-top: 48px;
          padding: 36px 20px 28px;
          background: #0780f7;
          text-align: center;
        }

        .price-foot h2 {
          font-size: clamp(32px, 5vw, 48px);
        }

        .price-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .price-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          border: 1px solid white;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .price-actions a:hover,
        .price-actions a:focus-visible {
          background: #f8f959;
          border-color: #f8f959;
          color: #151f24;
        }

        .price-foot > p {
          margin: 16px 0 0;
          font-size: 18px;
        }

        .price-foot > p a { font-weight: 700; }

        .price-foot > p span { margin: 0 10px; }

        .price-fine {
          color: rgba(255, 255, 255, 0.82);
          font-size: 12px !important;
        }

        @media (max-width: 800px) {
          .price-plans,
          .price-facts > div,
          .price-start ol,
          .price-plans .price-card:only-child ul { grid-template-columns: 1fr; }
          .price-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .price-bar > span { display: none; }
          .price-top img { width: 148px; }
          .price-hero h1,
          .price-foot h2 { font-size: clamp(34px, 10vw, 52px); }
        }

        @media (max-width: 480px) {
          .price-top img { width: 120px; }
          .price-kicker { letter-spacing: 1.2px !important; }
          .price-actions { flex-direction: column; align-items: stretch; }
          .price-actions a { width: 100%; }
        }
      `}</style>
    </main>
  );
}
