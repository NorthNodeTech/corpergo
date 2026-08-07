import { supabaseRest, getStoredSession, fetchMyProfile } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-config";
import {
  checkSlotCapacity,
  fetchSlotsForClinicDate,
  matchesClinicId,
  type Appointment,
} from "@/lib/clinic-data";

export type PhysioAppointment = Appointment & {
  patients?: {
    id: string;
    date_of_birth: string | null;
    medical_history?: string | null;
    profiles?: { full_name: string; phone: string | null } | null;
  } | null;
};

const SELECT =
  "id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,cancellation_reason,cancelled_at,reschedule_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,profiles(full_name,phone))";

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const born = new Date(dob + "T12:00:00");
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export async function fetchMyPhysioId() {
  const session = getStoredSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { data: [] as { id: string; clinic_id: string }[], error: "Not signed in" };
  }
  return supabaseRest<{ id: string; clinic_id: string }[]>(
    `physiotherapists?user_id=eq.${userId}&select=id,clinic_id&limit=1`,
  );
}

/** Resolve the clinic ID for the currently logged-in staff member. */
export async function resolveStaffClinicId(): Promise<string | null> {
  const { data: profile } = await fetchMyProfile();
  if (!profile) return null;

  const isStaff =
    profile.role === "physiotherapist" ||
    profile.role === "clinic_manager" ||
    profile.role === "receptionist";

  if (!isStaff) return null;
  if (profile.clinic_id) return profile.clinic_id;

  const me = await fetchMyPhysioId();
  return me.data?.[0]?.clinic_id ?? null;
}

export async function fetchClinicAppointments(status?: string) {
  const clinicId = await resolveStaffClinicId();
  if (!clinicId) {
    return { data: [] as PhysioAppointment[], error: null };
  }

  const filter = status ? `&status=eq.${status}` : "";
  const order =
    status === "cancelled"
      ? "cancelled_at.desc.nullslast,preferred_date.desc"
      : status === "rejected"
        ? "updated_at.desc"
        : "preferred_date.asc,preferred_time.asc";

  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null&clinic_id=eq.${clinicId}${filter}&select=${SELECT}&order=${order}&limit=200`,
  );

  const list = (res.data || []).filter((item) => matchesClinicId(clinicId, item.clinic_id));
  return { data: list, error: res.error };
}

export async function fetchTodayQueue() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const clinicId = await resolveStaffClinicId();
  if (!clinicId) {
    return { data: [] as PhysioAppointment[], error: null };
  }

  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null&clinic_id=eq.${clinicId}&or=(scheduled_date.eq.${iso},and(scheduled_date.is.null,preferred_date.eq.${iso}))&status=in.(accepted,checked_in,completed)&select=${SELECT}&order=scheduled_time.asc.nullsfirst,preferred_time.asc`,
  );

  const list = (res.data || []).filter((item) => matchesClinicId(clinicId, item.clinic_id));
  return { data: list, error: res.error };
}

