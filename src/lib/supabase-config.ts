/**
 * Supabase client config for CorpErgo.
 * Anon / publishable keys are safe to use in the browser.
 */
const PROJECT_URL = "https://gnmahvpujdthvthsypaj.supabase.co";
const LEGACY_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns";
const PUBLISHABLE_KEY = "sb_publishable_3XanUv6jNYrONBTg3fGq5w_6yRSQUu5";

function pickKey(raw: string | undefined, fallback: string) {
  const value = (raw ?? "").trim();
  if (!value || value.includes("your-anon") || value.includes("your-") || value.length < 20) {
    return fallback;
  }
  return value;
}

export function getSupabaseConfig() {
  const supabaseUrl = pickKey(import.meta.env.VITE_SUPABASE_URL, PROJECT_URL);

  // Prefer publishable key, then legacy anon JWT, then baked-in fallbacks
  const supabaseAnonKey = pickKey(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
    PUBLISHABLE_KEY || LEGACY_ANON_KEY,
  );

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    supabaseAnonKey,
  };
}
