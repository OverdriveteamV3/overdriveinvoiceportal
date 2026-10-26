"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/locale";

const COOKIE_NAME = "overdrive-cookie-consent";

function readChoice() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function CookieNotice({ locale = "en" }: { locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const es = locale === "es";

  useEffect(() => {
    if (!readChoice()) setOpen(true);
  }, []);

  function save(choice: "accepted" | "declined") {
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(choice)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="cookie-notice"
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-copy"
    >
      <p id="cookie-notice-title">{es ? "Cookies" : "Cookies"}</p>
      <p id="cookie-notice-copy">
        {es
          ? "Usamos una cookie para recordar esta elección. El acceso al portal de clientes y al admin usa una cookie de sesión aparte. "
          : "We use a cookie to remember this choice. Sign-in for the client portal and admin uses a separate session cookie. "}
        <Link href="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
      </p>
      <div className="cookie-notice-actions">
        <button type="button" className="cookie-decline" onClick={() => save("declined")}>
          {es ? "Rechazar" : "Decline"}
        </button>
        <button type="button" className="cookie-accept" onClick={() => save("accepted")}>
          {es ? "Aceptar" : "Accept"}
        </button>
      </div>
      <style>{`
        .cookie-notice {
          position: fixed;
          z-index: 40;
          right: 24px;
          bottom: 96px;
          width: min(380px, calc(100% - 32px));
          padding: 22px;
          border: 1px solid #e7ebef;
          border-radius: 18px;
          background: #fff;
          color: #151f24;
          box-shadow: 0 16px 40px #151f2418;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
        }
        .cookie-notice p { margin: 0; }
        #cookie-notice-title {
          font-size: 16px;
          font-weight: 700;
        }
        #cookie-notice-copy {
          margin-top: 8px;
          color: #3d4852;
          font-size: 14px;
        }
        .cookie-notice a { color: #0780f7; text-decoration: none; }
        .cookie-notice-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }
        .cookie-notice button {
          border-radius: 9px;
          padding: 11px 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .cookie-decline {
          border: 1px solid #e7ebef;
          background: #fff;
          color: #151f24;
        }
        .cookie-accept {
          border: 1px solid transparent;
          background: #0780f7;
          color: #fff;
        }
        @media (max-width: 640px) {
          .cookie-notice { right: 16px; left: 16px; width: auto; bottom: 88px; }
          .cookie-notice-actions { flex-wrap: wrap; }
          .cookie-notice-actions button { flex: 1 1 120px; }
        }
      `}</style>
    </div>
  );
}
