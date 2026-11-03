"use client";

import { useEffect, useState } from "react";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding/policy";
import { STACK_LINKS } from "@/lib/onboarding/providers";
import type { Locale } from "@/lib/locale";

type PublicIntake = {
  id: string;
  signatureName: string;
  signed: boolean;
  stack: {
    gmail?: { email?: string; verified?: boolean };
    github?: { login?: string; email?: string; verified?: boolean };
    hostinger?: { domain?: string; verified?: boolean };
    vercel?: { plan?: string; verified?: boolean };
    supabase?: { plan?: string; verified?: boolean };
    sells?: boolean | null;
    payments?: { provider?: string; verified?: boolean };
  };
  content: {
    contacts?: string;
    about?: string;
    products?: string;
    colors?: string[];
    fonts?: string;
    competitors?: string;
    logoChoice?: "upload" | "request" | "";
    files?: Array<{ group: string; name: string }>;
  };
  paymentStatus: string;
  stackReady: boolean;
  contentReady: boolean;
  paid: boolean;
  opportunityId: string | null;
};

type Providers = {
  gmail: boolean;
  github: boolean;
  hostinger: boolean;
  vercel: boolean;
  supabase: boolean;
  stripe: boolean;
  paypal: boolean;
  depositStripe: boolean;
  depositPaypal: boolean;
};

const STEPS = ["Sign", "Accounts", "Content", "Deposit"] as const;

