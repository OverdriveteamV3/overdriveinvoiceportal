export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "snapchat", label: "Snapchat" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

export type SocialLinks = Record<SocialPlatformId, string>;

export function emptySocials(): SocialLinks {
  return {
    instagram: "",
    tiktok: "",
    snapchat: "",
    x: "",
    youtube: "",
  };
}

export function normalizeSocials(value: unknown): SocialLinks {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next = emptySocials();
  for (const platform of SOCIAL_PLATFORMS) {
    next[platform.id] = String(source[platform.id] ?? "").trim().slice(0, 160);
  }
  return next;
}

export function hasSocialLink(socials: SocialLinks): boolean {
  return SOCIAL_PLATFORMS.some((platform) => socials[platform.id].length > 0);
}

const SOCIAL_ORIGINS: Record<SocialPlatformId, string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://www.tiktok.com/@",
  snapchat: "https://www.snapchat.com/add/",
  x: "https://x.com/",
  youtube: "https://www.youtube.com/@",
};

export function socialHref(platform: SocialPlatformId, value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#]|$)/i.test(raw)) return `https://${raw}`;
  const handle = raw.replace(/^@/, "").replace(/[^\w.-]/g, "");
  if (!handle) return null;
  return `${SOCIAL_ORIGINS[platform]}${handle}`;
}
