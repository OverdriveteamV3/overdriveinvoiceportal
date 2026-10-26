import Link from "next/link";
import LanguageToggle from "@/components/home/LanguageToggle";
import { getLocale } from "@/lib/get-locale";

export default async function PaymentSuccessPage() {
  const es = (await getLocale()) === "es";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#eceef1] px-6">
      <div className="mb-4 flex justify-center">
        <LanguageToggle locale={es ? "es" : "en"} />
      </div>
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">{es ? "Pago enviado" : "Payment submitted"}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {es
            ? "Stripe tiene tu pago. Queda registrado en la factura solo cuando llega la confirmación, no desde esta página."
            : "Stripe has your payment. It is recorded on the invoice only after the confirmation webhook arrives, not from this page."}
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          {es ? "Volver al inicio" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
