/**
 * Supabase client config for CorpErgo.
 * Anon / publishable keys are safe to use in the browser.
 */
const PROJECT_URL = "https://gnmahvpujdthvthsypaj.supabase.co";
const LEGACY_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns";

function pickValue(raw: string | undefined, fallback: string) {
  const value = (raw ?? "").trim();
  if (!value || value.includes("your-anon") || value.includes("your-") || value.length < 20) {
    return fallback;
  }
  return value;
}

function isJwtAnonKey(value: string) {
  return value.startsWith("eyJ");
}

export function getSupabaseConfig() {
  const supabaseUrl = pickValue(import.meta.env.VITE_SUPABASE_URL, PROJECT_URL).replace(/\/$/, "");

  // Auth + PostgREST require the legacy JWT anon key in apikey/Authorization headers.
  // Never send sb_publishable_… as Bearer for password grant.
  const fromEnvAnon = pickValue(import.meta.env.VITE_SUPABASE_ANON_KEY, "");
  const fromEnvPublishable = pickValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "");
  const supabaseAnonKey = isJwtAnonKey(fromEnvAnon)
    ? fromEnvAnon
    : isJwtAnonKey(fromEnvPublishable)
      ? fromEnvPublishable
      : LEGACY_ANON_KEY;

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
