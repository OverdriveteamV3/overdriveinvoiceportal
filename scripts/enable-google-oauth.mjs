#!/usr/bin/env node
/**
 * Enable Google OAuth on the linked Supabase project (Management API).
 *
 * Reads GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET from env or .env.local.
 * Uses the Supabase CLI keychain token (service "Supabase CLI").
 *
 * Google Cloud redirect URI must include:
 *   https://iyqayjplyujfjlobegze.supabase.co/auth/v1/callback
 *
 * Usage: node scripts/enable-google-oauth.mjs
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REF = "iyqayjplyujfjlobegze";
const CALLBACK = `https://${REF}.supabase.co/auth/v1/callback`;

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

loadEnvFile(resolve(import.meta.dirname, "../.env.local"));

function managementToken() {
  try {
    return execSync("/usr/bin/security find-generic-password -s 'Supabase CLI' -w", {
      encoding: "utf8",
    }).trim();
  } catch {
    return process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? null;
  }
}

const token = managementToken();
const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (!token) {
  console.error("Missing Supabase management token. Run: supabase login");
  process.exit(1);
}

if (!clientId || !clientSecret) {
  console.error(`Add both values to .env.local then re-run:

  GOOGLE_CLIENT_ID=....apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-...

Google Cloud → APIs & Services → Credentials → Create OAuth client (Web application)
Authorized redirect URI:
  ${CALLBACK}
`);
  process.exit(1);
}

const patch = {
  site_url: "https://overdriveinvoiceportal.vercel.app",
  uri_allow_list:
    "https://overdriveinvoiceportal.vercel.app/**,http://localhost:3000/**,http://127.0.0.1:3000/**",
  external_google_enabled: true,
  external_google_client_id: clientId,
  external_google_secret: clientSecret,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(patch),
});

const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(body.message ?? body.error ?? res.statusText);
  process.exit(1);
}

console.log("Google provider enabled.");
console.log("Callback URI:", CALLBACK);
console.log("external_google_enabled:", body.external_google_enabled === true);
