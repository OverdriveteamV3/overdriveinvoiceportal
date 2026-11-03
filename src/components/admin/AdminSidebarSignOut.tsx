"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AccountFace = {
  name: string;
  logo: string;
};

export default function AdminSidebarSignOut() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [face, setFace] = useState<AccountFace | null>(null);

  useEffect(() => {
    let stop = false;
    fetch("/api/admin/account", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { settings?: { displayName?: string; username?: string; logo?: string } } | null) => {
        if (stop || !body?.settings) return;
        const name = body.settings.displayName?.trim() || body.settings.username?.trim() || "";
        setFace({ name, logo: body.settings.logo?.trim() || "" });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/sign-in");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const name = face?.name || "Account";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={signingOut}
      className="admin-sidebar-link w-full disabled:opacity-50"
      aria-label={signingOut ? "Signing out" : `Sign out ${name}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600">
        {face?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={face.logo} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-semibold text-zinc-900">{name}</span>
        <span className="block text-[11px] font-medium text-zinc-500">
          {signingOut ? "Signing out…" : "Sign out"}
        </span>
      </span>
    </button>
  );
}
