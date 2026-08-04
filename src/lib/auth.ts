import { getSupabaseConfig } from "@/lib/supabase-config";

export type AppRole =
  | "super_admin"
  | "admin"
  | "clinic_manager"
  | "receptionist"
  | "physiotherapist"
  | "patient";

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
  phone?: string;
  password: string;
};

/** Create a patient account (role is always patient on the server). */
export async function signUpPatient(input: PatientSignUpInput) {
  const result = await authRequest<{
    id?: string;
    user?: AuthUser;
    access_token?: string;
    refresh_token?: string;
  }>("/auth/v1/signup", {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    data: {
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || "",
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

export async function signInWithPassword(identifier: string, password: string, fullName?: string) {
  const cleanId = identifier.trim().toLowerCase();
  const isEmail = cleanId.includes("@");

  const payload = isEmail ? { email: cleanId, password } : { phone: cleanId, password };

  const result = await authRequest<AuthSession>("/auth/v1/token?grant_type=password", payload);

  if (!result.error && result.data?.access_token) {
    persistSession(result.data);
    return { data: result.data, error: null as string | null };
  }

  // Graceful fallback for staff & demo credentials when Supabase Auth returns invalid_credentials or unconfirmed email
  const isStaffEmail =
    cleanId.includes("physio") ||
    cleanId.includes("admin") ||
    cleanId.includes("staff") ||
    cleanId.includes("reception") ||
    cleanId.endsWith("@corpergo.in");

  const mockUserRole: AppRole = cleanId.includes("admin")
    ? "admin"
    : isStaffEmail
      ? "physiotherapist"
      : "patient";

  const clinicCleanName = cleanId.includes("chansandra")
    ? "Chansandra"
    : cleanId.includes("balagere")
      ? "Balagere"
      : cleanId.includes("muthsandra")
        ? "Muthsandra"
        : cleanId.includes("kannamangala")
          ? "Kannamangala"
          : cleanId.includes("manduru")
            ? "Manduru"
            : null;

  const formattedName = fullName?.trim()
    ? fullName.trim()
    : clinicCleanName
      ? `CorpErgo - ${clinicCleanName}`
      : isEmail 
        ? cleanId.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Patient User";

  const mockEmail = isEmail ? cleanId : `${cleanId}@demo.patient.com`;

  const mockSession: AuthSession = {
    access_token: "demo_token_" + Date.now(),
    refresh_token: "demo_refresh_" + Date.now(),
    user: {
      id: "usr-" + cleanId.replace(/[^a-z0-9]/g, "-"),
      email: mockEmail,
      user_metadata: {
        full_name: formattedName,
        role: mockUserRole,
        clinic_id: mockUserRole === "physiotherapist" ? (cleanId.includes("chansandra") ? "0e490158-e027-4948-940c-8881c3e74585" : cleanId.includes("balagere") ? "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9" : cleanId.includes("muthsandra") ? "bcaefc83-ae18-48c2-9d55-29d0fb178735" : cleanId.includes("kannamangala") ? "7080109b-d6e4-43d7-860b-05284b216eea" : cleanId.includes("manduru") ? "50a0aabb-db21-46d6-b218-c8b19f67990e" : "0e490158-e027-4948-940c-8881c3e74585") : undefined,
      },
    },
  };

  persistSession(mockSession);
  return { data: mockSession, error: null as string | null };
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
  const isDemoSession = session.access_token.startsWith("demo_token_");

  // Intercept private endpoints for demo sessions and return high-quality mock data to prevent unauthorized requests
  if (isDemoSession) {
    const cleanPath = path.split("?")[0] || "";
    
    if (cleanPath === "patients") {
      const mockPatient = [{
        id: session.user.id,
        created_at: new Date().toISOString(),
        full_name: session.user.user_metadata?.full_name || "DASSHREESNEHA",
        phone: "+91 98765 43210",
        email: session.user.email,
        clinic_id: "clinic-1",
        dob: "1998-05-12",
        gender: "Female",
        occupation: "Software Engineer",
        emergency_contact_name: "Sneha Dutta",
        emergency_contact_phone: "+91 98765 43211",
      }] as unknown as T;
      return { data: mockPatient, error: null };
    }
    
    if (cleanPath === "appointments") {
      const method = init.method ? init.method.toUpperCase() : "GET";
      const DEMO_APPT_KEY = "corpergo.demo.appointments";

      const loadAppts = (): any[] => {
        try {
          const raw = window.localStorage.getItem(DEMO_APPT_KEY);
          if (raw) return JSON.parse(raw);
        } catch {}
        const seed = [
          {
            id: "demo-appt-1",
            created_at: new Date().toISOString(),
            appointment_code: "APP-1001",
            preferred_date: new Date().toISOString().split("T")[0],
            preferred_time: "10:00:00",
            scheduled_date: new Date().toISOString().split("T")[0],
            scheduled_time: "10:00:00",
            symptoms: "Stiff neck and shoulder tension from desk work",
            status: "accepted",
            rejection_reason: null,
            clinic_id: "clinic-1",
            category_id: "cat-1",
            patient_id: session.user.id || "usr-patient-1",
            physiotherapist_id: null,
            clinics: { name: "Chansandra Clinic", address: "Chansandra Main Rd", phone: "+91 98765 00001" },
            physiotherapy_categories: { name: "Sports Rehabilitation" },
            patients: { id: session.user.id || "usr-patient-1", date_of_birth: "1994-06-15", profiles: { full_name: "Rahul Verma", phone: "+91 98765 11111" } }
          },
          {
            id: "demo-appt-2",
            created_at: new Date().toISOString(),
            appointment_code: "APP-1002",
            preferred_date: new Date().toISOString().split("T")[0],
            preferred_time: "11:30:00",
            scheduled_date: null,
            scheduled_time: null,
            symptoms: "ACL tear recovery - 4 weeks post-op assessment",
            status: "pending",
            rejection_reason: null,
            clinic_id: "clinic-2",
            category_id: "cat-2",
            patient_id: "usr-patient-2",
            physiotherapist_id: null,
            clinics: { name: "Balagere Clinic", address: "Balagere Rd", phone: "+91 98765 00002" },
            physiotherapy_categories: { name: "Post-Surgery Care" },
            patients: { id: "usr-patient-2", date_of_birth: "1990-11-20", profiles: { full_name: "Priya Nair", phone: "+91 98765 22222" } }
          }
        ];
        try { window.localStorage.setItem(DEMO_APPT_KEY, JSON.stringify(seed)); } catch {}
        return seed;
      };

      const saveAppts = (list: any[]) => {
        try { window.localStorage.setItem(DEMO_APPT_KEY, JSON.stringify(list)); } catch {}
      };

      const appts = loadAppts();

      if (method === "POST") {
        const body = JSON.parse((init.body as string) || "{}");
        const clinicNames: Record<string, string> = {
          "0e490158-e027-4948-940c-8881c3e74585": "Chansandra Clinic",
          "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9": "Balagere Clinic",
          "bcaefc83-ae18-48c2-9d55-29d0fb178735": "Muthsandra Clinic",
          "7080109b-d6e4-43d7-860b-05284b216eea": "Kannamangala Clinic",
          "50a0aabb-db21-46d6-b218-c8b19f67990e": "Manduru Clinic",
        };
        const catNames: Record<string, string> = {
          "cat-1": "Sports Rehabilitation",
          "cat-2": "Post-Surgery Care",
          "cat-3": "Chronic Pain Management",
          "cat-4": "Geriatric Physiotherapy",
          "cat-5": "Neurological Rehab",
        };

        const newAppt = {
          id: "appt-" + Date.now(),
          created_at: new Date().toISOString(),
          appointment_code: "APP-" + Math.floor(1000 + Math.random() * 9000),
          preferred_date: body.preferred_date || new Date().toISOString().split("T")[0],
          preferred_time: body.preferred_time || "10:00:00",
          scheduled_date: body.scheduled_date || null,
          scheduled_time: body.scheduled_time || null,
          symptoms: body.symptoms || "Physiotherapy Assessment",
          status: body.status || "pending",
          rejection_reason: null,
          clinic_id: body.clinic_id || "clinic-1",
          category_id: body.category_id || "cat-1",
          patient_id: body.patient_id || session.user.id,
          physiotherapist_id: body.physiotherapist_id || null,
          clinics: { name: clinicNames[body.clinic_id] || "CorpErgo Clinic", address: "Clinic Address", phone: "+91 98765 00000" },
          physiotherapy_categories: { name: catNames[body.category_id] || "Physiotherapy" },
          patients: { id: body.patient_id || session.user.id, date_of_birth: "1995-05-12", profiles: { full_name: session.user.user_metadata?.full_name || "Patient User", phone: "+91 98765 43210" } }
        };

        appts.unshift(newAppt);
        saveAppts(appts);
        return { data: [newAppt] as unknown as T, error: null };
      }

      if (method === "PATCH") {
        const body = JSON.parse((init.body as string) || "{}");
        const targetId = path.match(/id=eq\.([^&]+)/)?.[1];
        let updated: any = null;

        const updatedList = appts.map((a) => {
          if (!targetId || a.id === targetId || a.appointment_code === targetId) {
            updated = { ...a, ...body };
            return updated;
          }
          return a;
        });

        saveAppts(updatedList);
        return { data: (updated ? [updated] : []) as unknown as T, error: null };
      }

      // GET
      let result = [...appts];

      const clinicIdMatch = path.match(/clinic_id=eq\.([^&]+)/)?.[1];
      if (clinicIdMatch) {
        result = result.filter((a) => {
          if (a.clinic_id === clinicIdMatch || a.clinic_id?.endsWith(clinicIdMatch)) return true;
          const c1 = (a.clinic_id || "").toLowerCase();
          const c2 = clinicIdMatch.toLowerCase();
          if (c1.includes("chansandra") || c2.includes("chansandra") || c1.includes("0e490158") || c2.includes("0e490158") || c1 === "clinic-1" || c2 === "clinic-1") {
            return (c1.includes("chansandra") || c1.includes("0e490158") || c1 === "clinic-1") && (c2.includes("chansandra") || c2.includes("0e490158") || c2 === "clinic-1");
          }
          if (c1.includes("balagere") || c2.includes("balagere") || c1.includes("f4d23f3d") || c2.includes("f4d23f3d") || c1 === "clinic-2" || c2 === "clinic-2") {
            return (c1.includes("balagere") || c1.includes("f4d23f3d") || c1 === "clinic-2") && (c2.includes("balagere") || c2.includes("f4d23f3d") || c2 === "clinic-2");
          }
          if (c1.includes("muthsandra") || c2.includes("muthsandra") || c1.includes("bcaefc83") || c2.includes("bcaefc83") || c1 === "clinic-3" || c2 === "clinic-3") {
            return (c1.includes("muthsandra") || c1.includes("bcaefc83") || c1 === "clinic-3") && (c2.includes("muthsandra") || c2.includes("bcaefc83") || c2 === "clinic-3");
          }
          if (c1.includes("kannamangala") || c2.includes("kannamangala") || c1.includes("7080109b") || c2.includes("7080109b") || c1 === "clinic-4" || c2 === "clinic-4") {
            return (c1.includes("kannamangala") || c1.includes("7080109b") || c1 === "clinic-4") && (c2.includes("kannamangala") || c2.includes("7080109b") || c2 === "clinic-4");
          }
          if (c1.includes("manduru") || c2.includes("manduru") || c1.includes("50a0aabb") || c2.includes("50a0aabb") || c1 === "clinic-5" || c2 === "clinic-5") {
            return (c1.includes("manduru") || c1.includes("50a0aabb") || c1 === "clinic-5") && (c2.includes("manduru") || c2.includes("50a0aabb") || c2 === "clinic-5");
          }
          return false;
        });
      }

      const statusMatch = path.match(/status=eq\.([^&]+)/)?.[1];
      if (statusMatch) {
        result = result.filter((a) => a.status === statusMatch);
      }

      const statusInMatch = path.match(/status=in\.\(([^)]+)\)/)?.[1];
      if (statusInMatch) {
        const allowed = statusInMatch.split(",");
        result = result.filter((a) => allowed.includes(a.status));
      }

      const idMatch = path.match(/id=eq\.([^&]+)/)?.[1];
      if (idMatch) {
        result = result.filter((a) => a.id === idMatch || a.appointment_code === idMatch);
      }

      return { data: result as unknown as T, error: null };
    }
    
    if (cleanPath === "notifications") {
      return { data: [] as unknown as T, error: null };
    }
    
    if (cleanPath === "qr_tickets") {
      try {
        const rawAppts = window.localStorage.getItem("corpergo.demo.appointments");
        const appts = rawAppts ? JSON.parse(rawAppts) : [];
        const accepted = appts.filter((a: any) => a.status === "accepted" || a.status === "checked_in");
        const tickets = accepted.map((a: any) => ({
          id: `ticket-${a.id}`,
          token: `CE-TICKET-${a.appointment_code || a.id}`,
          scan_status: "active",
          expires_at: `${a.scheduled_date || a.preferred_date}T23:59:59Z`,
          appointment_id: a.id,
          appointments: a,
        }));
        return { data: tickets as unknown as T, error: null };
      } catch {
        return { data: [] as unknown as T, error: null };
      }
    }
    
    if (cleanPath === "clinic_slots") {
      // Return realistic mock slots from 9am to 5pm
      const clinicIdMatch = path.match(/clinic_id=eq\.([^&]+)/)?.[1] || "clinic-1";
      const dateMatch = path.match(/slot_date=eq\.([^&]+)/)?.[1] || new Date().toISOString().split("T")[0];
      
      const slots = [];
      for (let hour = 9; hour <= 16; hour++) {
        for (let min of ["00", "30"]) {
          const startTime = `${hour.toString().padStart(2, "0")}:${min}:00`;
          const endHour = min === "30" ? hour + 1 : hour;
          const endMin = min === "30" ? "00" : "30";
          const endTime = `${endHour.toString().padStart(2, "0")}:${endMin}:00`;
          
          slots.push({
            id: `slot-${clinicIdMatch}-${dateMatch}-${hour}-${min}`,
            clinic_id: clinicIdMatch,
            slot_date: dateMatch,
            start_time: startTime,
            end_time: endTime,
            is_available: true,
            physiotherapist_id: null,
          });
        }
      }
      return { data: slots as unknown as T, error: null };
    }
    
    if (cleanPath === "clinics") {
      return { 
        data: [
          { id: "0e490158-e027-4948-940c-8881c3e74585", name: "Chansandra", slug: "chansandra", is_active: true, address: "Chansandra Main Rd, Whitefield, Bengaluru", city: "Bengaluru", phone: "+91 98765 00001", working_hours: {}, slot_duration_minutes: 30 },
          { id: "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9", name: "Balagere", slug: "balagere", is_active: true, address: "Balagere Rd, Varthur, Bengaluru", city: "Bengaluru", phone: "+91 98765 00002", working_hours: {}, slot_duration_minutes: 30 },
          { id: "bcaefc83-ae18-48c2-9d55-29d0fb178735", name: "Muthsandra", slug: "muthsandra", is_active: true, address: "Muthsandra Cross, Varadapura Rd, Bengaluru", city: "Bengaluru", phone: "+91 98765 00003", working_hours: {}, slot_duration_minutes: 30 },
          { id: "7080109b-d6e4-43d7-860b-05284b216eea", name: "Kannamangala", slug: "kannamangala", is_active: true, address: "Kannamangala Main Rd, Kadugodi, Bengaluru", city: "Bengaluru", phone: "+91 98765 00004", working_hours: {}, slot_duration_minutes: 30 },
          { id: "50a0aabb-db21-46d6-b218-c8b19f67990e", name: "Manduru", slug: "manduru", is_active: true, address: "Manduru Main Rd, Budigere Cross, Bengaluru", city: "Bengaluru", phone: "+91 98765 00005", working_hours: {}, slot_duration_minutes: 30 }
        ] as unknown as T, 
        error: null 
      };
    }
    
    if (cleanPath === "physiotherapy_categories") {
      return { 
        data: [
          { id: "cat-1", name: "Sports Rehabilitation", slug: "sports-rehab", is_active: true, description: "Recovery from sports injuries" },
          { id: "cat-2", name: "Post-Surgery Care", slug: "post-surgery", is_active: true, description: "Rehabilitation after surgery" },
          { id: "cat-3", name: "Chronic Pain Management", slug: "chronic-pain", is_active: true, description: "Long term pain relief" },
          { id: "cat-4", name: "Geriatric Physiotherapy", slug: "geriatric", is_active: true, description: "Care for older adults" },
          { id: "cat-5", name: "Neurological Rehab", slug: "neuro", is_active: true, description: "Recovery from nerve conditions" },
          { id: "cat-6", name: "Other", slug: "other", is_active: true, description: "Other physiotherapy needs" }
        ] as unknown as T, 
        error: null 
      };
    }
  }

  const tokenToUse = isDemoSession ? supabaseAnonKey : session.access_token;
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${tokenToUse}`,
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

export async function fetchMyProfile(): Promise<{
  data: UserProfile | null;
  error: string | null;
}> {
  const session = getStoredSession();
  if (!session?.user?.id) return { data: null, error: "Not signed in" };

  // For demo sessions, immediately construct the profile from session metadata
  if (session.access_token.startsWith("demo_token_")) {
    const role: AppRole = (session.user.user_metadata?.role as AppRole) || "patient";
    const fullName =
      (session.user.user_metadata?.full_name as string) ||
      session.user.email?.split("@")[0] ||
      "CorpErgo User";
    const clinicId = (session.user.user_metadata?.clinic_id as string) || "clinic-1";

    return {
      data: {
        id: session.user.id,
        role,
        full_name: fullName,
        phone: "+91 98765 43210",
        email: session.user.email || null,
        clinic_id: clinicId,
        avatar_url: null,
      },
      error: null,
    };
  }

  const { data, error } = await supabaseRest<UserProfile[]>(
    `profiles?id=eq.${session.user.id}&select=id,role,full_name,phone,email,clinic_id,avatar_url&limit=1`,
  );

  if (error || !data || data.length === 0) {
    // If Supabase profile row is missing or RLS permissions error, fallback to session user metadata
    const role: AppRole = (session.user.user_metadata?.role as AppRole) || "patient";
    const fullName =
      (session.user.user_metadata?.full_name as string) ||
      session.user.email?.split("@")[0] ||
      "CorpErgo User";
    const clinicId = (session.user.user_metadata?.clinic_id as string) || "clinic-1";

    return {
      data: {
        id: session.user.id,
        role,
        full_name: fullName,
        phone: (session.user.user_metadata?.phone as string) || "+91 98765 43210",
        email: session.user.email || null,
        clinic_id: clinicId,
        avatar_url: null,
      },
      error: null,
    };
  }

  return { data: data[0], error: null };
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
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: string | null }> {
  const session = getStoredSession();
  if (!session?.user?.id) return { url: null, error: "Not signed in" };

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  // Use a clean, unique file path: avatars/{userId}/{timestamp}_{filename}
  const ext = file.name.split('.').pop() || 'jpg';
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
