"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOutAccount } from "@/app/sign-in/actions";

type Props = {
  locale: "en" | "es";
  name: string;
  email: string;
  avatarUrl: string | null;
  className?: string;
};

export default function AccountMenu({ locale, name, email, avatarUrl, className = "" }: Props) {
  const es = locale === "es";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const displayName = name.trim() || email;
  const initial = (displayName.charAt(0) || "?").toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()}>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white p-0 hover:border-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-none"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={es ? `Cuenta de ${displayName}` : `Account for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        {avatarUrl ? (
          // Google CDN avatars — plain img keeps referrerPolicy working without next/image config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-zinc-900 text-sm font-semibold text-white" aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[200px] rounded-xl border border-zinc-200 bg-white p-2 shadow-[0_12px_30px_rgba(24,24,27,0.12)]"
        >
          <p className="truncate border-b border-zinc-100 px-2.5 pb-2.5 pt-2 text-[13px] font-semibold text-zinc-900">
            {displayName}
          </p>
          <Link
            role="menuitem"
            href="/portal"
            className="mt-1 block rounded-lg px-2.5 py-2.5 text-sm text-zinc-700 no-underline hover:bg-zinc-100 hover:text-zinc-900"
            onClick={() => setOpen(false)}
          >
            {es ? "Tus proyectos" : "Your projects"}
          </Link>
          <form action={signOutAccount}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-lg border-0 bg-transparent px-2.5 py-2.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {es ? "Cerrar sesión" : "Sign out"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
