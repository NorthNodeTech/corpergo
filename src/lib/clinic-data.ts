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
  created_at: string;
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
  "id,created_at,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),physiotherapists(id,profiles(full_name))";

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
  const { getStoredSession } = await import("@/lib/auth");
  const session = getStoredSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { data: [], error: null };
  }
  const res = await supabaseRest<PatientRecord[]>(
    `patients?user_id=eq.${userId}&select=${PATIENT_SELECT}&limit=1`
  );
  if ((!res.data || res.data.length === 0) && userId) {
    await supabaseRest("patients", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
    return supabaseRest<PatientRecord[]>(`patients?user_id=eq.${userId}&select=${PATIENT_SELECT}&limit=1`);
  }
  return res;
}

export async function fetchPatientById(patientId: string) {
  return supabaseRest<PatientRecord[]>(
    `patients?id=eq.${patientId}&select=${PATIENT_SELECT}&limit=1`,
  );
}

export function matchesClinicId(
  targetClinicId: string | null | undefined,
  appointmentClinicId: string | null | undefined,
): boolean {
  if (!targetClinicId || !appointmentClinicId) return false;
  if (targetClinicId === appointmentClinicId) return true;

  const chansandra = ["0e490158-e027-4948-940c-8881c3e74585", "clinic-1", "chansandra"];
  const balagere = ["f4d23f3d-24bb-489a-a51f-66bc61cb2fc9", "clinic-2", "balagere"];
  const muthsandra = ["bcaefc83-ae18-48c2-9d55-29d0fb178735", "clinic-3", "muthsandra"];
  const kannamangala = ["7080109b-d6e4-43d7-860b-05284b216eea", "clinic-4", "kannamangala"];
  const manduru = ["50a0aabb-db21-46d6-b218-c8b19f67990e", "clinic-5", "manduru"];

  const targetLower = targetClinicId.toLowerCase();
  const apptLower = appointmentClinicId.toLowerCase();

  if (chansandra.some((id) => targetLower.includes(id)) && chansandra.some((id) => apptLower.includes(id))) return true;
  if (balagere.some((id) => targetLower.includes(id)) && balagere.some((id) => apptLower.includes(id))) return true;
  if (muthsandra.some((id) => targetLower.includes(id)) && muthsandra.some((id) => apptLower.includes(id))) return true;
  if (kannamangala.some((id) => targetLower.includes(id)) && kannamangala.some((id) => apptLower.includes(id))) return true;
  if (manduru.some((id) => targetLower.includes(id)) && manduru.some((id) => apptLower.includes(id))) return true;

  return false;
}

export async function fetchMyAppointments() {
  const pat = await fetchMyPatient();
  const patientId = pat.data?.[0]?.id;
  if (!patientId) {
    return { data: [], error: null };
  }
  const res = await supabaseRest<Appointment[]>(
    `appointments?patient_id=eq.${patientId}&deleted_at=is.null&select=${APPOINTMENT_SELECT}&order=created_at.desc`,
  );
  let list = res.data || [];
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoList = JSON.parse(raw) as Appointment[];
        for (const item of demoList) {
          if (
            item.patient_id === patientId &&
            !list.some((a) => a.id === item.id || a.appointment_code === item.appointment_code)
          ) {
            list.unshift(item);
          }
        }
      }
    } catch {}
  }
  return { data: list, error: res.error };
}

export async function fetchMyNotifications(limit = 8) {
  const { getStoredSession } = await import("@/lib/auth");
  const session = getStoredSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { data: [], error: null };
  }
  return supabaseRest<NotificationRow[]>(
    `notifications?user_id=eq.${userId}&select=id,title,body,status,created_at,appointment_id&order=created_at.desc&limit=${limit}`,
  );
}

