"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import LanguageToggle from "@/components/home/LanguageToggle";
import AccountMenu from "@/components/portal/AccountMenu";
import { homeCopy, type HomeCopy } from "@/lib/home-copy";
import type { Locale } from "@/lib/locale";

const BRAND = {
  logo: "/overdrive-logo.webp",
  badge: "/overdrive-badge.webp",
};

const CLIENT_PORTAL_URL = "/portal";

type IconName = "website" | "dashboard" | "software" | "design";

function Icon({ name, size = 30 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    website: (
      <>
        <rect x="3" y="4" width="26" height="19" rx="3" />
        <path d="M11 28h10M16 23v5" />
      </>
    ),
    dashboard: (
      <>
        <rect x="4" y="19" width="5" height="10" rx="1" />
        <rect x="14" y="11" width="5" height="18" rx="1" />
        <rect x="24" y="3" width="5" height="26" rx="1" />
      </>
    ),
    software: (
      <>
        <path d="m16 3 12 7v14l-12 7-12-7V10Z" />
        <path d="m4 10 12 7 12-7M16 17v14" />
      </>
    ),
    design: (
      <>
        <path d="m6 22-2 8 8-2L29 11a4 4 0 0 0-6-6Z" />
        <path d="m20 8 6 6M6 22l6 6" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div
      className="od-meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={index < value ? "od-filled" : ""} />
      ))}
    </div>
  );
}

