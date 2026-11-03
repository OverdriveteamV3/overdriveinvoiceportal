import type { ReactNode } from "react";
import { getLocale } from "@/lib/get-locale";
import { DEFAULT_MAINTENANCE_MESSAGE, getSecurityOverview } from "@/lib/site-security";

const SPANISH_MESSAGE =
  "El sitio de Over Drive IO está en mantenimiento.\nSi necesitas contactarnos, envíanos un correo o selecciona el chat de atención al cliente en la parte inferior derecha de la pantalla.";

function linkify(line: string, email: string) {
  const mailto = `mailto:${email}`;
  const needles = [email, "email us", "envíanos un correo"].filter((item) => item.length > 0);
  const pattern = new RegExp(`(${needles.map(escapeRegExp).join("|")})`, "gi");
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(line.slice(last, start));
    nodes.push(
      <a key={start} className="font-medium text-zinc-900 underline" href={mailto}>
        {match[0]}
      </a>
    );
    last = start + match[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function MaintenancePage() {
  const [locale, settings] = await Promise.all([getLocale(), getSecurityOverview()]);
  const spanish = locale === "es";
  const message =
    spanish && settings.message === DEFAULT_MAINTENANCE_MESSAGE ? SPANISH_MESSAGE : settings.message;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] px-6 py-16 text-center text-zinc-900">
      <img src="/overdrive-mark.webp" alt="Over Drive" className="h-40 w-auto" />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {spanish ? "Mantenimiento" : "Maintenance"}
      </p>
      <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight">
        {spanish ? "Volvemos en breve." : "We'll be back shortly."}
      </h1>
      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-zinc-600">
        {message.split("\n").map((line, index) => (
          <span key={index}>
            {index > 0 ? <br /> : null}
            {linkify(line, settings.email)}
          </span>
        ))}
      </p>
    </main>
  );
}
