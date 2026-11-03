"use server";

export type QuoteRequestResult = { ok: true } | { ok: false; error: string };

export async function submitQuoteRequest(): Promise<QuoteRequestResult> {
  return {
    ok: false,
    error: "Continue through onboarding. The request is sent only after the deposit.",
  };
}
