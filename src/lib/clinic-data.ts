import { supabaseRest } from "@/lib/auth";
import { PATIENT_SELECT, type PatientRecord } from "@/lib/patient-intake";

export type { PatientRecord } from "@/lib/patient-intake";

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string | null;
  working_hours: Record<string, { open: string; close: string } | null>;
  slot_duration_minutes: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type Appointment = {
  id: string;
  appointment_code: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  symptoms: string;
  status: string;
  rejection_reason: string | null;
  clinic_id: string;
  category_id: string;
  patient_id: string;
  physiotherapist_id: string | null;
  clinics?: { name: string; address: string; phone: string | null } | null;
  physiotherapy_categories?: { name: string } | null;
  physiotherapists?: {
    id: string;
    profiles?: { full_name: string } | null;
  } | null;
};

export type ClinicSlot = {
  id: string;
  clinic_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  physiotherapist_id: string | null;
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  appointment_id: string | null;
};

export type QrTicket = {
  id: string;
  token: string;
  scan_status: string;
  expires_at: string;
  appointment_id: string;
};

const APPOINTMENT_SELECT =
  "id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),physiotherapists(id,profiles(full_name))";

export async function fetchClinics() {
  return supabaseRest<Clinic[]>(
    "clinics?is_active=eq.true&deleted_at=is.null&select=id,name,slug,address,city,phone,working_hours,slot_duration_minutes&order=name.asc",
  );
}

export async function fetchCategories() {
  return supabaseRest<Category[]>(
    "physiotherapy_categories?is_active=eq.true&deleted_at=is.null&select=id,name,slug,description,sort_order&order=sort_order.asc",
  );
}

export async function fetchMyPatient() {
  return supabaseRest<PatientRecord[]>(`patients?select=${PATIENT_SELECT}&limit=1`);
}

export async function fetchPatientById(patientId: string) {
  return supabaseRest<PatientRecord[]>(
    `patients?id=eq.${patientId}&select=${PATIENT_SELECT}&limit=1`,
  );
}

export async function fetchMyAppointments() {
  return supabaseRest<Appointment[]>(
    `appointments?deleted_at=is.null&select=${APPOINTMENT_SELECT}&order=preferred_date.desc,preferred_time.desc`,
  );
}

export async function fetchMyNotifications(limit = 8) {
  return supabaseRest<NotificationRow[]>(
    `notifications?select=id,title,body,status,created_at,appointment_id&order=created_at.desc&limit=${limit}`,
  );
}

export async function fetchSlotsForClinicDate(clinicId: string, date: string) {
  return supabaseRest<ClinicSlot[]>(
    `clinic_slots?clinic_id=eq.${clinicId}&slot_date=eq.${date}&deleted_at=is.null&select=id,clinic_id,slot_date,start_time,end_time,is_available,physiotherapist_id&order=start_time.asc`,
  );
}

export async function ensureSlotsGenerated() {
  // Best-effort: RPC may be callable by authenticated users
  const { getSupabaseConfig } = await import("@/lib/supabase-config");
  const { getStoredSession } = await import("@/lib/auth");
  const session = getStoredSession();
  if (!session) return;
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  await fetch(`${supabaseUrl}/rest/v1/rpc/generate_clinic_slots`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  }).catch(() => undefined);
}

export type BookAppointmentInput = {
  patientId: string;
  clinicId: string;
  categoryId: string;
  preferredDate: string;
  preferredTime: string;
  symptoms: string;
  createdBy: string;
};

export async function createAppointment(input: BookAppointmentInput) {
  return supabaseRest<Appointment[]>("appointments", {
    method: "POST",
    body: JSON.stringify({
      appointment_code: "",
      patient_id: input.patientId,
      clinic_id: input.clinicId,
      category_id: input.categoryId,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      symptoms: input.symptoms.trim(),
      status: "pending",
      physiotherapist_id: null,
      created_by: input.createdBy,
    }),
  });
}

export async function cancelAppointment(id: string, reason: string) {
  return supabaseRest<Appointment[]>(`appointments?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    }),
  });
}

export async function fetchAcceptedTickets() {
  return supabaseRest<
    (QrTicket & {
      appointments: Appointment | null;
    })[]
  >(
    `qr_tickets?scan_status=eq.active&deleted_at=is.null&select=id,token,scan_status,expires_at,appointment_id,appointments(${APPOINTMENT_SELECT})&order=created_at.desc`,
  );
}

export async function updateMyProfile(patch: {
  full_name?: string;
  phone?: string | null;
}) {
  const { getStoredSession } = await import("@/lib/auth");
  const session = getStoredSession();
  if (!session?.user?.id) return { data: null, error: "Not signed in" };
  return supabaseRest(`profiles?id=eq.${session.user.id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function updateMyPatient(patientId: string, patch: Partial<PatientRecord>) {
  const { profiles: _profiles, id: _id, user_id: _userId, ...rest } = patch;
  const { composeAllergiesSummary } = await import("@/lib/patient-intake");

  const body: Record<string, unknown> = { ...rest };
  if (
    rest.medicine_allergies !== undefined ||
    rest.food_allergies !== undefined ||
    rest.other_allergies !== undefined
  ) {
    body.allergies = composeAllergiesSummary({
      medicine_allergies: rest.medicine_allergies ?? null,
      food_allergies: rest.food_allergies ?? null,
      other_allergies: rest.other_allergies ?? null,
      allergies: rest.allergies ?? null,
    } as PatientRecord);
  }

  return supabaseRest(`patients?id=eq.${patientId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Collapse duplicate physio slots into unique start times for patient booking UI. */
export function uniqueSlotTimes(slots: ClinicSlot[]) {
  const map = new Map<string, { start_time: string; end_time: string; available: boolean }>();
  for (const s of slots) {
    const key = s.start_time.slice(0, 5);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        start_time: key,
        end_time: s.end_time.slice(0, 5),
        available: s.is_available,
      });
    } else if (s.is_available) {
      existing.available = true;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function formatDateLabel(isoDate: string) {
  try {
    return new Date(isoDate + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function formatTimeLabel(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
