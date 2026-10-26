import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(LOCALE_COOKIE)?.value === "es" ? "es" : "en";
}
