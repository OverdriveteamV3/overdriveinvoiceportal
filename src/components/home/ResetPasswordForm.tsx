"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { completeAccountReset } from "@/app/sign-in/actions";
import type { Locale } from "@/lib/locale";

const ERRORS: Record<string, string> = {
  "This reset link is invalid or expired.": "Este enlace no es válido o ya caducó.",
  "Use at least 8 characters.": "Usa al menos 8 caracteres.",
  "We could not update that password. Try again.":
    "No pudimos actualizar esa contraseña. Inténtalo de nuevo.",
};

export default function ResetPasswordForm({
  token,
  email,
  locale = "en",
}: {
  token: string;
  email: string;
  locale?: Locale;
}) {
  const es = locale === "es";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await completeAccountReset(new FormData(event.currentTarget));
    if (result?.error) {
      setError(es ? ERRORS[result.error] ?? result.error : result.error);
      setPending(false);
    }
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"} className="account-brand">
          <img src="/overdrive-logo.webp" alt="Over Drive" width={340} height={68} />
        </Link>
      </header>

      <main>
        <div className="account-panel">
          <Link href="/sign-in" className="account-back">
            <span aria-hidden="true">←</span>
            {es ? "Volver a entrar" : "Back to sign in"}
          </Link>

          <div className="account-copy">
            <p className="account-kicker">{es ? "Portal de clientes" : "Client portal"}</p>
            <h1>{es ? "Nueva contraseña." : "New password."}</h1>
            <p className="account-intro">
              {es
                ? `Elige una contraseña nueva para ${email}. Tu usuario es este mismo correo.`
                : `Choose a new password for ${email}. Your username is this same email.`}
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <input type="hidden" name="token" value={token} />
            <label>
              {es ? "Nueva contraseña" : "New password"}
              <span className="account-password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={200}
                />
                <button
                  type="button"
                  className="account-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword
                      ? es
                        ? "Ocultar contraseña"
                        : "Hide password"
                      : es
                        ? "Mostrar contraseña"
                        : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            <p className="account-hint">{es ? "Usa al menos 8 caracteres." : "Use at least 8 characters."}</p>
            {error ? (
              <p className="account-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="account-button" type="submit" disabled={pending}>
              {pending
                ? es
                  ? "Espera…"
                  : "Please wait…"
                : es
                  ? "Guardar e entrar"
                  : "Save and sign in"}
            </button>
          </form>
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
          background: transparent;
        }
        .account-brand {
          display: block;
          line-height: 0;
          padding: 0;
          border: 0;
          background: transparent;
        }
        .account-brand img {
          width: min(340px, 72vw);
          height: auto;
          display: block;
          background: transparent;
        }
        .account-page main {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          width: min(480px, calc(100% - 40px));
          margin: 0 auto;
          padding-top: 12px;
          padding-bottom: 72px;
        }
        .account-panel {
          position: relative;
          padding: 36px 32px 40px;
          border: 1px solid #e7ebef;
          border-radius: 16px;
          background: #fff;
        }
        .account-back {
          position: absolute;
          top: 36px;
          right: 36px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #5a6a73;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          text-decoration: none;
          white-space: nowrap;
        }
        .account-back:hover,
        .account-back:focus-visible { color: #151f24; }
        .account-copy {
          display: grid;
          gap: 12px;
          padding-right: 140px;
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
          font-size: clamp(44px, 8vw, 56px);
          font-weight: 400;
          letter-spacing: 0.3px;
          line-height: 0.9;
        }
        .account-intro {
          margin: 4px 0 0;
          max-width: 34ch;
          padding: 0 0 0 14px;
          border-left: 3px solid #0780f7;
          color: #3f505a;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
        }
        .account-page form {
          display: grid;
          gap: 16px;
          margin-top: 24px;
        }
        .account-page label {
          display: grid;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: #151f24;
        }
        .account-page input {
          width: 100%;
          min-height: 48px;
          padding: 0 14px;
          border: 1px solid #cbd5df;
          border-radius: 10px;
          background: #fff;
          color: #151f24;
          font: inherit;
          font-size: 15px;
        }
        .account-page input:focus {
          border-color: #0780f7;
          outline: none;
          box-shadow: 0 0 0 3px #0780f722;
        }
        .account-password-field { position: relative; display: block; }
        .account-password-field input { padding-right: 72px; }
        .account-password-toggle {
          position: absolute;
          top: 50%;
          right: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 36px;
          margin: 0;
          padding: 0 8px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #66727e;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transform: translateY(-50%);
        }
        .account-password-toggle:hover,
        .account-password-toggle:focus-visible {
          color: #151f24;
          background: #f3f5f7;
        }
        .account-hint {
          margin: -4px 0 0;
          color: #66727e;
          font-size: 13px;
        }
        .account-error {
          margin: 0;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fff1f2;
          color: #9f1239;
          font-size: 14px;
        }
        .account-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 50px;
          margin-top: 4px;
          border: 0;
          border-radius: 10px;
          background: #0780f7;
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }
        .account-button:hover,
        .account-button:focus-visible { background: #151f24; }
        .account-button:disabled { opacity: 0.7; cursor: wait; }
        @media (max-width: 640px) {
          .account-brand img { width: min(280px, 78vw); }
          .account-panel { padding: 28px 20px 32px; }
          .account-back { top: 28px; right: 24px; font-size: 12px; }
          .account-copy { padding-right: 120px; }
        }
      `}</style>
    </div>
  );
}
