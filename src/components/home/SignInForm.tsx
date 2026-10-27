"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signInAccount, signUpAccount } from "@/app/sign-in/actions";
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

const GOOGLE_ERRORS: Record<string, { en: string; es: string }> = {
  google_config: {
    en: "Google sign-in is not configured yet.",
    es: "El acceso con Google aún no está configurado.",
  },
  google_start: {
    en: "Google sign-in could not start. Check the Google provider in Supabase.",
    es: "No se pudo iniciar el acceso con Google. Revisa el proveedor en Supabase.",
  },
  google_code: {
    en: "Google sign-in was cancelled or incomplete.",
    es: "El acceso con Google se canceló o no se completó.",
  },
  google_session: {
    en: "Google could not verify the session. Try again.",
    es: "Google no pudo verificar la sesión. Inténtalo de nuevo.",
  },
  google_account: {
    en: "We could not create or link that Google account.",
    es: "No pudimos crear o vincular esa cuenta de Google.",
  },
};

export default function SignInForm({
  nextPath,
  initialMode,
  locale = "en",
  authError = "",
}: {
  nextPath: string;
  initialMode: "in" | "up";
  locale?: Locale;
  authError?: string;
}) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [error, setError] = useState(() => {
    const mapped = GOOGLE_ERRORS[authError];
    if (!mapped) return "";
    return locale === "es" ? mapped.es : mapped.en;
  });
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
        <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"} className="account-brand">
          <img src="/overdrive-account-mark.webp" alt="Over Drive" />
        </Link>
      </header>

      <main>
        <div className="account-panel">
          <div className="account-copy">
            <p className="account-kicker">
              {nextPath === "/quote"
                ? es
                  ? "Siguiente paso"
                  : "Next step"
                : es
                  ? "Portal de clientes"
                  : "Client portal"}
            </p>
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
          </div>

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
            {signingUp ? (
              <p className="account-hint">{es ? "Usa al menos 8 caracteres." : "Use at least 8 characters."}</p>
            ) : null}
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
                : signingUp
                  ? es
                    ? "Crear cuenta"
                    : "Create account"
                  : es
                    ? "Entrar"
                    : "Sign in"}
            </button>
          </form>
        </div>

        <div className="account-oauth">
          <p>{es ? "O continúa con" : "Or continue with"}</p>
          <a
            className="account-google"
            href={`/auth/google?next=${encodeURIComponent(nextPath)}`}
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {es ? "Continuar con Google" : "Continue with Google"}
          </a>
        </div>

        <Link href="/" className="account-back">
          {es ? "Volver al inicio" : "Back to Home"}
        </Link>
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
          margin-bottom: 12px;
          padding-top: 28px;
          background: transparent;
        }
        .account-brand {
          display: block;
          line-height: 0;
          background: transparent;
        }
        .account-brand img {
          width: 168px;
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
          padding-bottom: 72px;
        }
        .account-oauth {
          display: grid;
          gap: 12px;
          margin-top: 22px;
          text-align: center;
        }
        .account-oauth > p {
          margin: 0;
          color: #66727e;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .account-google {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          min-height: 50px;
          border: 1px solid #d7dee5;
          border-radius: 10px;
          background: #fff;
          color: #151f24;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
        }
        .account-google svg {
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
        }
        .account-google:hover,
        .account-google:focus-visible {
          border-color: #151f24;
          background: #f8fafa;
        }
        .account-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          min-height: 40px;
          margin-top: 22px;
          padding: 0 14px;
          border: 1px solid #d7dee5;
          border-radius: 9px;
          background: #fff;
          color: #151f24;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }
        .account-back:hover,
        .account-back:focus-visible {
          border-color: #151f24;
          background: #151f24;
          color: #fff;
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
          font-size: clamp(44px, 8vw, 56px);
          font-weight: 400;
          letter-spacing: 0.3px;
          line-height: 0.9;
        }
        .account-intro {
          margin: 0;
          max-width: 34ch;
          color: #56616d;
          font-size: 15px;
          line-height: 1.5;
        }
        .account-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-top: 24px;
          padding: 4px;
          border: 1px solid #e7ebef;
          border-radius: 10px;
          background: #f8fafa;
        }
        .account-switch button {
          min-height: 42px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #66727e;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .account-switch button.is-active {
          background: #fff;
          color: #151f24;
          box-shadow: 0 1px 2px #151f2414;
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
          font-weight: 400;
        }
        .account-page input:focus {
          border-color: #0780f7;
          outline: none;
          box-shadow: 0 0 0 3px #0780f722;
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
        .account-button:focus-visible {
          background: #151f24;
        }
        .account-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .account-page :focus-visible { outline: 3px solid #4590ad; outline-offset: 3px; }
        @media (max-width: 640px) {
          .account-brand img { width: 140px; }
          .account-panel { padding: 28px 20px 32px; }
          .account-page h1 { font-size: clamp(34px, 10vw, 44px); }
        }
      `}</style>
    </div>
  );
}
