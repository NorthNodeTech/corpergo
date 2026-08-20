import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip leading "Dr." / "Dr " from clinic or location labels shown in the UI. */
export function formatClinicName(name: string): string {
  return name
    .replace(/^dr\.?\s+/i, "")
    .replace(/\bcorp\s*ergo\s*[-–—]?\s*/i, "")
    .replace(/\s+clinic$/i, "")
    .replace(/\bChansandra\b/gi, "Channasandra")
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
