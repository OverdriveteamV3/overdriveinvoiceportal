"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signOutAccount } from "@/app/sign-in/actions";
import LanguageToggle from "@/components/home/LanguageToggle";
import QuoteOnboarding from "@/components/home/QuoteOnboarding";
import { formatPhoneNumber } from "@/lib/client-form";
import type { Locale } from "@/lib/locale";

const SERVICES = [
  ["Website Development", "Desarrollo web"],
  ["Dashboards & CRMs", "Paneles y CRMs"],
  ["Apps & Software", "Apps y software"],
  ["UI/UX & Branding", "UI/UX y marca"],
] as const;

function websiteHostFromInput(value: string) {
  let text = value.trim().replace(/\s/g, "");
  text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  text = text.replace(/^\/+/, "");
  text = text.replace(/^www\./i, "");
  return text.slice(0, 196);
}

const QUOTE_ERRORS: Record<string, string> = {
  "Add your name, email, service, project name, and a short description.":
    "Agrega tu nombre, correo, servicio, nombre del proyecto y una breve descripción.",
  "Too many requests from this network. Please try again later.":
    "Demasiadas solicitudes desde esta red. Inténtalo más tarde.",
  "We could not save this request. Email admin@overdriveio.com and we will take it from there.":
    "No pudimos guardar esta solicitud. Escribe a admin@overdriveio.com y lo tomamos desde ahí.",
};