export default function QuoteOnboarding({
  locale = "en",
  initialStep = 1,
  notice = "",
}: {
  locale?: Locale;
  initialStep?: number;
  notice?: string;
}) {
  const es = locale === "es";
  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStep)));
  const [intake, setIntake] = useState<PublicIntake | null>(null);
  const [providers, setProviders] = useState<Providers | null>(null);
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice);
  const [finished, setFinished] = useState(false);
  const [domainQuery, setDomainQuery] = useState("");
  const [domainMessage, setDomainMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/onboarding/intake")
      .then((response) => response.json())
      .then((body: { intake: PublicIntake | null; providers: Providers }) => {
        if (!active) return;
        setIntake(body.intake);
        setProviders(body.providers);
        setName(body.intake?.signatureName ?? "");
        setAccepted(Boolean(body.intake?.signed));
        if (body.intake?.opportunityId) setFinished(true);
      })
      .catch(() => {
        if (active) setError(es ? "No se pudo cargar el borrador." : "Could not load this draft.");
      });
    return () => {
      active = false;
    };
  }, [es]);

  async function save(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/onboarding/intake", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { intake?: PublicIntake; error?: string };
    setBusy(false);
    if (!response.ok || !result.intake) {
      setError(result.error || (es ? "No se pudo guardar." : "Could not save this step."));
      return null;
    }
    setIntake(result.intake);
    return result.intake;
  }

  async function startDeposit(provider: string) {
    setError("");
    const response = await fetch("/api/onboarding/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!result.url) {
      setError(result.error === "not_configured" ? "That payment method is not configured." : "Could not start checkout.");
      return;
    }
    window.location.assign(result.url);
  }

  async function upload(group: string, file: File) {
    const data = new FormData();
    data.set("group", group);
    data.set("file", file);
    setBusy(true);
    const response = await fetch("/api/onboarding/upload", { method: "POST", body: data });
    setBusy(false);
    if (!response.ok) {
      setError(es ? "No se pudo guardar el archivo." : "Could not store that file.");
      return;
    }
    const refreshed = await fetch("/api/onboarding/intake").then((item) => item.json());
    setIntake(refreshed.intake);
  }

  const signed = Boolean(name.trim() && accepted);
  const content = intake?.content ?? {};
  const colors = (content.colors ?? []).join(", ");

  function setContent(patch: PublicIntake["content"]) {
    setIntake((current) => (current ? { ...current, content: { ...current.content, ...patch } } : current));
  }

  return (
    <section className="quote-wizard">
      <ol className="quote-steps">
        {STEPS.map((label, index) => (
          <li key={label} data-current={step === index + 1 ? "true" : "false"}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {error ? <p className="quote-error" role="alert">{error}</p> : null}

      {finished ? (
        <div className="quote-success" role="status">
          <h2>{es ? "Solicitud recibida." : "Request received."}</h2>
          <p>{es ? "El equipo preparará la cotización." : "The team will prepare the quote."}</p>
        </div>
      ) : null}

      {!finished && step === 1 ? (
        <div>
          <h2>{es ? "Política de incorporación" : "Onboarding policy"}</h2>
          {ONBOARDING_SECTIONS.map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
          <label>
            {es ? "Nombre completo" : "Full name"}
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
          </label>
          <label className="quote-check">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            {es ? "Acepto estos términos." : "I accept these terms."}
          </label>
          <button
            className="quote-button"
            type="button"
            disabled={!signed || busy}
            onClick={async () => {
              const saved = await save({ signatureName: name, accepted: true });
              if (saved?.signed) setStep(2);
            }}
          >
            Next
          </button>
        </div>
      ) : null}

      {!finished && step === 2 ? (
        <div>
          <h2>{es ? "Cuentas del proyecto" : "Project accounts"}</h2>
          <StackRow
            name="Gmail"
            href={STACK_LINKS.gmail}
            configured={Boolean(providers?.gmail)}
            verified={Boolean(intake?.stack.gmail?.verified)}
            detail={intake?.stack.gmail?.email}
            connect="/api/onboarding/connect/gmail"
          />
          <StackRow
            name="GitHub"
            href={STACK_LINKS.github}
            configured={Boolean(providers?.github)}
            verified={Boolean(intake?.stack.github?.verified)}
            detail={intake?.stack.github?.login}
            connect="/api/onboarding/connect/github"
          />
          <StackRow
            name="Hostinger"
            href={STACK_LINKS.hostinger}
            configured={Boolean(providers?.hostinger)}
            verified={Boolean(intake?.stack.hostinger?.verified)}
            detail={intake?.stack.hostinger?.domain}
            connect="/api/onboarding/connect/hostinger"
          />
          <label>
            {es ? "Buscar dominio" : "Search a domain"}
            <input value={domainQuery} onChange={(event) => setDomainQuery(event.target.value)} placeholder="example.com" />
          </label>
          <button
            className="quote-button quote-button-secondary"
            type="button"
            onClick={async () => {
              const response = await fetch("/api/onboarding/domain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: domainQuery }),
              });
              const result = (await response.json()) as { error?: string; checkout?: string; available?: boolean };
              setDomainMessage(result.error || (result.available ? "Available. Continue on Hostinger." : "Hostinger did not confirm availability."));
              if (result.checkout) window.open(result.checkout, "_blank", "noopener,noreferrer");
            }}
          >
            {es ? "Buscar en Hostinger" : "Search on Hostinger"}
          </button>
          {domainMessage ? <p>{domainMessage}</p> : null}
          <StackRow
            name="Vercel Pro"
            href={STACK_LINKS.vercel}
            configured={Boolean(providers?.vercel)}
            verified={Boolean(intake?.stack.vercel?.verified)}
            detail={intake?.stack.vercel?.plan}
            connect="/api/onboarding/connect/vercel"
          />
          <StackRow
            name="Supabase Pro"
            href={STACK_LINKS.supabase}
            configured={Boolean(providers?.supabase)}
            verified={Boolean(intake?.stack.supabase?.verified)}
            detail={intake?.stack.supabase?.plan}
            connect="/api/onboarding/connect/supabase"
          />
          <fieldset>
            <legend>{es ? "¿Vendes en línea?" : "Will you sell online?"}</legend>
            <button type="button" className="quote-button quote-button-secondary" onClick={() => void save({ sells: false })}>
              No
            </button>
            <button type="button" className="quote-button quote-button-secondary" onClick={() => void save({ sells: true })}>
              Yes
            </button>
            <p>{intake?.stack.sells == null ? "" : intake.stack.sells ? "Yes" : "No"}</p>
          </fieldset>
          {intake?.stack.sells ? (
            <>
              <StackRow
                name="Stripe"
                href={STACK_LINKS.stripe}
                configured={Boolean(providers?.stripe)}
                verified={Boolean(intake.stack.payments?.verified && intake.stack.payments.provider === "stripe")}
                connect="/api/onboarding/connect/stripe"
              />
              <StackRow
                name="PayPal"
                href={STACK_LINKS.paypal}
                configured={Boolean(providers?.paypal)}
                verified={Boolean(intake.stack.payments?.verified && intake.stack.payments.provider === "paypal")}
                connect="/api/onboarding/connect/paypal"
              />
            </>
          ) : null}
          <button className="quote-button" type="button" disabled={!intake?.stackReady} onClick={() => setStep(3)}>
            Next
          </button>
        </div>
      ) : null}

      {!finished && step === 3 ? (
        <div>
          <h2>{es ? "Contenido" : "Content"}</h2>
          <label>
            Contacts
            <textarea value={content.contacts ?? ""} onChange={(event) => setContent({ contacts: event.target.value })} />
          </label>
          <label>
            About and bios
            <textarea value={content.about ?? ""} onChange={(event) => setContent({ about: event.target.value })} />
          </label>
          <label>
            Product information
            <textarea value={content.products ?? ""} onChange={(event) => setContent({ products: event.target.value })} />
          </label>
          <label>
            Color palette
            <input
              value={colors}
              placeholder="#111111, #006edb"
              onChange={(event) =>
                setContent({
                  colors: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Fonts
            <input value={content.fonts ?? ""} onChange={(event) => setContent({ fonts: event.target.value })} />
          </label>
          <label>
            Competitor links
            <textarea value={content.competitors ?? ""} onChange={(event) => setContent({ competitors: event.target.value })} />
          </label>
          <label>
            Logo
            <select
              value={content.logoChoice ?? ""}
              onChange={(event) => setContent({ logoChoice: event.target.value as "upload" | "request" | "" })}
            >
              <option value="">Choose one</option>
              <option value="upload">Upload a logo</option>
              <option value="request">Request a new logo</option>
            </select>
          </label>
          <label>
            Brand examples
            <input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload("examples", file); }} />
          </label>
          {content.logoChoice === "upload" ? (
            <label>
              Logo file
              <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload("logo", file); }} />
            </label>
          ) : null}
          <button
            className="quote-button"
            type="button"
            disabled={
              busy ||
              !content.contacts?.trim() ||
              !content.about?.trim() ||
              !content.products?.trim() ||
              !(content.colors ?? []).length ||
              (content.logoChoice !== "request" &&
                !(content.logoChoice === "upload" && content.files?.some((file) => file.group === "logo")))
            }
            onClick={async () => {
              const saved = await save({ content });
              if (saved?.contentReady) setStep(4);
              else setError("Add contacts, about, products, a color, and one logo choice.");
            }}
          >
            Next
          </button>
        </div>
      ) : null}

      {!finished && step === 4 ? (
        <div>
          <h2>Deposit $108.00</h2>
          <p>$100 plus 8% tax. Finish stays closed until the payment is confirmed.</p>
          <button className="quote-button" type="button" disabled={!providers?.depositStripe || intake?.paid} onClick={() => void startDeposit("stripe")}>
            {providers?.depositStripe ? "Pay with Stripe" : "Stripe is not configured"}
          </button>
          <button className="quote-button" type="button" disabled={!providers?.depositPaypal || intake?.paid} onClick={() => void startDeposit("paypal")}>
            {providers?.depositPaypal ? "Pay with PayPal" : "PayPal is not configured"}
          </button>
          <button className="quote-button" type="button" disabled={!providers?.depositPaypal || intake?.paid} onClick={() => void startDeposit("venmo")}>
            {providers?.depositPaypal ? "Pay with Venmo" : "Venmo is not configured"}
          </button>
          {intake?.paid ? <p role="status">Deposit confirmed.</p> : null}
          <button
            className="quote-button"
            type="button"
            disabled={!intake?.paid || busy}
            onClick={async () => {
              setBusy(true);
              const response = await fetch("/api/onboarding/finish", { method: "POST" });
              const result = (await response.json()) as { error?: string };
              setBusy(false);
              if (!response.ok) setError(result.error || "Could not finish.");
              else setFinished(true);
            }}
          >
            Finish
          </button>
        </div>
      ) : null}
    </section>
  );
}

function StackRow({
  name,
  href,
  configured,
  verified,
  detail,
  connect,
}: {
  name: string;
  href: string;
  configured: boolean;
  verified: boolean;
  detail?: string;
  connect: string;
}) {
  return (
    <div className="quote-stack">
      <strong>{name}</strong>
      <a href={href} target="_blank" rel="noreferrer">{href.replace(/^https:\/\//, "")}</a>
      <span>{verified ? `Verified${detail ? ` · ${detail}` : ""}` : configured ? "Not verified" : "Connection is not configured"}</span>
      <a className="quote-button quote-button-secondary" href={connect}>
        Connect
      </a>
    </div>
  );
}
