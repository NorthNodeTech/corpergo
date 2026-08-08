import { getSupabaseConfig } from "@/lib/supabase-config";

export type AppRole =
  "super_admin" | "admin" | "clinic_manager" | "receptionist" | "physiotherapist" | "patient";

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type UserProfile = {
  id: string;
  role: AppRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  clinic_id: string | null;
  avatar_url: string | null;
};

type AuthErrorBody = {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

async function authRequest<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const res = await fetch(`${supabaseUrl}${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as T & AuthErrorBody;

  if (!res.ok) {
    const message =
      json.msg ||
      json.message ||
      json.error_description ||
      json.error ||
      `Request failed (${res.status})`;
    return { data: null, error: message };
  }

  return { data: json as T, error: null };
}

export type PatientSignUpInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

/** Normalize phone for storage (+91XXXXXXXXXX). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return phone.trim();
}

/** Create a patient account (role is always patient on the server). */
export async function signUpPatient(input: PatientSignUpInput) {
  const normalizedPhone = normalizePhone(input.phone);
  const phoneDigits = normalizedPhone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return { data: null, error: "Please enter a valid mobile number." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { data: null, error: "Please enter a valid email address." };
  }

  const result = await authRequest<{
    id?: string;
    user?: AuthUser;
    access_token?: string;
    refresh_token?: string;
  }>("/auth/v1/signup", {
    email,
    password: input.password,
    data: {
      full_name: input.fullName.trim(),
      phone: normalizedPhone,
      role: "patient",
    },
  });

  if (result.error) return result;

  const user = result.data?.user ?? (result.data?.id ? (result.data as AuthUser) : null);

  if (result.data?.access_token && result.data?.refresh_token) {
    persistSession({
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      user: user as AuthUser,
    });
  }

  return { data: { user }, error: null as string | null };
}

export async function signInWithPassword(identifier: string, password: string) {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId.includes("@")) {
    return { data: null, error: "Enter a valid email address." };
  }

  const result = await authRequest<AuthSession>("/auth/v1/token?grant_type=password", {
    email: cleanId,
    password,
  });

  if (!result.error && result.data?.access_token) {
    persistSession(result.data);
    return { data: result.data, error: null as string | null };
  }

  const raw = result.error || "Invalid email or password.";
  const friendly = /invalid login credentials/i.test(raw)
    ? "No account found with this email and password. New patient? Create an account first."
    : raw;

  return { data: null, error: friendly };
}

const SESSION_KEY = "corpergo.auth.session";

function persistSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem("corpergo.demo.appointments");
}

/** Authed REST call against PostgREST / Storage / etc. */
export async function supabaseRest<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const session = getStoredSession();
  if (!session?.access_token) {
    return { data: null, error: "Not signed in" };
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as AuthErrorBody;
    return {
      data: null,
      error: json.msg || json.message || json.error || `Request failed (${res.status})`,
    };
  }

  if (res.status === 204) return { data: null, error: null };
  const data = (await res.json()) as T;
  return { data, error: null };
}

/** Public REST call for anonymous-safe reads/inserts. */
export async function supabasePublicRest<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as AuthErrorBody;
    return {
      data: null,
      error: json.msg || json.message || json.error || `Request failed (${res.status})`,
    };
  }

  if (res.status === 204) return { data: null, error: null };
  const text = await res.text();
  if (!text) return { data: null, error: null };
  return { data: JSON.parse(text) as T, error: null };
}

export async function fetchMyProfile(): Promise<{
  data: UserProfile | null;
  error: string | null;
}> {
  const session = getStoredSession();
  if (!session?.user?.id) return { data: null, error: "Not signed in" };

  const { data, error } = await supabaseRest<UserProfile[]>(
    `profiles?id=eq.${session.user.id}&select=id,role,full_name,phone,email,clinic_id,avatar_url&limit=1`,
  );

  if (error || !data || data.length === 0) {
    return {
      data: null,
      error: error || "Could not load your profile. Try signing in again.",
    };
  }

  const profile = data[0];
  if (profile.role === "patient") {
    profile.clinic_id = null;
  } else if (!profile.clinic_id) {
    const physio = await supabaseRest<{ clinic_id: string }[]>(
      `physiotherapists?user_id=eq.${session.user.id}&select=clinic_id&limit=1`,
    );
    profile.clinic_id = physio.data?.[0]?.clinic_id ?? null;
  }

  return { data: profile, error: null };
}

/** Where to send the user after login based on DB role. */
export function portalPathForRole(role: AppRole | string | null | undefined): string {
  switch (role) {
    case "patient":
      return "/patient/dashboard";
    case "physiotherapist":
    case "receptionist":
    case "clinic_manager":
      return "/physio/dashboard";
    case "admin":
    case "super_admin":
      return "/admin/dashboard";
    default:
      return "/patient/dashboard";
  }
}

function isPatientRole(role: AppRole | string) {
  return role === "patient";
}

function isStaffRole(role: AppRole | string) {
  return (
    role === "physiotherapist" ||
    role === "receptionist" ||
    role === "clinic_manager" ||
    role === "admin" ||
    role === "super_admin"
  );
}

/**
 * Resolve post-login destination.
 * Enforces the UI portal choice: patient tab only for patients, staff tab only for staff/admin.
 */
export async function resolvePostLoginPath(
  preferredPortal?: "patient" | "staff",
): Promise<{ path: string | null; error: string | null }> {
  const { data: profile, error } = await fetchMyProfile();

  if (error || !profile) {
    clearSession();
    return {
      path: null,
      error: error || "Could not load your profile. Try signing in again.",
    };
  }

  if (preferredPortal === "patient" && !isPatientRole(profile.role)) {
    clearSession();
    return {
      path: null,
      error:
        "This account is for staff. You don’t have access to sign in as a patient. Switch to Physiotherapist and try again.",
    };
  }

  if (preferredPortal === "staff" && !isStaffRole(profile.role)) {
    clearSession();
    return {
      path: null,
      error:
        "This account is for patients. You don’t have access to sign in as staff. Switch to Patient and try again.",
    };
  }

  return { path: portalPathForRole(profile.role), error: null };
}

export function rolesAllowedForPath(pathname: string): AppRole[] {
  if (pathname.startsWith("/patient")) return ["patient"];
  if (pathname.startsWith("/physio")) {
    return ["physiotherapist", "receptionist", "clinic_manager"];
  }
  if (pathname.startsWith("/admin")) return ["admin", "super_admin"];
  return [];
}

/** Upload a profile avatar to Supabase storage */
export async function uploadAvatar(
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const session = getStoredSession();
  if (!session?.user?.id) return { url: null, error: "Not signed in" };

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  // Use a clean, unique file path: avatars/{userId}/{timestamp}_{filename}
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${session.user.id}/${Date.now()}_avatar.${ext}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as AuthErrorBody;
    return {
      url: null,
      error: json.msg || json.message || json.error || `Upload failed (${res.status})`,
    };
  }

  // Construct the public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
  return { url: publicUrl, error: null };
}