function DashboardPreview({ sales = false, copy }: { sales?: boolean; copy: HomeCopy }) {
  const nav = sales ? copy.salesNav : copy.projectNav;

  return (
    <div className={`od-dashboard ${sales ? "od-sales" : "od-project"}`}>
      <aside className="od-dashboard-sidebar">
        <img className="od-side-mark" src={BRAND.badge} alt="Over Drive" />
        {nav.map((item, index) => (
          <div key={item} className={index === 0 ? "od-sidebar-active" : ""}>
            {item}
          </div>
        ))}
      </aside>

      <div className="od-dashboard-content">
        {sales ? (
          <>
            <div className="od-dashboard-heading">
              <strong>{copy.salesTitle}</strong>
            </div>
            <div className="od-dashboard-stats">
              {copy.salesStats.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="od-chart">
              <div>{copy.performance}</div>
              <svg viewBox="0 0 440 130" role="img" aria-label={copy.salesChart}>
                <path d="M10 25H430M10 65H430M10 105H430" stroke="#edf0f4" fill="none" />
                <path
                  d="M10 110L55 98L95 78L140 88L185 60L225 73L270 36L315 52L355 28L395 41L430 12"
                  stroke="#0780f7"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </div>
            <div className="od-activity">
              <strong>{copy.recentDeals}</strong>
              {copy.deals.map((item) => (
                <div key={item}>
                  <span className="od-activity-dot" />
                  {item}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="od-dash-top">
              <div>
                <span>{copy.clientName}</span>
                <strong>{copy.projectName}</strong>
              </div>
              <em>{copy.inProgress}</em>
            </div>
            <div className="od-dash-metrics">
              {copy.metrics.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="od-dash-bar" role="img" aria-label={copy.deliveryLabel}>
              <span>{copy.delivery}</span>
              <i>
                <b />
              </i>
            </div>
            <ul className="od-dash-list">
              {copy.phases.map(([label, state, tone]) => (
                <li key={label} className={tone}>
                  <span>{label}</span>
                  <em>{state}</em>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function LaptopKeyboard() {
  const rows = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.45, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.45],
    [1.7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.85],
    [2.15, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.15],
    [1.25, 1.15, 5.2, 1.15, 1.25],
  ];

  return (
    <div className="od-keys" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div className="od-key-row" key={rowIndex}>
          {row.map((width, keyIndex) => (
            <span className="od-key" key={keyIndex} style={{ flex: `${width} 1 0` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TabletPreview({ copy }: { copy: HomeCopy }) {
  return (
    <div className="od-tablet">
      <div className="od-tablet-top">
        <img src={BRAND.badge} alt="" />
        <div>
          <span>{copy.automations}</span>
          <strong>{copy.automationName}</strong>
        </div>
        <em>{copy.live}</em>
      </div>
      <ol className="od-tablet-flow">
        {copy.tabletSteps.map(([index, title, detail, state, tone]) => (
          <li key={title} className={tone}>
            <b>{index}</b>
            <div>
              <strong>{title}</strong>
              <span>{detail}</span>
            </div>
            <em>{state}</em>
          </li>
        ))}
      </ol>
      <div className="od-tablet-foot">
        <span>{copy.lastRun}</span>
        <strong>{copy.lastRunWhen}</strong>
      </div>
    </div>
  );
}

function DeviceCarousel({ copy }: { copy: HomeCopy }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return undefined;

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % 2);
    }, 4800);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="od-device-stage" aria-roledescription="carousel" aria-label={copy.previews}>
      <div className={active === 0 ? "od-device-slide is-active" : "od-device-slide"} aria-hidden={active !== 0}>
        <div className="od-device-anchor">
          <div className="od-laptop">
            <div className="od-laptop-lid">
              <div className="od-laptop-screen">
                <div className="od-screen-panel">
                  <DashboardPreview copy={copy} />
                  <span className="od-screen-glass" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="od-laptop-base">
              <span className="od-hinge" aria-hidden="true" />
              <LaptopKeyboard />
              <span className="od-trackpad" />
              <span className="od-lip" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className={active === 1 ? "od-device-slide is-active" : "od-device-slide"} aria-hidden={active !== 1}>
        <div className="od-device-anchor od-device-anchor-ipad">
          <div className="od-ipad">
            <div className="od-ipad-face">
              <span className="od-ipad-camera" aria-hidden="true" />
              <span className="od-ipad-volume" aria-hidden="true" />
              <span className="od-ipad-power" aria-hidden="true" />
              <div className="od-ipad-screen">
                <TabletPreview copy={copy} />
                <span className="od-screen-glass" aria-hidden="true" />
                <span className="od-ipad-home" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="od-device-dots">
        <button
          type="button"
          aria-label={copy.showLaptop}
          aria-current={active === 0 ? "true" : undefined}
          onClick={() => setActive(0)}
        />
        <button
          type="button"
          aria-label={copy.showIpad}
          aria-current={active === 1 ? "true" : undefined}
          onClick={() => setActive(1)}
        />
      </div>
    </div>
  );
}

function FooterSocial() {
  const instagram =
    "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793 0 1.44.645 1.44 1.439z";
  const tiktok =
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

  return (
    <div className="od-social">
      <a
        href="https://www.instagram.com/overdriveio/"
        aria-label="Instagram"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="od-ig" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#feda75" />
              <stop offset="25%" stopColor="#fa7e1e" />
              <stop offset="50%" stopColor="#d62976" />
              <stop offset="75%" stopColor="#962fbf" />
              <stop offset="100%" stopColor="#4f5bd5" />
            </linearGradient>
          </defs>
          <path fill="url(#od-ig)" d={instagram} />
        </svg>
      </a>
      <a
        href="https://www.tiktok.com/@overdriveio"
        aria-label="TikTok"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#25F4EE" d={tiktok} transform="translate(-1.1 1)" />
          <path fill="#FE2C55" d={tiktok} transform="translate(1.1 -1)" />
          <path fill="#fff" d={tiktok} />
        </svg>
      </a>
      <a
        href="https://www.youtube.com/@overdriveio"
        aria-label="YouTube"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#FF0000"
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
          />
          <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </a>
    </div>
  );
}

export default function OverDriveHome({
  locale = "en",
  account = null,
}: {
  locale?: Locale;
  account?: { name: string; email: string; avatarUrl: string | null } | null;
}) {
  const copy = homeCopy(locale);
  const services = copy.services;
  const steps = copy.steps;
  const quoteDialog = useRef<HTMLDialogElement>(null);
  const infoDialog = useRef<HTMLDialogElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState({ title: "", description: "" });
  const [formStatus, setFormStatus] = useState("");

  function openQuote() {
    setFormStatus("");
    setMenuOpen(false);

    if (infoDialog.current?.open) {
      infoDialog.current.close();
    }

    if (!quoteDialog.current?.open) {
      quoteDialog.current?.showModal();
    }
  }

  function openInfo(title: string, description: string) {
    setInfo({ title, description });
    setMenuOpen(false);

    if (!infoDialog.current?.open) {
      infoDialog.current?.showModal();
    }
  }

  function openClientPortal() {
    if (CLIENT_PORTAL_URL) {
      window.location.assign(CLIENT_PORTAL_URL);
      return;
    }

    openInfo(copy.portalInfoTitle, copy.portalInfoBody);
  }

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const body = [
      `${copy.yourName}: ${form.get("name")}`,
      `${copy.email}: ${form.get("email")}`,
      `${copy.company}: ${form.get("company") || copy.notProvided}`,
      `${copy.service}: ${form.get("service")}`,
      `${copy.budget}: ${form.get("budget")}`,
      "",
      `${copy.projectDetails}:`,
      form.get("details"),
    ].join("\n");

    const subject = `${copy.mailSubject} — ${form.get("name")}`;

    window.location.href =
      `mailto:admin@overdriveio.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    setFormStatus(copy.mailStatus);
  }

  const navItems = copy.nav;

  return (
    <div className="od-site">
      <div className="od-container">
        <div className="od-header-bar">
        <header className="od-header">
          <a href="#" aria-label={copy.homeAria} className="od-brand">
            <img src={BRAND.logo} alt="Over Drive" />
          </a>

          <nav className="od-desktop-nav" aria-label={copy.navLabel}>
            {navItems.map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
          </nav>

          <div className="od-header-actions">
            <LanguageToggle locale={locale} />
            {account ? (
              <AccountMenu
                locale={locale}
                name={account.name}
                email={account.email}
                avatarUrl={account.avatarUrl}
              />
            ) : (
              <>
                <Link href="/sign-in?next=/portal" className="od-text-button">
                  {copy.headerSignIn}
                </Link>
                <Link href="/sign-in?next=/quote" className="od-button">
                  {copy.headerStart}
                </Link>
              </>
            )}
          </div>

          <button
            className="od-menu-button"
            aria-expanded={menuOpen}
            aria-controls="od-mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? copy.closeMenu : copy.menu}
          </button>
        </header>

        {menuOpen && (
          <nav id="od-mobile-nav" className="od-mobile-nav" aria-label={copy.mobileNavLabel}>
            {navItems.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}

            <LanguageToggle locale={locale} />

            {account ? (
              <div className="od-mobile-account" onClick={() => setMenuOpen(false)}>
                <AccountMenu
                  locale={locale}
                  name={account.name}
                  email={account.email}
                  avatarUrl={account.avatarUrl}
                />
              </div>
            ) : (
              <>
                <Link href="/sign-in?next=/portal" className="od-text-button" onClick={() => setMenuOpen(false)}>
                  {copy.signIn}
                </Link>

                <Link href="/sign-in?next=/quote" className="od-button" onClick={() => setMenuOpen(false)}>
                  {copy.startProject}
                </Link>
              </>
            )}
          </nav>
        )}
        </div>

        <main>
          <section className="od-hero">
            <div className="od-hero-copy">
              <h1>
                {copy.hero[0]}
                <br />
                {copy.hero[1]}
                <br />
                {copy.hero[2]}
              </h1>

              <p>{copy.heroLead}</p>

              <div className="od-actions">
                <Link href="/quote" className="od-button">
                  {copy.requestQuote}
                </Link>

                <Link href="/pricing" className="od-button od-outline">
                  {copy.pricing}
                </Link>
              </div>
            </div>

            <div className="od-hero-visual">
              <DeviceCarousel copy={copy} />
            </div>
          </section>

          <section className="od-section od-services" id="services">
            <div className="od-services-shell">
              <div className="od-services-intro">
                <p className="od-services-kicker">{copy.servicesKicker}</p>
                <h2>{copy.servicesTitle}</h2>
                <p className="od-services-lead">{copy.servicesLead}</p>
              </div>

              <div className="od-editor">
                <div className="od-editor-bar">
                  <span className="od-editor-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  scope.ts
                  <span className="od-editor-status">{copy.exports}</span>
                </div>
                {services.map((service, index) => (
                  <div className="od-service-row" key={service.token}>
                    <span className="od-service-line">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="od-service-code">
                      <span className="od-kw">export const</span>{" "}
                      <span className="od-fn">{service.token}</span>
                      <span className="od-eq"> = </span>
                      <span className="od-str">&quot;{service.title}&quot;</span>
                      <span className="od-cmt">// {service.description}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="od-process" id="process">
            <div className="od-eyebrow">{copy.processEyebrow}</div>

            <div className="od-section-heading">
              <h2>
                {copy.processTitle[0]}
                <br />
                {copy.processTitle[1]}
              </h2>

              <p>{copy.processLead}</p>
            </div>

            <div className="od-steps-grid">
              {steps.map((step, index) => (
                <article className="od-step" key={step.title}>
                  <span className="od-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="od-client-section" id="portal">
            <div className="od-client-copy">
              <div className="od-eyebrow">{copy.portalEyebrow}</div>
              <h2>
                {copy.portalTitle[0]}
                <br />
                {copy.portalTitle[1]}
              </h2>

              <p>{copy.portalLead}</p>

              <div className="od-actions">
                <Link href="/sign-in?next=/quote" className="od-button">
                  {copy.startProject}
                </Link>

                <button className="od-link-button" onClick={openClientPortal}>
                  {copy.learnMore}
                </button>
              </div>
            </div>

            <div className="od-client-card">
              <div className="od-client-card-header">
                <div className="od-project-identity">
                  <div className="od-project-icon">
                    <Icon name="website" size={24} />
                  </div>

                  <div>
                    <h3>{copy.exampleTitle}</h3>
                    <span>{copy.exampleLabel}</span>
                  </div>
                </div>

                <span className="od-paid-badge">{copy.depositPaid}</span>
              </div>

              <div className="od-meter-label">
                <span>{copy.progress}</span>
                <span>{copy.milestones}</span>
              </div>

              <Meter value={3} max={5} label={copy.progressLabel} />

              <div className="od-client-details">
                <div className="od-client-detail">
                  <span className="od-detail-label">{copy.nextMilestone}</span>
                  <strong>{copy.designApproval}</strong>
                  <small>{copy.awaitingReview}</small>
                </div>

                <div className="od-client-detail">
                  <span className="od-detail-label">{copy.revisions}</span>
                  <strong>{copy.revisionsUsed}</strong>

                  <Meter value={1} max={3} label={copy.revisionsLabel} />
                </div>
              </div>
            </div>
          </section>

          <section className="od-final-cta">
            <div className="od-final-cta-copy">
              <div className="od-eyebrow">{copy.ctaEyebrow}</div>
              <h2>
                {copy.ctaTitle[0]}
                <br />
                {copy.ctaTitle[1]}
              </h2>
              <p>{copy.ctaLead}</p>
              <button className="od-button od-yellow-button" onClick={openQuote}>
                {copy.startYourProject}
              </button>
            </div>

            <div className="od-final-facts">
              <p>{copy.startingPrices}</p>
              <dl>
                {copy.priceRows.map(([label, price]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{price}</dd>
                  </div>
                ))}
              </dl>
              <ul>
                {copy.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
              <Link href="/pricing">{copy.seePricing}</Link>
            </div>

            <img src={BRAND.badge} alt="" />
          </section>
        </main>

        <footer className="od-footer">
          <div className="od-footer-top">
            <a href="#" aria-label={copy.homeAria}>
              <img src={BRAND.logo} alt="Over Drive" />
            </a>
          </div>

          <div className="od-footer-columns">
            <nav aria-label={copy.footerNav}>
              <p className="od-footer-label">{copy.footerSite}</p>
              <a href="#services">{copy.nav[0][0]}</a>
              <a href="#process">{copy.nav[1][0]}</a>
              <Link href="/about">{copy.nav[2][0]}</Link>
              <Link href="/sign-in?next=/portal">{copy.signIn}</Link>
              <a href="mailto:admin@overdriveio.com">{copy.contact}</a>
              <Link href="/admin">{copy.admin}</Link>
            </nav>

            <nav aria-label={copy.footerPolicies}>
              <p className="od-footer-label">{copy.footerPolicies}</p>
              <Link href="/privacy">{copy.privacy}</Link>
              <Link href="/terms">{copy.terms}</Link>
              <Link href="/onboarding">{copy.onboarding}</Link>
              <FooterSocial />
            </nav>
          </div>

          <div className="od-footer-base">
            <span>{copy.copyright}</span>
          </div>
        </footer>
      </div>

      <dialog ref={quoteDialog} className="od-dialog">
        <button
          className="od-dialog-close"
          aria-label={copy.closeQuote}
          onClick={() => quoteDialog.current?.close()}
        >
          ×
        </button>

        <div className="od-eyebrow">{copy.quoteEyebrow}</div>
        <h2>{copy.quoteTitle}</h2>
        <p className="od-dialog-intro">{copy.quoteIntro}</p>

        <form onSubmit={submitQuote}>
          <div className="od-form-grid">
            <label>
              {copy.yourName}
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>

            <label>
              {copy.email}
              <input name="email" type="email" autoComplete="email" required maxLength={200} />
            </label>
          </div>

          <label>
            {copy.company}
            <input name="company" autoComplete="organization" maxLength={160} />
          </label>

          <div className="od-form-grid">
            <label>
              {copy.service}
              <select name="service">
                {services.map((service) => (
                  <option key={service.title}>{service.title}</option>
                ))}
              </select>
            </label>

            <label>
              {copy.budget}
              <select name="budget">
                {copy.budgets.map((budget) => (
                  <option key={budget}>{budget}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            {copy.projectDetails}
            <textarea name="details" required maxLength={4000} />
          </label>

          <p className="od-form-notice">
            {copy.formNotice}
          </p>

          <button className="od-button" type="submit">
            {copy.prepareEmail}
          </button>

          <p className="od-form-status" role="status">
            {formStatus}
          </p>
        </form>
      </dialog>

      <dialog ref={infoDialog} className="od-dialog">
        <button
          className="od-dialog-close"
          aria-label={copy.closeInfo}
          onClick={() => infoDialog.current?.close()}
        >
          ×
        </button>

        <h2>{info.title}</h2>
        <p className="od-dialog-intro">{info.description}</p>

        <button className="od-button" onClick={openQuote}>
          {copy.discuss}
        </button>
      </dialog>

      <style>{`
        .od-site {
          --od-blue: #0780f7;
          --od-yellow: #f8f959;
          --od-lime: #c8d63d;
          --od-teal: #4590ad;
          --od-ink: #151f24;
          --od-ice: #f8fafa;
          --od-line: #e7ebef;
          background: #f3f5f7;
          color: var(--od-ink);
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
        }

        .od-site *,
        .od-site *::before,
        .od-site *::after {
          box-sizing: border-box;
        }

        .od-site h1,
        .od-site h2,
        .od-site h3,
        .od-site p {
          margin: 0;
        }

        .od-site h1,
        .od-site h2 {
          font-family: Impact, "Arial Narrow", sans-serif;
          font-weight: 900;
          letter-spacing: -1.6px;
          line-height: 1;
        }

        .od-site h1 {
          font-size: clamp(64px, 6.8vw, 102px);
        }

        .od-site h2 {
          font-size: clamp(38px, 4.1vw, 60px);
        }

        .od-site a {
          color: inherit;
          text-decoration: none;
        }

        .od-site button,
        .od-site input,
        .od-site textarea,
        .od-site select {
          font: inherit;
        }

        .od-site button {
          cursor: pointer;
        }

        .od-site img {
          display: block;
          max-width: 100%;
        }

        .od-site main {
          overflow-x: visible;
        }

        .od-site section[id] {
          scroll-margin-top: 120px;
        }

        .od-container {
          max-width: 1320px;
          padding: 0 44px;
          margin: auto;
          background: #fff;
        }

        .od-header-bar {
          position: sticky;
          top: 0;
          z-index: 30;
          margin: 0 -44px;
          padding: 0 44px;
          background: #fff;
          border-bottom: 1px solid var(--od-line);
        }

        .od-header {
          min-height: 94px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .od-brand {
          width: 220px;
          flex-shrink: 0;
        }

        .od-desktop-nav {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 16px;
          margin-right: auto;
          font-size: 13px;
          white-space: nowrap;
        }

        .od-desktop-nav a {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .od-desktop-nav a:hover,
        .od-footer a:hover {
          color: var(--od-blue);
        }

        .od-header-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 16px;
        }

        .od-text-button,
        .od-link-button {
          border: 0;
          background: transparent;
          padding: 0;
          color: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .od-header-actions .od-text-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 53px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 9px;
          color: var(--od-ink);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }

        .od-header-actions .od-text-button:hover,
        .od-header-actions .od-text-button:focus-visible {
          color: var(--od-blue);
          background: #f2f7fd;
          border-color: #d6e6f8;
        }

        .od-link-button {
          color: #006bd6;
          font-weight: 600;
        }

        .od-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          gap: 22px;
          border: 1px solid transparent;
          padding: 15px 23px;
          border-radius: 9px;
          background: var(--od-blue);
          color: white !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          white-space: nowrap;
        }

        .od-button > span {
          font-size: 21px;
          line-height: 1;
        }

        .od-button.od-outline {
          border-color: var(--od-line);
          color: var(--od-ink) !important;
          background: white;
        }

        .od-header-actions .od-button:not(.od-outline),
        .od-mobile-nav .od-button:not(.od-outline) {
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }

        .od-header-actions .od-button:not(.od-outline):hover,
        .od-header-actions .od-button:not(.od-outline):focus-visible,
        .od-mobile-nav .od-button:not(.od-outline):hover,
        .od-mobile-nav .od-button:not(.od-outline):focus-visible {
          background: var(--od-yellow);
          border-color: var(--od-yellow);
          color: var(--od-ink) !important;
        }

        .od-desktop-nav .od-outline,
        .od-header-actions .od-outline,
        .od-mobile-nav .od-outline {
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }

        .od-desktop-nav .od-outline:hover,
        .od-desktop-nav .od-outline:focus-visible,
        .od-header-actions .od-outline:hover,
        .od-header-actions .od-outline:focus-visible,
        .od-mobile-nav .od-outline:hover,
        .od-mobile-nav .od-outline:focus-visible {
          background: #151f24;
          border-color: #151f24;
          color: #fff !important;
        }

        .od-small-button {
          font-size: 12px !important;
          padding: 12px 18px;
        }

        .od-menu-button,
        .od-mobile-nav {
          display: none;
        }

        .od-hero {
          position: relative;
          display: grid;
          grid-template-columns: 43% 57%;
          min-height: 650px;
          align-items: center;
          margin-bottom: 80px;
        }

        .od-hero::before {
          content: "";
          position: absolute;
          z-index: 0;
          top: -20px;
          bottom: -24px;
          left: -44px;
          right: -44px;
          pointer-events: none;
          background:
            radial-gradient(ellipse 48% 64% at 74% 44%, rgba(7, 128, 247, 0.5) 0%, rgba(7, 128, 247, 0.12) 46%, rgba(7, 128, 247, 0) 72%),
            linear-gradient(rgba(7, 128, 247, 0.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(7, 128, 247, 0.16) 1px, transparent 1px),
            linear-gradient(180deg, #f4f8fd, #e7f2fc);
          background-size: auto, auto, 72px 72px, auto;
          -webkit-mask-image: radial-gradient(ellipse 76% 84% at 70% 46%, #000 16%, rgba(0, 0, 0, 0.72) 48%, transparent 78%);
          mask-image: radial-gradient(ellipse 76% 84% at 70% 46%, #000 16%, rgba(0, 0, 0, 0.72) 48%, transparent 78%);
          animation: od-grid 16s linear infinite;
        }

        @keyframes od-grid {
          to {
            background-position: 0 0, 0 72px, 72px 0, 0 0;
          }
        }

        .od-hero-copy {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 32px;
        }

        .od-eyebrow {
          color: #006edb;
          text-transform: uppercase;
          letter-spacing: 3px;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 17px;
        }

        .od-hero-copy > p {
          max-width: 390px;
          font-size: 17px;
          color: #4f5a67;
          margin: 0;
        }

        .od-actions {
          display: flex;
          align-items: center;
          gap: 17px;
          flex-wrap: wrap;
        }

        .od-hero .od-actions .od-button {
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }

        .od-hero .od-actions .od-button:hover,
        .od-hero .od-actions .od-button:focus-visible {
          background: var(--od-yellow);
          border-color: var(--od-yellow);
          color: var(--od-ink) !important;
        }

        .od-hero .od-actions .od-outline:hover,
        .od-hero .od-actions .od-outline:focus-visible {
          background: var(--od-ink);
          border-color: var(--od-ink);
          color: #fff !important;
        }

        .od-hero-visual {
          position: relative;
          z-index: 1;
          align-self: stretch;
          min-height: 640px;
          overflow: visible;
        }

        .od-device-stage {
          position: absolute;
          inset: 0;
        }

        .od-device-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.6s ease;
        }

        .od-device-slide.is-active {
          z-index: 2;
          opacity: 1;
          pointer-events: auto;
        }

        .od-device-anchor {
          position: absolute;
          top: 50%;
          right: 72px;
          transform: translateY(-50%);
        }

        .od-device-anchor-ipad {
          right: 96px;
          perspective: 1800px;
          perspective-origin: 50% 46%;
        }

        .od-device-dots {
          position: absolute;
          z-index: 6;
          left: 0;
          bottom: 16px;
          display: flex;
          gap: 8px;
        }

        .od-device-dots button {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 99px;
          background: rgba(21, 31, 36, 0.28);
          cursor: pointer;
        }

        .od-device-dots button[aria-current="true"] {
          width: 22px;
          background: var(--od-blue);
        }

        .od-laptop {
          position: relative;
          z-index: 4;
          width: 560px;
          perspective: 1600px;
          perspective-origin: 50% 8%;
        }

        .od-laptop-lid {
          position: relative;
          z-index: 2;
        }

        .od-laptop-screen {
          position: relative;
          padding: 20px 11px 16px;
          background:
            linear-gradient(180deg, #6a737c 0 1px, #2a3138 1px 18px, #12161b 18px 100%);
          border-radius: 14px 14px 4px 4px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.55),
            inset 1px 0 0 rgba(255, 255, 255, 0.16),
            inset -1px 0 0 rgba(0, 0, 0, 0.45),
            inset 0 -8px 10px rgba(0, 0, 0, 0.28),
            0 18px 28px rgba(17, 28, 38, 0.16);
        }

        .od-laptop-screen::before {
          content: "";
          position: absolute;
          top: 7px;
          left: 50%;
          width: 5px;
          height: 5px;
          margin-left: -2.5px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #8b97a1, #0c1014 64%);
          box-shadow: 0 0 0 2px #3a434c, 8px 0 0 -1.5px #1a2026;
        }

        .od-screen-panel {
          position: relative;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: 0 0 0 1px #05070a, inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        .od-screen-glass {
          position: absolute;
          z-index: 2;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(115deg, rgba(255, 255, 255, 0.14) 0%, transparent 18%);
        }

        .od-laptop .od-dashboard {
          height: 332px;
          min-height: 332px;
          grid-template-columns: 92px minmax(0, 1fr);
          border-radius: 0;
          -webkit-font-smoothing: subpixel-antialiased;
          text-rendering: optimizeLegibility;
        }

        .od-laptop .od-dashboard-sidebar {
          padding: 16px 10px;
          font-size: 11px;
        }

        .od-laptop .od-side-mark {
          width: 54px;
        }

        .od-laptop .od-dashboard-content {
          padding: 18px 16px 14px;
        }

        .od-ipad {
          position: relative;
          width: 540px;
          transform: rotateX(10deg) rotateY(-22deg);
          transform-style: preserve-3d;
        }

        .od-ipad-face {
          position: relative;
          padding: 13px 13px 15px;
          border-radius: 18px;
          background:
            linear-gradient(155deg, #fcfdfe 0%, #e8edf0 46%, #c9d2d8 100%);
          box-shadow:
            inset 0 1px 0 #fff,
            inset 0 0 0 1px rgba(255, 255, 255, 0.7),
            inset 0 0 0 2px rgba(92, 104, 114, 0.28);
          transform: translateZ(7px);
          transform-style: preserve-3d;
        }

        .od-ipad-face::before {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(90deg, #66727b 0%, #b7c1c8 16%, #e4eaee 52%, #8d98a0 100%);
          transform: translateZ(-10px);
        }

        .od-ipad-volume,
        .od-ipad-power {
          position: absolute;
          top: -3px;
          height: 3px;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(#c5ced4, #6f7b84);
        }

        .od-ipad-volume {
          left: 86px;
          width: 22px;
          box-shadow: 30px 0 0 #7c8890;
        }

        .od-ipad-power {
          left: 162px;
          width: 38px;
        }

        .od-ipad-camera {
          position: absolute;
          z-index: 3;
          top: 50%;
          left: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #6a7580, #0c1014 70%);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55);
          transform: translateY(-50%);
        }

        .od-ipad-screen {
          position: relative;
          overflow: hidden;
          height: 312px;
          border-radius: 6px;
          background: #0c0e10;
          box-shadow: 0 0 0 1px #050607;
        }

        .od-ipad-home {
          position: absolute;
          z-index: 4;
          left: 50%;
          bottom: 6px;
          width: 78px;
          height: 4px;
          margin-left: -39px;
          border-radius: 4px;
          background: rgba(21, 31, 36, 0.38);
        }

        .od-tablet {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px 18px 24px;
          background:
            linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
          color: var(--od-ink);
          font-family: Arial, Helvetica, sans-serif;
        }

        .od-tablet-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .od-tablet-top img {
          width: 42px;
          height: auto;
        }

        .od-tablet-top span,
        .od-tablet-foot span {
          display: block;
          color: #6b7782;
          font-size: 11px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .od-tablet-top strong,
        .od-tablet-foot strong {
          display: block;
          font-size: 16px;
        }

        .od-tablet-top em {
          margin-left: auto;
          border-radius: 99px;
          background: #e8f8ee;
          color: #1d7a45;
          padding: 4px 9px;
          font-size: 11px;
          font-style: normal;
          font-weight: 700;
        }

        .od-tablet-flow {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 16px 0 0;
          padding: 0;
          list-style: none;
        }

        .od-tablet-flow li {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid #e6ebf0;
          border-radius: 12px;
          background: #fff;
        }

        .od-tablet-flow b {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #eef2f6;
          color: #5c6974;
          font-size: 12px;
        }

        .od-tablet-flow strong {
          display: block;
          font-size: 14px;
        }

        .od-tablet-flow li > div span {
          display: block;
          color: #6b7782;
          font-size: 12px;
        }

        .od-tablet-flow em {
          font-size: 11px;
          font-style: normal;
          font-weight: 700;
          color: #7b8792;
        }

        .od-tablet-flow .is-done b {
          background: #e8f8ee;
          color: #1d7a45;
        }

        .od-tablet-flow .is-done em {
          color: #1d7a45;
        }

        .od-tablet-flow .is-running {
          border-color: #cfe4fb;
          background: #f3f8fe;
        }

        .od-tablet-flow .is-running b {
          background: var(--od-blue);
          color: #fff;
        }

        .od-tablet-flow .is-running em {
          color: var(--od-blue);
        }

        .od-tablet-foot {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 12px;
        }

        .od-laptop-base {
          position: relative;
          z-index: 1;
          height: 168px;
          margin-top: -2px;
          border-radius: 0 0 18px 20px;
          background:
            linear-gradient(180deg, #9aa6af 0 8px, transparent 8px),
            linear-gradient(104deg, #b7c2ca 0%, #f7fafb 22%, #e7eef2 58%, #c5d0d7 100%);
          transform: rotateX(58deg);
          transform-origin: center top;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.62),
            inset 16px 0 18px rgba(255, 255, 255, 0.28),
            inset -18px 0 18px rgba(70, 84, 96, 0.18),
            0 18px 16px rgba(20, 32, 42, 0.12);
        }

        .od-laptop-base::before,
        .od-laptop-base::after {
          content: "";
          position: absolute;
          bottom: 6px;
          width: 46px;
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(#9aa6ae, #6d7880);
        }

        .od-laptop-base::before { left: 22px; }
        .od-laptop-base::after { right: 22px; }

        .od-hinge {
          position: absolute;
          top: 0;
          left: 8%;
          right: 8%;
          height: 8px;
          background:
            linear-gradient(#d5dee4, #5d6972) left center / 42% 100% no-repeat,
            linear-gradient(#d5dee4, #5d6972) right center / 42% 100% no-repeat,
            linear-gradient(#2c343b, #2c343b) center / 8% 3px no-repeat;
        }

        .od-keys {
          position: absolute;
          z-index: 1;
          top: 16px;
          left: 7%;
          right: 7%;
          display: grid;
          gap: 3px;
          padding: 8px 7px 7px;
          border-radius: 6px;
          background: linear-gradient(180deg, #8e9aa3, #c5d0d6 18%, #d5dee4);
          box-shadow:
            inset 0 2px 3px rgba(40, 52, 62, 0.35),
            inset 0 0 0 1px rgba(255, 255, 255, 0.35);
        }

        .od-key-row {
          display: flex;
          gap: 3px;
          height: 11px;
        }

        .od-key {
          border-radius: 2.5px;
          background: linear-gradient(180deg, #ffffff 0%, #eef3f6 62%, #d5dee4 100%);
          box-shadow:
            inset 0 1px 0 #ffffff,
            0 1px 0 rgba(62, 74, 84, 0.72);
        }

        .od-trackpad {
          position: absolute;
          z-index: 1;
          left: 50%;
          top: 108px;
          width: 38%;
          height: 42px;
          transform: translateX(-50%);
          border-radius: 6px;
          background: linear-gradient(180deg, #fbfcfd, #d7e0e6);
          box-shadow:
            inset 0 0 0 1px rgba(90, 104, 114, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            0 1px 1px rgba(255, 255, 255, 0.65);
        }

        .od-lip {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 11px;
          border-radius: 0 0 18px 20px;
          background: linear-gradient(180deg, #e4ebf0, #9aa6ae 42%, #66717a);
        }

        .od-dashboard {
          display: grid;
          grid-template-columns: 86px minmax(0, 1fr);
          min-height: 330px;
          overflow: hidden;
          background: #f6f8fb;
          border-radius: 8px;
        }

        .od-dashboard-sidebar {
          background: #151b22;
          color: #c5ced6;
          padding: 16px 10px;
          font-size: 11px;
        }

        .od-side-mark {
          display: block;
          width: 54px;
          height: auto;
          margin: 0 2px 14px;
          background: transparent;
        }

        .od-dashboard-sidebar > div {
          padding: 8px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .od-sidebar-active {
          background: var(--od-blue);
          color: white;
        }

        .od-dashboard-content {
          min-width: 0;
          padding: 25px 18px 17px;
        }

        .od-dashboard-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .od-dashboard-heading > span {
          color: #7d8795;
          font-size: 7px;
        }

        .od-dashboard-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .od-dashboard-stats > div {
          background: white;
          padding: 13px 9px;
          border-radius: 7px;
          border: 1px solid #edf0f3;
          min-width: 0;
        }

        .od-dashboard-stats span {
          font-size: 8px;
          color: #657080;
        }

        .od-dashboard-stats strong {
          display: block;
          font-size: 10px;
          margin: 6px 0;
        }

        .od-dashboard-stats small {
          display: block;
          font-size: 6px;
          color: #24895b;
        }

        .od-dashboard-progress,
        .od-activity,
        .od-chart {
          background: white;
          border-radius: 8px;
          padding: 13px;
          margin-top: 13px;
          font-size: 9px;
        }

        .od-dashboard-progress > div:first-child {
          display: flex;
          justify-content: space-between;
        }

        .od-progress-track {
          height: 9px;
          border-radius: 20px;
          background: #e2e7ed;
          overflow: hidden;
          margin-top: 10px;
        }

        .od-progress-track span {
          display: block;
          height: 100%;
          width: 68%;
          border-radius: inherit;
          background: var(--od-blue);
        }

        .od-activity > div {
          display: flex;
          gap: 7px;
          align-items: center;
          border-bottom: 1px solid #f0f2f5;
          padding: 10px 0;
          font-size: 8px;
        }

        .od-activity > div:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .od-activity-dot {
          height: 6px;
          width: 6px;
          background: var(--od-blue);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .od-activity-arrow {
          margin-left: auto;
          color: #8e99a5;
        }

        .od-project.od-dashboard {
          background: white;
        }

        .od-project .od-dashboard-content {
          padding: 22px 20px 16px;
          background: white;
        }

        .od-dash-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .od-dash-top span {
          display: block;
          color: #66727e;
          font-size: 11px;
        }

        .od-dash-top strong {
          display: block;
          margin-top: 2px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .od-dash-top em {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-top: 4px;
          padding: 4px 8px;
          border-radius: 99px;
          background: #e8f3ff;
          color: var(--od-blue);
          font-size: 11px;
          font-style: normal;
          font-weight: 700;
        }

        .od-dash-top em::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--od-blue);
          box-shadow: 0 0 0 0 rgba(7, 128, 247, 0.45);
          animation: od-ping 1.6s ease-out infinite;
        }

        .od-dash-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .od-dash-metrics > div {
          padding: 10px 10px 9px;
          border: 1px solid #e4ebf2;
          border-radius: 10px;
          background: white;
        }

        .od-dash-metrics > div:first-child {
          border-color: #9ecbff;
          background: linear-gradient(180deg, #f7fbff, #eef6ff);
          box-shadow: 0 8px 16px rgba(7, 128, 247, 0.1);
        }

        .od-dash-metrics > div + div {
          padding-left: 10px;
        }

        .od-dash-metrics span {
          display: block;
          color: #66727e;
          font-size: 10px;
        }

        .od-dash-metrics strong {
          display: block;
          margin-top: 3px;
          font-size: 16px;
        }

        .od-dash-bar {
          padding: 14px 0 4px;
        }

        .od-dash-bar span {
          color: #66727e;
          font-size: 11px;
        }

        .od-dash-bar i {
          display: block;
          height: 7px;
          margin-top: 8px;
          overflow: hidden;
          border-radius: 99px;
          background: #e6eef6;
        }

        .od-dash-bar b {
          display: block;
          width: 68%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0780f7, #4eb2ff);
          box-shadow: 0 0 12px rgba(7, 128, 247, 0.45);
          animation: od-fill 1.25s ease both;
        }

        @keyframes od-fill {
          from { width: 0; }
        }

        @keyframes od-ping {
          70% { box-shadow: 0 0 0 5px rgba(7, 128, 247, 0); }
        }

        .od-dash-list {
          margin: 8px 0 0;
          padding: 0;
          list-style: none;
        }

        .od-dash-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 6px;
          padding: 8px 10px;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 13px;
        }

        .od-dash-list li.is-active {
          border-color: #c5dffb;
          background: #f3f8ff;
          box-shadow: 0 8px 16px rgba(7, 128, 247, 0.08);
        }

        .od-dash-list li.is-active em {
          color: var(--od-blue);
          font-weight: 700;
        }

        .od-dash-list li.is-done em {
          color: #1c8a4b;
        }

        .od-dash-list li.is-next em {
          color: #8b97a3;
        }

        .od-dash-list em {
          font-size: 12px;
          font-style: normal;
        }

        .od-section {
          margin-bottom: 85px;
        }

        .od-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 35px;
          margin-bottom: 33px;
        }

        .od-section-heading > p {
          max-width: 345px;
          flex-shrink: 0;
          color: #56616d;
          font-size: 14px;
        }

        .od-services-shell {
          display: grid;
          grid-template-columns: minmax(0, 0.86fr) minmax(280px, 1.14fr);
          gap: 42px;
          align-items: center;
          padding: 36px;
          border-radius: 18px;
          background: #24303a;
          color: white;
        }

        .od-services-kicker,
        .od-editor,
        .od-service-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .od-services-kicker {
          margin-bottom: 18px;
          color: var(--od-blue);
          font-size: 12px;
        }

        .od-services-shell h2 {
          max-width: 420px;
          color: white;
          font-size: clamp(36px, 3.5vw, 52px);
        }

        .od-services-lead {
          max-width: 340px;
          margin-top: 18px;
          color: #b7c0c8;
          font-size: 15px;
          line-height: 1.55;
        }

        .od-editor {
          overflow: hidden;
          border: 1px solid #3d4d5a;
          border-radius: 12px;
          background: #1c2832;
          font-size: 13px;
        }

        .od-editor-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          padding: 0 14px;
          border-bottom: 1px solid #3d4d5a;
          color: #8b97a3;
        }

        .od-editor-dots {
          display: flex;
          gap: 6px;
        }

        .od-editor-dots i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4a5c6a;
        }

        .od-editor-dots i:first-child {
          background: var(--od-blue);
        }

        .od-editor-status {
          margin-left: auto;
          color: #5c6772;
        }

        .od-service-row {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border: 0;
          border-bottom: 1px solid #31404c;
          background: transparent;
          color: inherit;
          text-align: left;
        }

        .od-service-row:last-child {
          border-bottom: 0;
        }

        .od-service-line {
          color: #4d5b67;
          font-size: 12px;
          line-height: 1.45;
        }

        .od-service-code {
          min-width: 0;
          line-height: 1.45;
        }

        .od-kw {
          color: var(--od-teal);
        }

        .od-fn {
          color: var(--od-blue);
        }

        .od-eq {
          color: #8b97a3;
        }

        .od-str {
          color: var(--od-yellow);
        }

        .od-cmt {
          display: block;
          margin-top: 3px;
          color: #7d8b96;
        }

        .od-service-row {
          animation: od-line 0.45s ease both;
        }

        .od-service-row:nth-child(3) { animation-delay: 0.28s; }
        .od-service-row:nth-child(4) { animation-delay: 0.56s; }
        .od-service-row:nth-child(5) { animation-delay: 0.84s; }

        .od-service-row:last-child .od-str::after {
          content: "";
          display: inline-block;
          width: 7px;
          height: 0.95em;
          margin-left: 3px;
          background: var(--od-blue);
          vertical-align: text-bottom;
          animation: od-caret 1.05s steps(1) infinite;
        }

        @keyframes od-line {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        @keyframes od-caret {
          50% { opacity: 0; }
        }

        .od-circle-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid #ced7df;
          border-radius: 50%;
          background: white;
          color: var(--od-ink);
          font-size: 22px;
          flex-shrink: 0;
        }

        .od-service-card .od-circle-button {
          margin-top: 18px;
        }

        .od-circle-button:hover {
          border-color: var(--od-blue);
          color: var(--od-blue);
        }

        .od-work-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .od-work-card {
          border: 1px solid var(--od-line);
          border-radius: 18px;
          overflow: hidden;
          min-width: 0;
        }

        .od-work-image {
          height: 365px;
          padding: 33px 24px 0;
          background: #e7ebed;
          position: relative;
          overflow: hidden;
        }

        .od-work-image.od-work-live {
          height: auto;
          padding: 0;
          background: #fff;
        }

        .od-concept-label {
          position: absolute;
          z-index: 3;
          right: 12px;
          top: 12px;
          background: #ffffffeb;
          border: 1px solid #e4e8ec;
          border-radius: 30px;
          font-size: 10px;
          padding: 4px 10px;
        }

        .od-work-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 21px 24px;
          gap: 16px;
        }

        .od-work-caption h3 {
          font-size: 21px;
          letter-spacing: -.6px;
        }

        .od-work-caption p {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.6px;
          margin-top: 5px;
        }

        .od-property {
          position: relative;
          background: linear-gradient(130deg, #132629, #3e5e59);
          border: 9px solid #232b2f;
          border-radius: 12px 12px 0 0;
          padding: 20px;
          min-height: 345px;
          color: white;
          overflow: hidden;
        }

        .od-property-nav {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          position: relative;
          z-index: 2;
          font-size: 8px;
        }

        .od-property-nav > span {
          color: #d1e0dc;
        }

        .od-property h3 {
          position: relative;
          z-index: 2;
          font-size: 37px;
          letter-spacing: -1.6px;
          line-height: 1.05;
          margin: 45px 0 14px;
        }

        .od-property > p {
          position: relative;
          z-index: 2;
          font-size: 10px;
        }

        .od-house-art {
          position: absolute;
          right: -15px;
          top: 75px;
          width: 235px;
          height: 170px;
          transform: skewY(-8deg);
        }

        .od-house-roof {
          height: 18px;
          background: #c6b28d;
          box-shadow: 0 5px 0 #7a735f;
        }

        .od-house-windows {
          height: 123px;
          border: 13px solid #a29273;
          background:
            repeating-linear-gradient(
              90deg,
              #223f46 0 36px,
              #9d8e70 36px 42px
            );
          box-shadow: inset 0 -30px 30px #e8ce7429;
        }

        .od-house-base {
          height: 18px;
          background: #7d8c79;
          margin-left: -20px;
        }

        .od-property-search {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 2;
          gap: 8px;
          margin-top: 26px;
          border-radius: 7px;
          padding: 11px;
          background: white;
          color: #30414a;
          font-size: 9px;
        }

        .od-property-search-icon {
          background: var(--od-blue);
          color: white;
          padding: 5px 9px;
          border-radius: 5px;
          font-size: 17px;
          line-height: 1;
        }

        .od-work-dashboard {
          padding-left: 16px;
          padding-right: 16px;
        }

        .od-work-dashboard .od-dashboard {
          border: 7px solid white;
          border-radius: 12px;
          min-height: 360px;
          grid-template-columns: 72px minmax(0, 1fr);
        }

        .od-sales .od-dashboard-content {
          padding: 22px 13px;
        }

        .od-sales .od-dashboard-stats strong {
          font-size: 21px;
        }

        .od-chart {
          padding-bottom: 0;
        }

        .od-chart svg {
          display: block;
          width: 100%;
          height: 100px;
        }

        .od-process {
          background: var(--od-yellow);
          border-radius: 18px;
          padding: 44px 54px;
          margin: 0 -20px 65px;
        }

        .od-process .od-section-heading > p {
          color: #3a4129;
        }

        .od-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
          margin-top: 40px;
        }

        .od-step {
          padding-right: 22px;
          border-right: 1px solid #151f2420;
        }

        .od-step:last-child {
          border-right: 0;
        }

        .od-step-number {
          display: block;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 45px;
          color: #006edb;
          line-height: 1;
          margin-bottom: 18px;
        }

        .od-step h3 {
          font-size: 15px;
          letter-spacing: -.3px;
          margin-bottom: 9px;
        }

        .od-step p {
          font-size: 13px;
        }

        .od-client-section {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 65px;
          align-items: center;
          margin-bottom: 60px;
        }

        .od-client-copy > p {
          margin: 20px 0 25px;
          color: #56616d;
          max-width: 360px;
          font-size: 17px;
        }

        .od-client-card {
          padding: 27px;
          border: 1px solid var(--od-line);
          border-radius: 20px;
          box-shadow: 0 15px 50px #15202b08;
        }

        .od-client-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 22px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--od-line);
        }

        .od-project-identity {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .od-project-icon {
          display: grid;
          place-items: center;
          height: 44px;
          width: 44px;
          border-radius: 9px;
          background: #edf2f5;
          color: var(--od-teal);
        }

        .od-project-identity h3 {
          font-size: 15px;
          letter-spacing: -.4px;
        }

        .od-project-identity span {
          font-size: 12px;
          color: #647080;
        }

        .od-paid-badge {
          color: #137340;
          background: #eaf8ef;
          border-radius: 30px;
          padding: 7px 11px;
          font-size: 11px;
          white-space: nowrap;
        }

        .od-meter-label {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          font-size: 12px;
        }

        .od-meter-label span:last-child {
          color: #657080;
        }

        .od-meter {
          display: flex;
          gap: 4px;
          margin: 12px 0 24px;
        }

        .od-meter > span {
          height: 13px;
          flex: 1;
          background: #e0e6ec;
          border-radius: 7px;
        }

        .od-meter > .od-filled {
          background: var(--od-blue);
        }

        .od-client-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .od-client-detail {
          padding: 17px;
          border: 1px solid var(--od-line);
          border-radius: 11px;
          background: #fbfcfd;
        }

        .od-detail-label {
          display: block;
          font-size: 10px;
          margin-bottom: 13px;
        }

        .od-client-detail strong {
          display: block;
          font-size: 12px;
        }

        .od-client-detail small {
          display: block;
          font-size: 10px;
          color: #74808e;
          margin-top: 5px;
        }

        .od-client-detail .od-meter {
          margin: 12px 0 0;
        }

        .od-client-detail .od-meter > span {
          height: 9px;
        }

        .od-final-cta {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(220px, 300px) auto;
          gap: 48px;
          align-items: center;
          position: relative;
          overflow: hidden;
          margin: 0 -44px;
          padding: 52px 56px;
          border-radius: 0;
          background: var(--od-blue);
          color: white;
        }

        .od-final-cta-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 640px;
        }

        .od-final-cta .od-eyebrow {
          margin-bottom: 12px;
          color: var(--od-yellow);
          letter-spacing: 2.4px;
        }

        .od-final-cta h2 {
          max-width: 520px;
          font-size: clamp(42px, 4vw, 56px);
          line-height: 0.92;
          letter-spacing: -1.2px;
        }

        .od-final-cta-copy p {
          max-width: 420px;
          margin: 16px 0 22px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 16px;
          line-height: 1.55;
        }

        .od-button.od-yellow-button {
          background: var(--od-yellow);
          color: var(--od-ink) !important;
        }

        .od-final-cta > img {
          justify-self: end;
          width: 210px;
          height: auto;
        }

        .od-final-facts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .od-final-facts > p {
          margin: 0;
          color: var(--od-yellow);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .od-final-facts dl {
          display: grid;
          gap: 0;
          margin: 0;
        }

        .od-final-facts dl div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          padding: 9px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.28);
        }

        .od-final-facts dl div:last-child {
          border-bottom: 1px solid rgba(255, 255, 255, 0.28);
        }

        .od-final-facts dt,
        .od-final-facts dd {
          margin: 0;
        }

        .od-final-facts dt {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
        }

        .od-final-facts dd {
          color: var(--od-yellow);
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: 26px;
          font-weight: 400;
          letter-spacing: 0.3px;
          line-height: 1;
        }

        .od-final-facts ul {
          display: grid;
          gap: 4px;
          margin: 0;
          padding: 0;
          list-style: none;
          color: rgba(255, 255, 255, 0.88);
          font-size: 13px;
          line-height: 1.4;
        }

        .od-final-facts a {
          align-self: flex-start;
          color: var(--od-yellow);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .od-final-facts a:hover,
        .od-final-facts a:focus-visible {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .od-footer {
          margin: 0 -44px;
          padding: 0 44px 32px;
          background: #0c0f12;
          color: #f4f7f8;
          font-size: 14px;
        }

        .od-footer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin: 0 -44px;
          padding: 28px 44px;
          background: #2a323a;
        }

        .od-footer img {
          width: 180px;
        }

        .od-footer-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 0;
          padding-top: 28px;
        }

        .od-footer nav {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .od-footer-label {
          margin-bottom: 4px;
          color: #9aa6b2;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .od-footer button {
          border: 0;
          padding: 0;
          background: none;
          color: inherit;
          font: inherit;
          text-align: left;
        }

        .od-social {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 8px;
        }

        .od-social a {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
        }

        .od-footer .od-social a:hover,
        .od-footer .od-social a:focus-visible {
          color: inherit;
        }

        .od-social svg {
          width: 26px;
          height: 26px;
          filter: grayscale(1);
          transition: filter 0.18s ease;
        }

        .od-social a:hover svg,
        .od-social a:focus-visible svg {
          filter: none;
        }

        .od-footer-base {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          color: #a8b3bd;
          font-size: 12px;
        }

        .od-dialog {
          width: min(560px, calc(100% - 32px));
          max-height: 90vh;
          padding: 32px;
          border: 1px solid #d4dde5;
          border-radius: 18px;
          color: var(--od-ink);
          background: white;
        }

        .od-dialog::backdrop {
          background: #15202bb8;
          backdrop-filter: blur(4px);
        }

        .od-dialog h2 {
          font-size: 40px;
        }

        .od-dialog-close {
          float: right;
          border: 0;
          background: #f0f4f7;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 24px !important;
          line-height: 1;
        }

        .od-dialog-intro {
          margin: 17px 0 23px !important;
          color: #5d6a78;
          font-size: 14px;
        }

        .od-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .od-dialog label {
          display: block;
          font-size: 12px;
          font-weight: 600;
        }

        .od-dialog input,
        .od-dialog select,
        .od-dialog textarea {
          display: block;
          width: 100%;
          border: 1px solid #cbd5df;
          border-radius: 7px;
          padding: 11px;
          margin: 7px 0 17px;
          color: var(--od-ink);
          background: white;
          font-size: 14px;
        }

        .od-dialog textarea {
          min-height: 110px;
          resize: vertical;
        }

        .od-form-notice {
          padding: 12px;
          background: #f3f7fb;
          color: #536578;
          border-radius: 8px;
          margin-bottom: 18px !important;
          font-size: 12px;
        }

        .od-form-status {
          color: #526273;
          font-size: 13px;
          margin-top: 15px !important;
        }

        .od-site :is(a, button, input, select, textarea):focus-visible {
          outline: 3px solid var(--od-teal);
          outline-offset: 4px;
        }

        @media (max-width: 1120px) {
          .od-container {
            padding: 0 30px;
          }

          .od-hero::before {
            left: -30px;
            right: -30px;
          }

          .od-header-bar {
            margin: 0 -30px;
            padding: 0 30px;
          }

          .od-footer {
            margin: 0 -30px;
            padding: 0 30px 32px;
          }

          .od-footer-top {
            margin: 0 -30px;
            padding: 28px 30px;
          }

          .od-header {
            gap: 16px;
          }

          .od-brand {
            width: 160px;
          }

          .od-desktop-nav {
            gap: 12px;
            font-size: 12px;
          }

          .od-header-actions {
            gap: 12px;
          }

          .od-header-actions .od-button {
            padding: 12px 17px;
            font-size: 12px !important;
          }

          .od-header-actions .od-text-button {
            height: 42px;
            padding: 0 12px;
            font-size: 12px;
          }

          .od-hero {
            min-height: 580px;
          }

          .od-device-anchor {
            right: 0;
            transform: translateY(-50%) scale(0.7);
            transform-origin: 100% 50%;
          }

          .od-device-anchor-ipad {
            right: 16px;
            transform: translateY(-50%) scale(0.62);
            transform-origin: 100% 50%;
          }

          .od-dashboard {
            grid-template-columns: 78px minmax(0, 1fr);
            min-height: 290px;
          }

          .od-dashboard-sidebar {
            font-size: 10px;
            padding: 14px 8px;
          }

          .od-dashboard-content {
            padding: 20px 12px;
          }

          .od-dashboard-heading {
            font-size: 12px;
          }

          .od-dashboard-heading > span {
            display: none;
          }

          .od-dashboard-stats {
            gap: 5px;
          }

          .od-dashboard-stats > div {
            padding: 9px 6px;
          }

          .od-dashboard-stats strong {
            font-size: 8px;
          }

          .od-section-heading > p {
            max-width: 285px;
          }

          .od-client-section {
            gap: 30px;
          }

          .od-final-cta {
            margin: 0 -30px;
            padding: 40px 36px;
          }

          .od-final-cta h2 {
            font-size: 44px;
          }

          .od-final-cta > img {
            width: 160px;
          }
        }

        @media (max-width: 820px) {
          .od-header {
            min-height: 80px;
            justify-content: space-between;
          }

          .od-desktop-nav,
          .od-header-actions {
            display: none;
          }

          .od-menu-button {
            display: block;
            border: 1px solid var(--od-line);
            background: white;
            padding: 9px 12px;
            border-radius: 7px;
            font-size: 13px !important;
          }

          .od-mobile-nav {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
            padding: 22px;
            border: 1px solid var(--od-line);
            border-radius: 12px;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .od-mobile-nav .od-text-button {
            text-align: left;
          }

          .od-hero {
            grid-template-columns: 1fr;
            min-height: 0;
            margin-bottom: 55px;
          }

          .od-hero-visual {
            display: none;
          }

          .od-hero-copy {
            gap: 28px;
          }

          .od-site h1 {
            font-size: clamp(42px, 11vw, 64px);
            letter-spacing: -1px;
          }

          .od-hero-copy > p {
            max-width: none;
          }

          .od-hero .od-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .od-hero .od-actions .od-button {
            width: 100%;
          }

          .od-dashboard {
            min-height: 315px;
            grid-template-columns: 78px minmax(0, 1fr);
          }

          .od-dashboard-sidebar {
            font-size: 8px;
          }

          .od-dashboard-content {
            padding: 23px 16px;
          }

          .od-dashboard-stats strong {
            font-size: 10px;
          }

          .od-services-shell {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 28px;
          }

          .od-section-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .od-section-heading > p {
            max-width: 440px;
          }

          .od-work-grid {
            grid-template-columns: 1fr;
          }

          .od-work-image {
            height: 385px;
          }

          .od-work-dashboard .od-dashboard {
            min-height: 380px;
          }

          .od-process {
            margin: 0 0 48px;
            padding: 28px 22px;
          }

          .od-steps-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .od-step,
          .od-step:nth-child(2) {
            padding-right: 0;
            border-right: 0;
          }

          .od-client-section {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .od-client-copy > p {
            max-width: 450px;
          }

          .od-final-cta {
            margin: 0 -30px;
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 36px 30px;
          }

          .od-final-cta-copy,
          .od-final-cta-copy p,
          .od-final-cta h2 {
            max-width: none;
          }

          .od-final-cta > img {
            justify-self: start;
            width: 120px;
          }

          .od-final-facts dd {
            font-size: 22px;
          }

        }

        @media (max-width: 480px) {
          .od-container {
            padding: 0 22px;
          }

          .od-hero::before {
            left: -22px;
            right: -22px;
          }

          .od-header-bar {
            margin: 0 -22px;
            padding: 0 22px;
          }

          .od-footer {
            margin: 0 -22px;
            padding: 0 22px 28px;
          }

          .od-footer-top {
            margin: 0 -22px;
            padding: 24px 22px;
          }

          .od-brand {
            width: 170px;
          }

          .od-site h1 {
            font-size: clamp(40px, 12vw, 48px);
          }

          .od-site h2 {
            font-size: clamp(32px, 9vw, 40px);
          }

          .od-hero-copy > p {
            font-size: 16px;
          }

          .od-button {
            padding: 13px 17px;
            font-size: 12px !important;
            gap: 14px;
          }

          .od-hero .od-actions {
            gap: 12px;
          }

          .od-dashboard {
            min-height: 210px;
            grid-template-columns: 48px minmax(0, 1fr);
          }

          .od-dashboard-sidebar {
            font-size: 5px;
            padding: 10px 4px;
          }

          .od-dashboard-sidebar img {
            width: 28px;
            margin-left: 3px;
          }

          .od-dashboard-sidebar > div {
            padding: 6px 2px;
          }

          .od-dashboard-content {
            padding: 15px 9px;
          }

          .od-dashboard-heading {
            margin-bottom: 12px;
            font-size: 9px;
          }

          .od-dashboard-stats span {
            font-size: 5px;
          }

          .od-dashboard-stats strong {
            font-size: 6px;
          }

          .od-dashboard-stats small {
            font-size: 4px;
          }

          .od-dashboard-stats > div {
            padding: 7px 4px;
          }

          .od-dashboard-progress {
            font-size: 7px;
            padding: 8px;
          }

          .od-section {
            margin-bottom: 55px;
          }

          .od-services-shell {
            padding: 18px;
          }

          .od-service-code {
            overflow-wrap: anywhere;
            font-size: 12px;
          }

          .od-work-image {
            height: 310px;
            padding-left: 15px;
            padding-right: 15px;
          }

          .od-property {
            padding: 15px;
          }

          .od-property h3 {
            font-size: 34px;
          }

          .od-house-art {
            right: -70px;
            opacity: .8;
          }

          .od-work-caption {
            padding: 18px;
          }

          .od-work-caption h3 {
            font-size: 18px;
          }

          .od-work-caption p {
            font-size: 8px;
          }

          .od-work-dashboard .od-dashboard {
            grid-template-columns: 50px minmax(0, 1fr);
          }

          .od-sales .od-dashboard-content {
            padding: 19px 9px;
          }

          .od-sales .od-dashboard-heading {
            font-size: 13px;
          }

          .od-sales .od-dashboard-stats strong {
            font-size: 16px;
          }

          .od-sales .od-dashboard-stats span {
            font-size: 7px;
          }

          .od-sales .od-dashboard-stats small {
            font-size: 5px;
          }

          .od-process {
            padding: 29px 25px;
          }

          .od-steps-grid {
            gap: 22px;
          }

          .od-step h3 {
            font-size: 16px;
          }

          .od-step p {
            font-size: 14px;
          }

          .od-client-card {
            padding: 18px;
          }

          .od-client-card-header {
            flex-wrap: wrap;
            gap: 12px;
          }

          .od-project-identity h3 {
            font-size: 16px;
          }

          .od-project-identity span {
            font-size: 13px;
          }

          .od-paid-badge {
            font-size: 12px;
            padding: 7px 11px;
          }

          .od-client-details {
            grid-template-columns: 1fr;
          }

          .od-client-detail {
            padding: 14px;
          }

          .od-detail-label {
            font-size: 12px;
          }

          .od-client-detail strong {
            font-size: 15px;
          }

          .od-client-detail small {
            font-size: 13px;
          }

          .od-final-cta {
            margin: 0 -22px;
            padding: 28px 22px;
          }

          .od-final-cta > img {
            width: 96px;
          }

          .od-final-cta h2 {
            font-size: clamp(32px, 9vw, 40px);
          }

          .od-final-cta .od-button {
            width: 100%;
          }

          .od-footer-top,
          .od-footer-base {
            flex-direction: column;
            align-items: flex-start;
          }

          .od-footer-columns {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .od-dialog {
            padding: 25px;
          }

          .od-form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .od-site *,
          .od-site *::before,
          .od-site *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
