"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { updatePortalProfile } from "@/app/portal/settings/actions";

type Props = {
  locale: "en" | "es";
  name: string;
  email: string;
  avatarUrl: string | null;
};

export default function PortalSettingsForm({ locale, name, email, avatarUrl }: Props) {
  const es = locale === "es";
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = (value.trim().charAt(0) || email.charAt(0) || "?").toUpperCase();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updatePortalProfile(formData);
      if (result.error) {
        setError(
          result.error === "Add your name."
            ? es
              ? "Añade tu nombre."
              : result.error
            : result.error === "Sign in required."
              ? es
                ? "Debes iniciar sesión."
                : result.error
              : es
                ? "No se pudo guardar el perfil."
                : result.error
        );
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="od-portal-settings">
      <div className="od-portal-settings-profile">
        <span className="od-portal-settings-avatar">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </span>
        <div>
          <p className="od-portal-settings-email">{email}</p>
          <p className="od-portal-settings-note">
            {es
              ? "El correo viene de tu cuenta. La foto de Google se actualiza al volver a entrar con Google."
              : "Email comes from your account. Your Google photo refreshes the next time you sign in with Google."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="od-portal-settings-form">
        <label htmlFor="portal-settings-name">{es ? "Nombre" : "Display name"}</label>
        <input
          id="portal-settings-name"
          name="name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={100}
          required
        />
        {error ? <p className="od-portal-flash is-error">{error}</p> : null}
        {saved ? (
          <p className="od-portal-flash is-ok">{es ? "Guardado." : "Saved."}</p>
        ) : null}
        <div className="od-portal-settings-actions">
          <button type="submit" disabled={pending}>
            {pending ? (es ? "Guardando…" : "Saving…") : es ? "Guardar" : "Save"}
          </button>
          <Link href="/portal">{es ? "Volver a proyectos" : "Back to projects"}</Link>
        </div>
      </form>
    </div>
  );
}
