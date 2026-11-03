"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/admin", "/portal", "/invoice", "/sign-in", "/api"];

export default function DevPreviewBar() {
  const path = usePathname();
  if (HIDDEN_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-zinc-900 px-4 py-2 text-xs text-white">
      <p>Dev preview. Visitors still see the maintenance page.</p>
      <a href="/api/admin/site-preview?exit=1" className="shrink-0 font-semibold underline">
        Exit preview
      </a>
    </div>
  );
}
