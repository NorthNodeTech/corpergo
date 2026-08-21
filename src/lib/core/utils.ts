import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { matchClinicLocation } from "@/lib/seo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Canonical clinic short name + spelling fixes for UI labels. */
export function formatClinicName(name: string): string {
  const known = matchClinicLocation({ name });
  if (known) return known.shortName;

  return name
    .replace(/^dr\.?\s+/i, "")
    .replace(/\bcorp\s*ergo\s*[-–—]?\s*/i, "")
    .replace(/\s+clinic$/i, "")
    .replace(/\bChansandra\b/gi, "Channasandra")
    .replace(/\bMuthasandra\b/gi, "Muthsandra")
    .replace(/\bBalegere\b/gi, "Balagere")
    .replace(/\bMandur\b(?!u)/gi, "Manduru")
    .trim();
}

/** Greeting label for physio workspace — no "Dr." prefix. */
export function formatPhysioDisplayName(profileName: string, clinicName?: string): string {
  const raw = profileName.trim();
  if (!raw) return clinicName ? formatClinicName(clinicName) : "CorpErgo Clinic";
  if (raw.startsWith("CorpErgo")) return raw;
  const clean = raw.replace(/^(dr\.?|physio)\s*/i, "").trim();
  return clean || (clinicName ? formatClinicName(clinicName) : "Clinic");
}
