import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import { getLocale } from "@/lib/get-locale";

export default async function PaymentCancelledPage() {
  const es = (await getLocale()) === "es";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#eceef1] px-6">
      <div className="mb-4 flex justify-center">
        <LanguageToggle locale={es ? "es" : "en"} />
      </div>
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{es ? "Pago cancelado" : "Payment cancelled"}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {es
            ? "No se hizo ningún cargo. Puedes volver al correo de la factura para pagar cuando quieras."
            : "No charge was made. You can return to the invoice email to pay when ready."}
        </p>
        <Link href="/" className="btn-outline mt-6 inline-flex">
          {es ? "Volver al inicio" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
