import { supabaseRest } from "@/lib/auth";
import { PATIENT_SELECT, type PatientRecord } from "@/lib/patient/patient-intake";

export type { PatientRecord } from "@/lib/patient/patient-intake";

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

export type VisitType = "initial" | "follow_up";

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
  visit_type?: VisitType;
  parent_appointment_id?: string | null;
  rejection_reason: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  reschedule_reason?: string | null;
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

export type ClinicBlockedTime = {
  id: string;
  clinic_id: string;
  block_date: string;
  start_time: string;
  reason: string | null;
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
  return targetClinicId === appointmentClinicId;
}

export async function fetchMyAppointments(presetPatientId?: string) {
  let patientId = presetPatientId;
  if (!patientId) {
    const pat = await fetchMyPatient();
    patientId = pat.data?.[0]?.id;
  }
  if (!patientId) {
    return { data: [], error: null };
  }
  return supabaseRest<Appointment[]>(
    `appointments?patient_id=eq.${patientId}&deleted_at=is.null&select=${APPOINTMENT_SELECT}&order=created_at.desc`,
  );
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

/** Max concurrent bookings per time slot at a clinic. */
export const SLOTS_PER_HOUR = 2;

const ACTIVE_BOOKING_STATUSES =
  "pending,accepted,checked_in,completed,rescheduled";

export async function fetchSlotsForClinicDate(
  clinicId: string,
  date: string,
  options?: { excludeAppointmentId?: string },
) {
  const [slotsRes, apptsRes, blockedRes] = await Promise.all([
    supabaseRest<(ClinicSlot & { remaining_slots?: number })[]>(
      `clinic_slots?clinic_id=eq.${clinicId}&slot_date=eq.${date}&deleted_at=is.null&select=id,clinic_id,slot_date,start_time,end_time,is_available,physiotherapist_id&order=start_time.asc`,
    ),
    supabaseRest<
      { id: string; preferred_time: string; scheduled_time: string | null; status: string }[]
    >(
      `appointments?clinic_id=eq.${clinicId}&or=(preferred_date.eq.${date},scheduled_date.eq.${date})&deleted_at=is.null&status=in.(${ACTIVE_BOOKING_STATUSES})&select=id,preferred_time,scheduled_time,status`,
    ),
    supabaseRest<ClinicBlockedTime[]>(
      `clinic_blocked_times?clinic_id=eq.${clinicId}&block_date=eq.${date}&select=id,clinic_id,block_date,start_time,reason`,
    ),
  ]);

  const rawSlots = slotsRes.data || [];
  const appts = (apptsRes.data || []).filter(
    (a) => !options?.excludeAppointmentId || a.id !== options.excludeAppointmentId,
  );
  const blockedTimes = new Set(
    (blockedRes.data || []).map((b) => b.start_time.slice(0, 5)),
  );

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
    let remaining = Math.max(0, SLOTS_PER_HOUR - booked);
    if (blockedTimes.has(timeKey)) remaining = 0;
    return {
      ...s,
      is_available: remaining > 0,
      remaining_slots: remaining,
    };
  });

  for (const timeKey of blockedTimes) {
    if (!updatedSlots.some((s) => s.start_time.slice(0, 5) === timeKey)) {
      updatedSlots.push({
        id: `blocked-${timeKey}`,
        clinic_id: clinicId,
        slot_date: date,
        start_time: `${timeKey}:00`,
        end_time: `${timeKey}:00`,
        is_available: false,
        remaining_slots: 0,
        physiotherapist_id: null,
      });
    }
  }

  updatedSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

  return {
    ...slotsRes,
    data: updatedSlots,
    blockedTimes: blockedRes.data || [],
  };
}

export async function fetchBlockedTimes(clinicId: string, date: string) {
  return supabaseRest<ClinicBlockedTime[]>(
    `clinic_blocked_times?clinic_id=eq.${clinicId}&block_date=eq.${date}&select=id,clinic_id,block_date,start_time,reason&order=start_time.asc`,
  );
}

/** Check whether a time slot still has capacity (2 bookings max per hour). */
export async function checkSlotCapacity(
  clinicId: string,
  date: string,
  time: string,
  excludeAppointmentId?: string,
): Promise<{ available: boolean; remaining: number }> {
  const timeKey = time.slice(0, 5);
  const res = await fetchSlotsForClinicDate(clinicId, date, { excludeAppointmentId });
  const slots = uniqueSlotTimes(res.data || []);
  const match = slots.find((s) => s.start_time === timeKey);
  const remaining = match?.remaining_slots ?? 0;
  return { available: remaining > 0, remaining };
}

export async function ensureSlotsGenerated() {
  // Best-effort: RPC may be callable by authenticated users
  const { getSupabaseConfig } = await import("@/lib/core/supabase-config");
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
  const capacity = await checkSlotCapacity(
    input.clinicId,
    input.preferredDate,
    input.preferredTime,
  );
  if (!capacity.available) {
    return {
      data: null,
      error: "This time slot is fully booked. Please choose another time.",
    };
  }

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
  const pat = await fetchMyPatient();
  const patientId = pat.data?.[0]?.id;
  if (!patientId) {
    return { data: [], error: null };
  }
  return supabaseRest<
    (QrTicket & {
      appointments: Appointment | null;
    })[]
  >(
    `qr_tickets?scan_status=eq.active&deleted_at=is.null&select=id,token,scan_status,expires_at,appointment_id,appointments!inner(${APPOINTMENT_SELECT})&appointments.patient_id=eq.${patientId}&order=created_at.desc`,
  );
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
  const { composeAllergiesSummary } = await import("@/lib/patient/patient-intake");

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
    const rem =
      s.remaining_slots !== undefined
        ? s.remaining_slots
        : s.is_available
          ? SLOTS_PER_HOUR
          : 0;
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
