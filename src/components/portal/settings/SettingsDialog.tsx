"use client";

import { useEffect } from "react";

export default function SettingsDialog({
  open,
  title,
  description,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="od-settings-dialog" role="presentation" onClick={onClose}>
      <div
        className="od-settings-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="od-settings-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="od-settings-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </header>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