export async function acceptAppointment(input: {
  appointmentId: string;
  physiotherapistId: string;
  scheduledDate: string;
  scheduledTime: string;
  clinicId: string;
}) {
  const time =
    input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

  const capacity = await checkSlotCapacity(
    input.clinicId,
    input.scheduledDate,
    time,
    input.appointmentId,
  );
  if (!capacity.available) {
    return {
      data: null,
      error:
        "This time slot is now fully booked. Use Reschedule to pick a different time.",
    };
  }

  const { data, error } = await supabaseRest<Appointment[]>(
    `appointments?id=eq.${input.appointmentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "accepted",
        physiotherapist_id: input.physiotherapistId,
        scheduled_date: input.scheduledDate,
        scheduled_time: time,
      }),
    },
  );

  if (!error && data?.[0]) {
    const appt = data[0];
    const token = `CE-TICKET-${appt.appointment_code || appt.id.slice(0, 8).toUpperCase()}`;
    const expiresAt = `${input.scheduledDate}T23:59:59Z`;

    await supabaseRest("qr_tickets", {
      method: "POST",
      body: JSON.stringify({
        appointment_id: input.appointmentId,
        token,
        scan_status: "active",
        expires_at: expiresAt,
      }),
    });

    if (appt.patient_id) {
      const patientRes = await supabaseRest<{ user_id: string }[]>(
        `patients?id=eq.${appt.patient_id}&select=user_id&limit=1`,
      );
      const userId = patientRes.data?.[0]?.user_id;
      if (userId) {
        await supabaseRest("notifications", {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            appointment_id: input.appointmentId,
            title: "Appointment Confirmed",
            body: `Your appointment ${appt.appointment_code} for ${input.scheduledDate} at ${time.slice(0, 5)} has been confirmed! Show your QR ticket at reception.`,
            channel: "in_app",
            status: "pending",
          }),
        });
      }
    }
  }

  return { data, error };
}

export async function rejectAppointment(
  appointmentId: string,
  patientId: string,
  appointmentCode: string,
  reason: string,
) {
  const { data, error } = await supabaseRest<Appointment[]>(
    `appointments?id=eq.${appointmentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "rejected",
        rejection_reason: reason.trim(),
      }),
    },
  );

  if (!error && patientId) {
    const patientRes = await supabaseRest<{ user_id: string }[]>(
      `patients?id=eq.${patientId}&select=user_id&limit=1`,
    );
    const userId = patientRes.data?.[0]?.user_id;
    if (userId) {
      await supabaseRest("notifications", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          appointment_id: appointmentId,
          title: "Appointment update",
          body: `Your appointment ${appointmentCode} was not accepted. Reason: ${reason.trim()}`,
          channel: "in_app",
          status: "pending",
        }),
      });
    }
  }

  return { data, error };
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  patientId: string;
  appointmentCode: string;
  physiotherapistId: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  clinicId: string;
}) {
  const time =
    input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

  const capacity = await checkSlotCapacity(
    input.clinicId,
    input.scheduledDate,
    time,
    input.appointmentId,
  );
  if (!capacity.available) {
    return {
      data: null,
      error: "This time slot is fully booked. Please choose another time.",
    };
  }

  const { data, error } = await supabaseRest<Appointment[]>(
    `appointments?id=eq.${input.appointmentId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "accepted",
        physiotherapist_id: input.physiotherapistId,
        scheduled_date: input.scheduledDate,
        scheduled_time: time,
        preferred_date: input.scheduledDate,
        preferred_time: time,
        reschedule_reason: input.reason.trim() || "Rescheduled by clinic",
      }),
    },
  );

  if (!error && input.patientId) {
    const patientRes = await supabaseRest<{ user_id: string }[]>(
      `patients?id=eq.${input.patientId}&select=user_id&limit=1`,
    );
    const userId = patientRes.data?.[0]?.user_id;
    if (userId) {
      await supabaseRest("notifications", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          appointment_id: input.appointmentId,
          title: "Appointment rescheduled",
          body: `Your appointment ${input.appointmentCode} was moved to ${input.scheduledDate} at ${input.scheduledTime}.`,
          channel: "in_app",
          status: "pending",
        }),
      });
    }
  }

  return { data, error };
}

export async function setConsultationStatus(
  appointmentId: string,
  status: "checked_in" | "completed",
) {
  return supabaseRest(`appointments?id=eq.${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function scanQrToken(token: string) {
  const session = getStoredSession();
  if (!session) return { data: null, error: "Not signed in" };
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/scan_qr_ticket`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token.trim() }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    msg?: string;
    error?: string;
    details?: string;
    hint?: string;
  };
  if (!res.ok) {
    return {
      data: null,
      error:
        json.message ||
        json.msg ||
        json.error ||
        json.details ||
        "Scan failed. Make sure this ticket belongs to your clinic.",
    };
  }
  return { data: json, error: null };
}

/** Staff slot picker — uses the same 2-per-hour capacity rules as patient booking. */
export async function fetchAvailableSlots(
  clinicId: string,
  date: string,
  options?: { excludeAppointmentId?: string },
) {
  return fetchSlotsForClinicDate(clinicId, date, options);
}

export async function blockClinicTimeSlot(
  clinicId: string,
  date: string,
  startTime: string,
  reason?: string,
) {
  const { getStoredSession } = await import("@/lib/auth");
  const session = getStoredSession();
  const time = startTime.length === 5 ? `${startTime}:00` : startTime;

  return supabaseRest("clinic_blocked_times", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: clinicId,
      block_date: date,
      start_time: time,
      reason: reason?.trim() || "Blocked by clinic staff",
      created_by: session?.user?.id ?? null,
    }),
  });
}

export async function unblockClinicTimeSlot(clinicId: string, date: string, startTime: string) {
  const time = startTime.length === 5 ? `${startTime}:00` : startTime;

  return supabaseRest(
    `clinic_blocked_times?clinic_id=eq.${clinicId}&block_date=eq.${date}&start_time=eq.${time}`,
    { method: "DELETE" },
  );
}
