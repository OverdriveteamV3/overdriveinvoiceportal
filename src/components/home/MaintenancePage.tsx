import { getLocale } from "@/lib/get-locale";

export default async function MaintenancePage() {
  const locale = await getLocale();
  const spanish = locale === "es";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] px-6 py-16 text-center text-zinc-900">
      <img src="/overdrive-logo.webp" alt="Over Drive" className="h-10 w-auto" />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {spanish ? "Mantenimiento" : "Maintenance"}
      </p>
      <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight">
        {spanish ? "Volvemos en breve." : "We'll be back shortly."}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
        {spanish
          ? "Over Drive está actualizando el sitio. Escríbenos a admin@overdriveio.com si nos necesitas."
          : "Over Drive is updating the website. Email admin@overdriveio.com if you need us."}
      </p>
    </main>
  );
}