export default function QuoteRequestForm({
  defaults,
  locale = "en",
  resumeStep = 0,
  notice = "",
}: {
  defaults?: { name?: string; email?: string; service?: string; plan?: string };
  locale?: Locale;
  resumeStep?: number;
  notice?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [websiteHost, setWebsiteHost] = useState("");
  const [step, setStep] = useState(resumeStep);
  const es = locale === "es";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/onboarding/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      const message = result.error || "Could not start onboarding.";
      setError(es ? QUOTE_ERRORS[message] ?? message : message);
      return;
    }
    setStep(1);
  }

  return (
    <div className="quote-page">
      <header className="quote-header">
        <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"}>
          <img src="/overdrive-logo.webp" alt="Over Drive" />
        </Link>
        <span className="quote-header-links">
          <LanguageToggle locale={locale} />
          {defaults?.email ? (
            <form action={signOutAccount}>
              <button type="submit">{es ? "Salir" : "Sign out"}</button>
            </form>
          ) : null}
          <Link href="/" className="quote-back">{es ? "Volver al inicio" : "Back to Home"}</Link>
        </span>
      </header>

      <main>
        <p className="quote-eyebrow">{es ? "Pedir una cotización" : "Request a quote"}</p>
        <h1>{es ? "Cuéntanos el proyecto." : "Tell us about the project."}</h1>
        <p className="quote-intro">
          {es
            ? "Con unos datos basta para definir el alcance, el plazo y la cotización. Te contactaremos por el medio que elijas."
            : "A few details are enough for a clear scope, timeline, and quote. We will follow up using the contact method you choose."}
        </p>

        {step > 0 ? (
          <QuoteOnboarding locale={locale} initialStep={step} notice={notice} />
        ) : (
          <form onSubmit={onSubmit}>
            <fieldset>
              <legend>{es ? "Sobre ti" : "About you"}</legend>
              <div className="quote-grid">
                <label>
                  {es ? "Tu nombre" : "Your name"}
                  <input name="name" autoComplete="name" required maxLength={100} defaultValue={defaults?.name ?? ""} />
                </label>
                <label>
                  {es ? "Correo" : "Email"}
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={200}
                    defaultValue={defaults?.email ?? ""}
                  />
                </label>
                <label>
                  {es ? "Teléfono" : "Phone"}
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    placeholder="(555) 555-5555"
                    value={phone}
                    onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
                  />
                </label>
                <label>
                  {es ? "Empresa" : "Company"}
                  <input name="company" autoComplete="organization" maxLength={160} />
                </label>
              </div>
              <label>
                {es ? "Contacto preferido" : "Preferred contact"}
                <select name="preferredContact" defaultValue="Email">
                  <option value="Email">{es ? "Correo" : "Email"}</option>
                  <option value="Phone">{es ? "Teléfono" : "Phone"}</option>
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend>{es ? "El proyecto" : "The project"}</legend>
              <div className="quote-grid">
                <label>
                  {es ? "Servicio" : "Service"}
                  <select
                    name="service"
                    required
                    defaultValue={
                      defaults?.service && SERVICES.some(([value]) => value === defaults.service)
                        ? defaults.service
                        : SERVICES[0][0]
                    }
                  >
                    {SERVICES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {es ? label : value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {es ? "Nombre del proyecto" : "Project name"}
                  <input
                    name="projectName"
                    required
                    maxLength={140}
                    placeholder={es ? "Rediseño del sitio" : "Website redesign"}
                    defaultValue={defaults?.plan ?? ""}
                  />
                </label>
              </div>
              <label>
                {es ? "¿Qué quieres construir?" : "What do you want to build?"}
                <textarea
                  name="details"
                  required
                  minLength={10}
                  maxLength={4000}
                  placeholder={
                    es
                      ? "Para quién es, qué debe hacer y cómo se ve terminado."
                      : "Who it is for, what it needs to do, and what done looks like."
                  }
                />
              </label>
              <label>
                {es ? "Metas" : "Goals"}
                <textarea
                  name="goals"
                  maxLength={1000}
                  placeholder={es ? "Lanzar, conseguir leads, un flujo más simple..." : "Launch, leads, a simpler workflow..."}
                />
              </label>
              <label>
                {es ? "Sitio actual" : "Current website"}
                <span className="quote-website">
                  <span aria-hidden="true">www.</span>
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="example.com"
                    maxLength={196}
                    spellCheck={false}
                    aria-label={es ? "Sitio actual, www." : "Current website, www."}
                    value={websiteHost}
                    onChange={(event) => setWebsiteHost(websiteHostFromInput(event.target.value))}
                  />
                </span>
                <input type="hidden" name="website" value={websiteHost ? `www.${websiteHost}` : ""} />
              </label>
            </fieldset>

            <fieldset>
              <legend>{es ? "Plazo y presupuesto" : "Timeline and budget"}</legend>
              <div className="quote-grid quote-grid-3">
                <label>
                  {es ? "Plazo" : "Timeline"}
                  <select name="timeline" defaultValue="Flexible">
                    <option value="As soon as possible">{es ? "Lo antes posible" : "As soon as possible"}</option>
                    <option value="Within a month">{es ? "En un mes" : "Within a month"}</option>
                    <option value="1–3 months">{es ? "1–3 meses" : "1–3 months"}</option>
                    <option value="Flexible">{es ? "Flexible" : "Flexible"}</option>
                  </select>
                </label>
                <label>
                  {es ? "Rango de presupuesto" : "Budget range"}
                  <select name="budget" defaultValue="Not sure yet">
                    <option value="Not sure yet">{es ? "Aún no sé" : "Not sure yet"}</option>
                    <option>$200-$500</option>
                    <option>$500-$1,000</option>
                    <option>$1,000-$1,000+</option>
                  </select>
                </label>
                <label>
                  {es ? "Fecha objetivo" : "Target launch"}
                  <input name="launchDate" type="date" />
                </label>
              </div>
            </fieldset>

            {error ? (
              <p className="quote-error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="quote-button" type="submit" disabled={saving}>
              {saving ? (es ? "Guardando…" : "Saving…") : "Next"}
            </button>
          </form>
        )}
      </main>

      <style>{`
        .quote-page {
          min-height: 100vh;
          background: #fff;
          color: #151f24;
          font-family: Arial, Helvetica, sans-serif;
        }
        .quote-page * { box-sizing: border-box; }
        .quote-header, .quote-page main {
          width: min(760px, calc(100% - 48px));
          margin: 0 auto;
        }
        .quote-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 88px;
        }
        .quote-header img { width: 180px; height: auto; }
        .quote-header-links { display: flex; align-items: center; gap: 16px; }
        .quote-header a, .quote-header button {
          border: 0;
          padding: 0;
          background: none;
          color: #151f24;
          font: inherit;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
        }
        .quote-header .quote-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          font-weight: 700;
        }
        .quote-header .quote-back:hover,
        .quote-header .quote-back:focus-visible {
          border-color: #151f24;
          background: #151f24;
          color: #fff;
        }
        .quote-eyebrow {
          margin: 12px 0 10px;
          color: #006edb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .quote-page h1 {
          margin: 0;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: -1.2px;
          line-height: 0.95;
        }
        .quote-intro { max-width: 520px; color: #56616d; font-size: 16px; line-height: 1.5; }
        .quote-page fieldset {
          margin: 28px 0 0;
          padding: 0;
          border: 0;
          border-top: 1px solid #e7ebef;
        }
        .quote-page legend {
          padding: 18px 0 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .quote-page label { display: block; margin-top: 14px; font-size: 13px; font-weight: 600; }
        .quote-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .quote-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .quote-page input, .quote-page select, .quote-page textarea {
          display: block;
          width: 100%;
          margin-top: 6px;
          padding: 11px 12px;
          border: 1px solid #cbd5df;
          border-radius: 8px;
          background: #fff;
          color: #151f24;
          font: inherit;
          font-weight: 400;
        }
        .quote-page textarea { min-height: 110px; resize: vertical; }
        .quote-website {
          display: flex;
          align-items: center;
          margin-top: 6px;
          border: 1px solid #cbd5df;
          border-radius: 8px;
          background: #fff;
        }
        .quote-website > span {
          padding-left: 12px;
          color: #56616d;
          font-weight: 600;
        }
        .quote-website input {
          margin-top: 0;
          border: 0;
          border-radius: 8px;
          padding-left: 0;
          background: transparent;
        }
        .quote-website:focus-within { outline: 3px solid #4590ad; outline-offset: 3px; }
        .quote-website input:focus-visible { outline: none; }
        .quote-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 22px;
          margin-bottom: 80px;
          border: 0;
          border-radius: 9px;
          padding: 14px 22px;
          background: #0780f7;
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }
        .quote-button:disabled { opacity: 0.7; cursor: wait; }
        .quote-error {
          margin: 0 0 16px;
          color: #9f1239;
          font-size: 14px;
        }
        .quote-success {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #e7ebef;
        }
        .quote-success h2 { margin: 0 0 8px; font-size: 22px; }
        .quote-success p { color: #56616d; }
        .quote-page :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        .quote-steps { display: flex; gap: 12px; margin: 0 0 20px; padding: 0; list-style: none; color: #56616d; font-size: 13px; font-weight: 700; }
        .quote-steps [data-current="true"] { color: #006edb; }
        .quote-wizard h2 { margin: 8px 0 12px; font-size: 28px; }
        .quote-wizard h3 { margin: 16px 0 4px; font-size: 15px; }
        .quote-wizard article p { margin: 0; color: #56616d; line-height: 1.5; }
        .quote-check { display: flex; align-items: center; gap: 8px; }
        .quote-check input { width: auto; margin: 0; }
        .quote-stack { display: grid; grid-template-columns: 120px minmax(0, 1fr) auto; gap: 8px 16px; align-items: center; margin: 14px 0; padding: 12px; border: 1px solid #e7ebef; border-radius: 10px; }
        .quote-stack a { color: #006edb; font-size: 13px; overflow-wrap: anywhere; }
        .quote-stack span { grid-column: 1 / -1; color: #56616d; font-size: 13px; }
        .quote-button-secondary { display: inline-flex; width: auto; margin: 0; background: #151f24; }
        .quote-stack .quote-button { margin: 0; min-height: 36px; padding: 8px 14px; }
        .quote-button:disabled { opacity: 0.45; cursor: not-allowed; }
        @media (max-width: 640px) {
          .quote-grid, .quote-grid-3 { grid-template-columns: 1fr; }
          .quote-header {
            flex-wrap: wrap;
            gap: 12px;
            min-height: 0;
            padding: 16px 0;
          }
          .quote-header img { width: 140px; }
          .quote-header-links { flex-wrap: wrap; justify-content: flex-end; }
          .quote-page h1 { font-size: clamp(36px, 10vw, 48px); }
          .quote-button { width: 100%; }
        }
      `}</style>
    </div>
  );
}
