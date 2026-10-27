import Link from "next/link";
import { signOutAccount } from "@/app/sign-in/actions";
import AccountMenu from "@/components/portal/AccountMenu";
import LanguageToggle from "@/components/home/LanguageToggle";
import type { PortalAccount } from "@/lib/crm/portal-account";

type Props = {
  locale: "en" | "es";
  account: PortalAccount;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  /** Compact avatar dropdown only — used on /portal home. */
  compactProfile?: boolean;
};

function Avatar({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const displayName = name.trim() || email;
  const initial = (displayName.charAt(0) || "?").toUpperCase();
  return (
    <span className="inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-900">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-full w-full place-items-center text-sm font-semibold text-white" aria-hidden="true">
          {initial}
        </span>
      )}
    </span>
  );
}

export default function PortalHeader({
  locale,
  account,
  title,
  subtitle,
  backHref,
  backLabel,
  compactProfile = false,
}: Props) {
  const es = locale === "es";
  const displayName = account.name?.trim() || account.email;

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        {compactProfile ? (
          <AccountMenu
            locale={locale}
            name={account.name}
            email={account.email}
            avatarUrl={account.avatarUrl}
          />
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={account.name} email={account.email} avatarUrl={account.avatarUrl} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {es ? "Sesión iniciada" : "Signed in"}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-zinc-900">{displayName}</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <LanguageToggle locale={locale} />
          {!compactProfile ? (
            <form action={signOutAccount}>
              <button
                type="submit"
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                {es ? "Cerrar sesión" : "Sign out"}
              </button>
            </form>
          ) : null}
          <Link
            href="/"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {es ? "Volver al inicio" : "Back to Home"}
          </Link>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          {backHref ? (
            <Link href={backHref} className="text-sm text-zinc-500 hover:text-zinc-800">
              {backLabel ?? (es ? "Todos los proyectos" : "All projects")}
            </Link>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Over Drive</p>
          )}
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}