export async function fetchSlotsForClinicDate(clinicId: string, date: string) {
  const [slotsRes, apptsRes] = await Promise.all([
    supabaseRest<(ClinicSlot & { remaining_slots?: number })[]>(
      `clinic_slots?clinic_id=eq.${clinicId}&slot_date=eq.${date}&deleted_at=is.null&select=id,clinic_id,slot_date,start_time,end_time,is_available,physiotherapist_id&order=start_time.asc`,
    ),
    supabaseRest<{ preferred_time: string; scheduled_time: string | null; status: string }[]>(
      `appointments?clinic_id=eq.${clinicId}&or=(preferred_date.eq.${date},scheduled_date.eq.${date})&deleted_at=is.null&status=neq.cancelled&select=preferred_time,scheduled_time,status`,
    ),
  ]);

  const rawSlots = slotsRes.data || [];
  const appts = apptsRes.data || [];

  const bookedCounts = new Map<string, number>();
  for (const a of appts) {
    const timeKey = (a.scheduled_time || a.preferred_time || "").slice(0, 5);
    if (timeKey) {
      bookedCounts.set(timeKey, (bookedCounts.get(timeKey) || 0) + 1);
    }
  }

  const updatedSlots = rawSlots.map((s) => {
    const timeKey = s.start_time.slice(0, 5);
    const booked = bookedCounts.get(timeKey) || 0;
    const remaining = Math.max(0, 2 - booked);
    return {
      ...s,
      is_available: remaining > 0,
      remaining_slots: remaining,
    };
  });

  return {
    ...slotsRes,
    data: updatedSlots,
  };
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
  const clinicNames: Record<string, string> = {
    "0e490158-e027-4948-940c-8881c3e74585": "Chansandra Clinic",
    "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9": "Balagere Clinic",
    "bcaefc83-ae18-48c2-9d55-29d0fb178735": "Muthsandra Clinic",
    "7080109b-d6e4-43d7-860b-05284b216eea": "Kannamangala Clinic",
    "50a0aabb-db21-46d6-b218-c8b19f67990e": "Manduru Clinic",
  };

  const res = await supabaseRest<Appointment[]>("appointments", {
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

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      const list = raw ? JSON.parse(raw) : [];
      const newAppt = res.data?.[0] || {
        id: "appt-" + Date.now(),
        created_at: new Date().toISOString(),
        appointment_code: "CE-" + Math.floor(100000 + Math.random() * 900000),
        patient_id: input.patientId,
        clinic_id: input.clinicId,
        category_id: input.categoryId,
        preferred_date: input.preferredDate,
        preferred_time: input.preferredTime,
        scheduled_date: null,
        scheduled_time: null,
        symptoms: input.symptoms.trim(),
        status: "pending",
        physiotherapist_id: null,
        created_by: input.createdBy,
        clinics: { name: clinicNames[input.clinicId] || "CorpErgo Clinic", address: "Clinic Address", phone: "+91 98765 00000" },
        physiotherapy_categories: { name: "Physiotherapy Care" },
        patients: { id: input.patientId, date_of_birth: "1995-05-12", profiles: { full_name: "Patient User", phone: "+91 98765 43210" } }
      };

      if (!list.some((a: any) => a.id === newAppt.id)) {
        list.unshift(newAppt);
        window.localStorage.setItem("corpergo.demo.appointments", JSON.stringify(list));
      }
    } catch {}
  }

  return res;
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
  const pat = await fetchMyPatient();
  const patientId = pat.data?.[0]?.id;
  if (!patientId) {
    return { data: [], error: null };
  }
  const res = await supabaseRest<
    (QrTicket & {
      appointments: Appointment | null;
    })[]
  >(
    `qr_tickets?scan_status=eq.active&deleted_at=is.null&select=id,token,scan_status,expires_at,appointment_id,appointments!inner(${APPOINTMENT_SELECT})&appointments.patient_id=eq.${patientId}&order=created_at.desc`,
  );
  let list = res.data || [];

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoAppts = JSON.parse(raw) as Appointment[];
        const accepted = demoAppts.filter(
          (a) => a.patient_id === patientId && (a.status === "accepted" || a.status === "checked_in"),
        );
        for (const appt of accepted) {
          if (!list.some((t) => t.appointment_id === appt.id || t.appointments?.appointment_code === appt.appointment_code)) {
            list.unshift({
              id: `ticket-${appt.id}`,
              token: `CE-TICKET-${appt.appointment_code || appt.id}`,
              scan_status: "active",
              expires_at: `${appt.scheduled_date || appt.preferred_date}T23:59:59Z`,
              appointment_id: appt.id,
              appointments: appt,
            });
          }
        }
      }
    } catch {}
  }

  return { data: list, error: res.error };
}

export async function updateMyProfile(patch: {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
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
export function uniqueSlotTimes(slots: (ClinicSlot & { remaining_slots?: number })[]) {
  const map = new Map<
    string,
    { start_time: string; end_time: string; available: boolean; remaining_slots: number }
  >();
  for (const s of slots) {
    const key = s.start_time.slice(0, 5);
    const rem = s.remaining_slots !== undefined ? s.remaining_slots : (s.is_available ? 2 : 0);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        start_time: key,
        end_time: s.end_time.slice(0, 5),
        available: rem > 0,
        remaining_slots: rem,
      });
    } else {
      existing.remaining_slots = Math.min(existing.remaining_slots, rem);
      existing.available = existing.remaining_slots > 0;
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
