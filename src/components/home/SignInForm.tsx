"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signInAccount, signUpAccount } from "@/app/sign-in/actions";
import LanguageToggle from "@/components/home/LanguageToggle";
import type { Locale } from "@/lib/locale";

const ACCOUNT_ERRORS: Record<string, string> = {
  "Add your name.": "Agrega tu nombre.",
  "Enter a valid email.": "Escribe un correo válido.",
  "Use at least 8 characters.": "Usa al menos 8 caracteres.",
  "An account with that email already exists. Sign in instead.":
    "Ya existe una cuenta con ese correo. Entra en su lugar.",
  "We could not create that account. Try again.": "No pudimos crear esa cuenta. Inténtalo de nuevo.",
  "Email or password is incorrect.": "El correo o la contraseña no son correctos.",
};

export default function SignInForm({
  nextPath,
  initialMode,
  locale = "en",
}: {
  nextPath: string;
  initialMode: "in" | "up";
  locale?: Locale;
}) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const signingUp = mode === "up";
  const es = locale === "es";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = signingUp
      ? await signUpAccount(new FormData(event.currentTarget))
      : await signInAccount(new FormData(event.currentTarget));
    if (result?.error) {
      setError(es ? ACCOUNT_ERRORS[result.error] ?? result.error : result.error);
      setPending(false);
    }
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"}>
          <img src="/overdrive-logo.webp" alt="Over Drive" />
        </Link>
        <span className="account-header-links">
          <LanguageToggle locale={locale} />
          <Link href="/">{es ? "Volver al inicio" : "Back to Home"}</Link>
        </span>
      </header>

      <main>
        <p className="account-eyebrow">{es ? "Cuenta" : "Account"}</p>
        <h1>{signingUp ? (es ? "Crea tu cuenta." : "Create your account.") : es ? "Entra." : "Sign in."}</h1>
        <p className="account-intro">
          {nextPath === "/quote"
            ? es
              ? "Entra para iniciar tu proyecto. Una cuenta nueva abre el formulario de cotización."
              : "Sign in to start your project. A new account opens the quote form next."
            : es
              ? "Entra para ver tus proyectos, o crea una cuenta para empezar."
              : "Sign in to open your projects, or create an account to get started."}
        </p>

        <div className="account-switch" role="tablist" aria-label={es ? "Entrar o crear cuenta" : "Sign in or sign up"}>
          <button
            type="button"
            role="tab"
            aria-selected={!signingUp}
            className={signingUp ? "" : "is-active"}
            onClick={() => {
              setMode("in");
              setError("");
            }}
          >
            {es ? "Entrar" : "Sign in"}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={signingUp}
            className={signingUp ? "is-active" : ""}
            onClick={() => {
              setMode("up");
              setError("");
            }}
          >
            {es ? "Crear cuenta" : "Sign up"}
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <input type="hidden" name="next" value={nextPath} />
          {signingUp ? (
            <label>
              {es ? "Tu nombre" : "Your name"}
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
          ) : null}
          <label>
            {es ? "Correo" : "Email"}
            <input name="email" type="email" autoComplete="email" required maxLength={200} />
          </label>
          <label>
            {es ? "Contraseña" : "Password"}
            <input
              name="password"
              type="password"
              autoComplete={signingUp ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={200}
            />
          </label>
          {error ? (
            <p className="account-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="account-button" type="submit" disabled={pending}>
            {pending ? (es ? "Espera…" : "Please wait…") : signingUp ? (es ? "Crear cuenta" : "Create account") : es ? "Entrar" : "Sign in"}
          </button>
        </form>
      </main>

      <style>{`
        .account-page {
          min-height: 100vh;
          background: #fff;
          color: #151f24;
          font-family: Arial, Helvetica, sans-serif;
        }
        .account-page * { box-sizing: border-box; }
        .account-header, .account-page main {
          width: min(560px, calc(100% - 48px));
          margin: 0 auto;
        }
        .account-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 88px;
        }
        .account-header img { width: 180px; height: auto; }
        .account-header a { color: #151f24; font-size: 13px; text-decoration: none; }
        .account-header-links { display: flex; align-items: center; gap: 16px; }
        .account-eyebrow {
          margin: 12px 0 10px;
          color: #006edb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .account-page h1 {
          margin: 0;
          font-family: Impact, "Arial Narrow", sans-serif;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: -1.2px;
          line-height: 0.95;
        }
        .account-intro { max-width: 460px; color: #56616d; font-size: 16px; line-height: 1.5; }
        .account-switch {
          display: flex;
          gap: 8px;
          margin-top: 28px;
        }
        .account-switch button {
          border: 1px solid #e7ebef;
          border-radius: 999px;
          padding: 8px 14px;
          background: #fff;
          color: #56616d;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .account-switch button.is-active {
          border-color: #0780f7;
          background: #0780f7;
          color: #fff;
        }
        .account-page label { display: block; margin-top: 14px; font-size: 13px; font-weight: 600; }
        .account-page input {
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
        .account-button {
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
          cursor: pointer;
        }
        .account-button:disabled { opacity: 0.7; cursor: wait; }
        .account-error { margin: 16px 0 0; color: #9f1239; font-size: 14px; }
        .account-page :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        @media (max-width: 640px) {
          .account-header {
            flex-wrap: wrap;
            gap: 12px;
            min-height: 0;
            padding: 16px 0;
          }
          .account-header img { width: 140px; }
          .account-header-links { flex-wrap: wrap; justify-content: flex-end; }
          .account-page h1 { font-size: clamp(36px, 10vw, 48px); }
          .account-switch { flex-wrap: wrap; }
          .account-button { width: 100%; }
        }
      `}</style>
    </div>
  );
}
