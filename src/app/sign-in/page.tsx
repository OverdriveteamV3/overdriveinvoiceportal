import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "@/components/home/SignInForm";
import { getPortalAccount, safeNextPath } from "@/lib/crm/portal-account";
import { getLocale } from "@/lib/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "es"
    ? {
        title: "Entrar | Over Drive",
        description: "Entra o crea una cuenta de Over Drive para iniciar un proyecto.",
      }
    : {
        title: "Sign in | Over Drive",
        description: "Sign in or create an Over Drive account to start a project.",
      };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const [account, locale] = await Promise.all([getPortalAccount(), getLocale()]);
  if (account) redirect(nextPath);

  return (
    <SignInForm
      nextPath={nextPath}
      initialMode={nextPath === "/quote" ? "up" : "in"}
      locale={locale}
      authError={params.error ?? ""}
    />
  );
}
