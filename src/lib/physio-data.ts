import { supabaseRest, getStoredSession, fetchMyProfile } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { matchesClinicId, type Appointment, type ClinicSlot } from "@/lib/clinic-data";

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
  const { data: profile } = await fetchMyProfile();
  const isStaff = profile?.role === "physiotherapist" || profile?.role === "clinic_manager" || profile?.role === "receptionist";
  let clinicId = isStaff ? profile?.clinic_id : undefined;

  if (isStaff && !clinicId) {
    const emailOrName = `${profile?.email || ""} ${profile?.full_name || ""}`.toLowerCase();
    if (emailOrName.includes("chansandra")) clinicId = "0e490158-e027-4948-940c-8881c3e74585";
    else if (emailOrName.includes("balagere")) clinicId = "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9";
    else if (emailOrName.includes("muthsandra")) clinicId = "bcaefc83-ae18-48c2-9d55-29d0fb178735";
    else if (emailOrName.includes("kannamangala")) clinicId = "7080109b-d6e4-43d7-860b-05284b216eea";
    else if (emailOrName.includes("manduru")) clinicId = "50a0aabb-db21-46d6-b218-c8b19f67990e";
    else {
      const me = await fetchMyPhysioId();
      clinicId = me.data?.[0]?.clinic_id;
    }
  }

  const filter = status ? `&status=eq.${status}` : "";
  const clinicFilter = clinicId ? `&clinic_id=eq.${clinicId}` : "";
  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null${filter}${clinicFilter}&select=${SELECT}&order=preferred_date.asc,preferred_time.asc&limit=200`,
  );

  let list = res.data || [];

  if (clinicId) {
    list = list.filter((item) => matchesClinicId(clinicId, item.clinic_id));
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoList = JSON.parse(raw) as PhysioAppointment[];
        for (const item of demoList) {
          const matchesStatus = !status || item.status === status;
          const matchesClinic = !clinicId || matchesClinicId(clinicId, item.clinic_id);
          if (
            matchesStatus &&
            matchesClinic &&
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

export async function fetchTodayQueue() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const { data: profile } = await fetchMyProfile();
  const isStaff = profile?.role === "physiotherapist" || profile?.role === "clinic_manager" || profile?.role === "receptionist";
  let clinicId = isStaff ? profile?.clinic_id : undefined;

  if (isStaff && !clinicId) {
    const emailOrName = `${profile?.email || ""} ${profile?.full_name || ""}`.toLowerCase();
    if (emailOrName.includes("chansandra")) clinicId = "0e490158-e027-4948-940c-8881c3e74585";
    else if (emailOrName.includes("balagere")) clinicId = "f4d23f3d-24bb-489a-a51f-66bc61cb2fc9";
    else if (emailOrName.includes("muthsandra")) clinicId = "bcaefc83-ae18-48c2-9d55-29d0fb178735";
    else if (emailOrName.includes("kannamangala")) clinicId = "7080109b-d6e4-43d7-860b-05284b216eea";
    else if (emailOrName.includes("manduru")) clinicId = "50a0aabb-db21-46d6-b218-c8b19f67990e";
    else {
      const me = await fetchMyPhysioId();
      clinicId = me.data?.[0]?.clinic_id;
    }
  }

  const clinicFilter = clinicId ? `&clinic_id=eq.${clinicId}` : "";
  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null${clinicFilter}&or=(scheduled_date.eq.${iso},and(scheduled_date.is.null,preferred_date.eq.${iso}))&status=in.(accepted,checked_in,completed)&select=${SELECT}&order=scheduled_time.asc.nullsfirst,preferred_time.asc`,
  );

  let list = res.data || [];

  if (clinicId) {
    list = list.filter((item) => matchesClinicId(clinicId, item.clinic_id));
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoList = JSON.parse(raw) as PhysioAppointment[];
        for (const item of demoList) {
          const apptDate = item.scheduled_date || item.preferred_date;
          const isToday = apptDate === iso;
          const isAcceptedStatus = ["accepted", "checked_in", "completed"].includes(item.status);
          const matchesClinic = !clinicId || matchesClinicId(clinicId, item.clinic_id);
          if (
            isToday &&
            isAcceptedStatus &&
            matchesClinic &&
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

export async function fetchMyPhysioId() {
  const session = getStoredSession();
  const userId = session?.user?.id;
  if (!userId) {
    return supabaseRest<{ id: string; clinic_id: string }[]>(
      "physiotherapists?select=id,clinic_id&limit=1",
    );
  }
  return supabaseRest<{ id: string; clinic_id: string }[]>(
    `physiotherapists?user_id=eq.${userId}&select=id,clinic_id&limit=1`,
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

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoList = JSON.parse(raw);
        const updatedList = demoList.map((a: any) => {
          if (a.id === input.appointmentId || a.appointment_code === input.appointmentId) {
            return {
              ...a,
              status: "accepted",
              physiotherapist_id: input.physiotherapistId,
              scheduled_date: input.scheduledDate,
              scheduled_time: time,
            };
          }
          return a;
        });
        window.localStorage.setItem("corpergo.demo.appointments", JSON.stringify(updatedList));
      }
    } catch {}
  }

  if (!error && input.slotId) {
    await supabaseRest(`clinic_slots?id=eq.${input.slotId}`, {
      method: "PATCH",
      body: JSON.stringify({
        is_available: false,
        appointment_id: input.appointmentId,
      }),
    });
  }

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

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("corpergo.demo.appointments");
      if (raw) {
        const demoList = JSON.parse(raw);
        const updatedList = demoList.map((a: any) => {
          if (a.id === appointmentId || a.appointment_code === appointmentCode) {
            return {
              ...a,
              status: "rejected",
              rejection_reason: reason.trim(),
            };
          }
          return a;
        });
        window.localStorage.setItem("corpergo.demo.appointments", JSON.stringify(updatedList));
      }
    } catch {}
  }

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
