"use client";

import { useState } from "react";
import { SOCIAL_PLATFORMS, type SocialLinks, type SocialPlatformId } from "@/lib/socials";

export default function SocialConnectField({
  idPrefix,
  value,
  onChange,
  disabled = false,
}: {
  idPrefix: string;
  value: SocialLinks;
  onChange: (next: SocialLinks) => void;
  disabled?: boolean;
}) {
  const [platform, setPlatform] = useState<SocialPlatformId>("instagram");
  const [open, setOpen] = useState(false);
  const current = SOCIAL_PLATFORMS.find((item) => item.id === platform) ?? SOCIAL_PLATFORMS[0];

  return (
    <div>
      <label className="doc-label" htmlFor={`${idPrefix}-platform`}>
        Socials
      </label>
      <div className="mt-1 grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
        <div className="relative">
          <button
            id={`${idPrefix}-platform`}
            type="button"
            className="field flex w-full min-w-0 items-center justify-between text-left"
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((currentOpen) => !currentOpen)}
          >
            {current.label}
          </button>
          {open ? (
            <ul
              role="listbox"
              aria-label="Socials"
              className="absolute top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
            >
              {SOCIAL_PLATFORMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.id === platform}
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                    onClick={() => {
                      setPlatform(item.id);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <input
          id={`${idPrefix}-handle`}
          className="field min-w-0 flex-1"
          placeholder="Connect this social"
          aria-label={`${current.label} profile`}
          value={value[platform] ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, [platform]: event.target.value })}
        />
      </div>
    </div>
  );
}
