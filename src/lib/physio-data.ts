import { supabaseRest, getStoredSession } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-config";
import type { Appointment, ClinicSlot } from "@/lib/clinic-data";

export type PhysioAppointment = Appointment & {
  patients?: {
    id: string;
    date_of_birth: string | null;
    medical_history?: string | null;
    profiles?: { full_name: string; phone: string | null } | null;
  } | null;
};

const SELECT =
  "id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,profiles(full_name,phone))";

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const born = new Date(dob + "T12:00:00");
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export async function fetchClinicAppointments(status?: string) {
  const filter = status ? `&status=eq.${status}` : "";
  return supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null${filter}&select=${SELECT}&order=preferred_date.asc,preferred_time.asc&limit=200`,
  );
}

export async function fetchTodayQueue() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null&or=(scheduled_date.eq.${iso},and(scheduled_date.is.null,preferred_date.eq.${iso}))&status=in.(accepted,checked_in,completed)&select=${SELECT}&order=scheduled_time.asc.nullsfirst,preferred_time.asc`,
  );
}

export async function fetchMyPhysioId() {
  return supabaseRest<{ id: string; clinic_id: string }[]>(
    "physiotherapists?select=id,clinic_id&limit=1",
  );
}

export async function acceptAppointment(input: {
  appointmentId: string;
  physiotherapistId: string;
  scheduledDate: string;
  scheduledTime: string;
  slotId?: string;
}) {
  const time =
    input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

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

  if (!error && input.slotId) {
    await supabaseRest(`clinic_slots?id=eq.${input.slotId}`, {
      method: "PATCH",
      body: JSON.stringify({
        is_available: false,
        appointment_id: input.appointmentId,
      }),
    });
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
  slotId?: string;
}) {
  const time =
    input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

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

  if (!error && input.slotId) {
    await supabaseRest(`clinic_slots?id=eq.${input.slotId}`, {
      method: "PATCH",
      body: JSON.stringify({
        is_available: false,
        appointment_id: input.appointmentId,
      }),
    });
  }

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

export async function fetchAvailableSlots(clinicId: string, date: string) {
  return supabaseRest<ClinicSlot[]>(
    `clinic_slots?clinic_id=eq.${clinicId}&slot_date=eq.${date}&is_available=eq.true&deleted_at=is.null&select=id,clinic_id,slot_date,start_time,end_time,is_available,physiotherapist_id&order=start_time.asc`,
  );
}
