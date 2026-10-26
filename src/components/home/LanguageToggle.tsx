"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { LOCALE_COOKIE } from "@/lib/locale";

export default function LanguageToggle({
  locale,
  tone = "light",
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div
      className={`od-lang${tone === "dark" ? " od-lang-dark" : ""}`}
      role="group"
      aria-label={locale === "es" ? "Idioma" : "Language"}
    >
      <button type="button" aria-pressed={locale === "en"} onClick={() => choose("en")}>
        English
      </button>
      <button
        type="button"
        className="od-lang-switch"
        role="switch"
        aria-checked={locale === "es"}
        aria-label={locale === "es" ? "Español" : "English"}
        onClick={() => choose(locale === "es" ? "en" : "es")}
      >
        <span />
      </button>
      <button type="button" aria-pressed={locale === "es"} onClick={() => choose("es")}>
        Español
      </button>
      <style>{`
        .od-lang {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          font-weight: 700;
        }
        .od-lang > button:not(.od-lang-switch) {
          border: 0;
          background: transparent;
          padding: 0;
          color: #7b8792;
          font: inherit;
          cursor: pointer;
        }
        .od-lang > button:not(.od-lang-switch)[aria-pressed="true"] {
          color: #0780f7;
        }
        .od-lang > button:not(.od-lang-switch):hover,
        .od-lang > button:not(.od-lang-switch):focus-visible {
          color: #151f24;
        }
        .od-lang .od-lang-switch {
          position: relative;
          box-sizing: border-box;
          width: 40px;
          height: 22px;
          padding: 0;
          border: 2px solid #151f24;
          border-radius: 999px;
          background: #fff;
          cursor: pointer;
        }
        .od-lang .od-lang-switch span {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0780f7;
          transition: transform 0.18s ease;
        }
        .od-lang .od-lang-switch[aria-checked="true"] {
          background: #0780f7;
        }
        .od-lang .od-lang-switch[aria-checked="true"] span {
          background: #fff;
          transform: translateX(18px);
        }
        .od-lang-dark > button:not(.od-lang-switch)[aria-pressed="true"] { color: #f8f959; }
        .od-lang-dark > button:not(.od-lang-switch):hover,
        .od-lang-dark > button:not(.od-lang-switch):focus-visible { color: #fff; }
        .od-lang-dark .od-lang-switch {
          border-color: #fff;
          background: transparent;
        }
        .od-lang-dark .od-lang-switch span { background: #f8f959; }
        .od-lang-dark .od-lang-switch[aria-checked="true"] {
          background: #f8f959;
        }
        .od-lang-dark .od-lang-switch[aria-checked="true"] span {
          background: #151f24;
        }
      `}</style>
    </div>
  );
}
