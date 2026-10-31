"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  requestAccountReset,
  signInAccount,
  signUpAccount,
} from "@/app/sign-in/actions";
import type { Locale } from "@/lib/locale";

const ACCOUNT_ERRORS: Record<string, string> = {
  "Add your name.": "Agrega tu nombre.",
  "Enter a valid email.": "Escribe un correo válido.",
  "Use at least 8 characters.": "Usa al menos 8 caracteres.",
  "An account with that email already exists. Sign in instead.":
    "Ya existe una cuenta con ese correo. Entra en su lugar.",
  "We could not create that account. Try again.": "No pudimos crear esa cuenta. Inténtalo de nuevo.",
  "Email or password is incorrect.": "El correo o la contraseña no son correctos.",
  "Password reset email is not configured yet.":
    "El correo de restablecimiento aún no está configurado.",
  "We could not send the reset email. Try again.":
    "No pudimos enviar el correo de restablecimiento. Inténtalo de nuevo.",
};

const RESET_OK =
  "If an account exists for that email, we sent a reset link. Check your inbox (and spam).";
const RESET_OK_ES =
  "Si existe una cuenta con ese correo, enviamos un enlace. Revisa tu bandeja (y spam).";

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
  const [mode, setMode] = useState<"in" | "up" | "forgot">(initialMode);
  const [error, setError] = useState(() => {
    const mapped = GOOGLE_ERRORS[authError];
    if (!mapped) return "";
    return locale === "es" ? mapped.es : mapped.en;
  });
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const signingUp = mode === "up";
  const forgetting = mode === "forgot";
  const es = locale === "es";

  function switchMode(next: "in" | "up" | "forgot") {
    setMode(next);
    setError("");
    setNotice("");
    setShowPassword(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);

    if (forgetting) {
      const result = await requestAccountReset(formData);
      if ("error" in result) {
        setError(es ? ACCOUNT_ERRORS[result.error] ?? result.error : result.error);
      } else {
        setNotice(es ? RESET_OK_ES : result.message || RESET_OK);
      }
      setPending(false);
      return;
    }

    const result = signingUp ? await signUpAccount(formData) : await signInAccount(formData);
    if (result?.error) {
      setError(es ? ACCOUNT_ERRORS[result.error] ?? result.error : result.error);
      setPending(false);
    }
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <Link href="/" aria-label={es ? "Inicio de Over Drive" : "Over Drive home"} className="account-brand">
          {/* Use the sitewide transparent lockup — not the black-plate app icon */}
          <img src="/overdrive-logo.webp" alt="Over Drive" width={340} height={68} />
        </Link>
      </header>

      <main>
        <div className="account-panel">
          <Link href="/" className="account-back">
            <span aria-hidden="true">←</span>
            {es ? "Volver al inicio" : "Back to Home"}
          </Link>

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
            <h1>
              {forgetting
                ? es
                  ? "Recupera el acceso."
                  : "Recover access."
                : signingUp
                  ? es
                    ? "Crea tu cuenta."
                    : "Create your account."
                  : es
                    ? "Entra."
                    : "Sign in."}
            </h1>
            <p className="account-intro">
              {forgetting
                ? es
                  ? "Tu usuario es el correo con el que te registraste. Te enviamos un enlace para restablecer la contraseña."
                  : "Your username is the email you signed up with. We’ll email a link to reset your password."
                : nextPath === "/quote"
                  ? es
                    ? "Entra para arrancar tu proyecto. Una cuenta nueva abre la cotización a continuación."
                    : "Sign in to start your project. New accounts continue straight into the quote."
                  : signingUp
                    ? es
                      ? "Crea tu acceso al portal para seguir proyectos, pagos y entregas."
                      : "Create your portal access to follow projects, payments, and delivery."
                    : es
                      ? "Abre tus proyectos, revisa el avance y gestiona pagos pendientes."
                      : "Open your projects, track delivery, and manage open balances."}
            </p>
          </div>

          {!forgetting ? (
            <div className="account-switch" role="tablist" aria-label={es ? "Entrar o crear cuenta" : "Sign in or sign up"}>
              <button
                type="button"
                role="tab"
                aria-selected={!signingUp}
                className={signingUp ? "" : "is-active"}
                onClick={() => switchMode("in")}
              >
                {es ? "Entrar" : "Sign in"}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={signingUp}
                className={signingUp ? "is-active" : ""}
                onClick={() => switchMode("up")}
              >
                {es ? "Crear cuenta" : "Sign up"}
              </button>
            </div>
          ) : null}

          <form onSubmit={onSubmit}>
            <input type="hidden" name="next" value={nextPath} />
            {signingUp ? (
              <>
                <label>
                  {es ? "Tu nombre" : "Your name"}
                  <input name="name" autoComplete="name" required maxLength={100} />
                </label>
                <label>
                  {es ? "Nombre del negocio" : "Business name"}
                  <input name="businessName" autoComplete="organization" maxLength={160} />
                </label>
              </>
            ) : null}
            <label>
              {es ? "Correo" : "Email"}
              <input name="email" type="email" autoComplete="email" required maxLength={200} />
            </label>
            {!forgetting ? (
              <label>
                {es ? "Contraseña" : "Password"}
                <span className="account-password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={signingUp ? "new-password" : "current-password"}
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
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 7c2.8 0 5 2.2 5 5 0 .7-.1 1.3-.4 1.9l1.5 1.5c1.1-1 1.9-2.3 2.4-3.7C19.2 8.3 15.9 5.5 12 5.5c-1.1 0-2.1.2-3.1.6l1.6 1.6c.5-.2 1-.2 1.5-.2zm-7.6-.9 1.5 1.5C4.6 9 3.6 10.5 3 12c1.3 3.5 4.6 6 9 6 1.4 0 2.7-.3 3.9-.8l1.4 1.4 1.1-1.1L5.5 5 4.4 6.1zM9.9 12.5l1.6 1.6c-.1 0-.2.1-.3.1-1.1 0-2-.9-2-2 0-.1 0-.2.1-.3zm2.6-2.6 2.6 2.6.1-.3c0-1.1-.9-2-2-2l-.7-.3z"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 5.5C8.1 5.5 4.8 8.3 3.5 12c1.3 3.7 4.6 6.5 8.5 6.5s7.2-2.8 8.5-6.5C19.2 8.3 15.9 5.5 12 5.5zm0 11c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"
                        />
                      </svg>
                    )}
                  </button>
                </span>
              </label>
            ) : null}
            {signingUp ? (
              <p className="account-hint">{es ? "Usa al menos 8 caracteres." : "Use at least 8 characters."}</p>
            ) : null}
            {!signingUp && !forgetting ? (
              <div className="account-auth-meta">
                <label className="account-remember">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  {es ? "Recordarme" : "Remember me"}
                </label>
                <button
                  type="button"
                  className="account-forgot"
                  onClick={() => switchMode("forgot")}
                >
                  {es ? "¿Olvidaste usuario o contraseña?" : "Forgot username / password?"}
                </button>
              </div>
            ) : null}
            {forgetting ? (
              <p className="account-hint">
                {es
                  ? "Usa el mismo correo de registro. El enlace caduca en 1 hora."
                  : "Use the same signup email. The link expires in 1 hour."}
              </p>
            ) : null}
            {error ? (
              <p className="account-error" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="account-notice" role="status">
                {notice}
              </p>
            ) : null}
            <button className="account-button" type="submit" disabled={pending}>
              {pending
                ? es
                  ? "Espera…"
                  : "Please wait…"
                : forgetting
                  ? es
                    ? "Enviar enlace"
                    : "Email reset link"
                  : signingUp
                    ? es
                      ? "Crear cuenta"
                      : "Create account"
                    : es
                      ? "Entrar"
                      : "Sign in"}
            </button>
            {forgetting ? (
              <button type="button" className="account-text-link" onClick={() => switchMode("in")}>
                {es ? "Volver a entrar" : "Back to sign in"}
              </button>
            ) : null}
          </form>
        </div>

        {!forgetting ? (
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
        ) : null}

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
          border-radius: 0;
          background: transparent;
          box-shadow: none;
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
        .account-back span {
          font-size: 15px;
          line-height: 1;
        }
        .account-back:hover,
        .account-back:focus-visible {
          color: #151f24;
          background: transparent;
        }
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
          position: relative;
          margin: 4px 0 0;
          max-width: 32ch;
          padding: 0 0 0 14px;
          border-left: 3px solid #0780f7;
          color: #3f505a;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.5;
          letter-spacing: -0.01em;
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
        .account-password-field {
          position: relative;
          display: block;
        }
        .account-password-field input {
          padding-right: 48px;
        }
        .account-password-toggle {
          position: absolute;
          top: 50%;
          right: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #66727e;
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
        .account-auth-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: -4px;
        }
        .account-remember {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #3f505a;
          cursor: pointer;
        }
        .account-remember input {
          width: 16px;
          min-height: 16px;
          margin: 0;
          padding: 0;
          accent-color: #0780f7;
          cursor: pointer;
        }
        .account-forgot,
        .account-text-link {
          margin: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #006edb;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }
        .account-forgot:hover,
        .account-forgot:focus-visible,
        .account-text-link:hover,
        .account-text-link:focus-visible {
          color: #151f24;
          text-decoration: underline;
        }
        .account-text-link {
          text-align: center;
          margin-top: -4px;
        }
        .account-error {
          margin: 0;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fff1f2;
          color: #9f1239;
          font-size: 14px;
        }
        .account-notice {
          margin: 0;
          padding: 12px 14px;
          border-radius: 10px;
          background: #ecfdf3;
          color: #166534;
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
          .account-brand img { width: min(280px, 78vw); }
          .account-panel { padding: 28px 20px 32px; }
          .account-back { top: 28px; right: 24px; font-size: 12px; }
          .account-copy { padding-right: 130px; }
          .account-page h1 { font-size: clamp(34px, 10vw, 44px); }
        }
      `}</style>
    </div>
  );
}
