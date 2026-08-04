import { supabaseRest } from "@/lib/auth";
import type { PhysioAppointment } from "@/lib/physio-data";
import { createAppointment } from "@/lib/clinic-data";

export type AssessmentForm = {
  id?: string;
  appointment_id: string;
  pain_score: number | null;
  body_part: string;
  diagnosis: string;
  clinical_findings: string;
  range_of_motion: string;
  muscle_strength: string;
  special_tests: string;
  treatment_given: string;
  home_exercise: string;
  notes: string;
  duration_minutes: number | null;
  next_visit_needed: boolean;
  assessed_by: string | null;
  // UI-only helpers packed into clinical_findings / notes on save
  chief_complaint: string;
  medical_history: string;
  posture: string;
};

export type AssessmentRow = {
  id: string;
  appointment_id: string;
  pain_score: number | null;
  body_part: string | null;
  diagnosis: string | null;
  clinical_findings: string | null;
  range_of_motion: string | null;
  muscle_strength: string | null;
  special_tests: string | null;
  treatment_given: string | null;
  home_exercise: string | null;
  notes: string | null;
  duration_minutes: number | null;
  next_visit_needed: boolean;
  assessed_by: string | null;
  created_at: string;
  updated_at: string;
};

const ASSESS_SELECT =
  "id,appointment_id,pain_score,body_part,diagnosis,clinical_findings,range_of_motion,muscle_strength,special_tests,treatment_given,home_exercise,notes,duration_minutes,next_visit_needed,assessed_by,created_at,updated_at";

function packFindings(form: AssessmentForm) {
  return [
    form.chief_complaint ? `Chief complaint:\n${form.chief_complaint}` : "",
    form.medical_history ? `Medical history:\n${form.medical_history}` : "",
    form.posture ? `Posture:\n${form.posture}` : "",
    form.clinical_findings ? `Findings:\n${form.clinical_findings}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function unpackFindings(raw: string | null | undefined): Pick<
  AssessmentForm,
  "chief_complaint" | "medical_history" | "posture" | "clinical_findings"
> {
  const text = raw || "";
  const get = (label: string) => {
    const re = new RegExp(`${label}:\\n([\\s\\S]*?)(?=\\n\\n[A-Z][\\w ]+:\\n|$)`);
    return text.match(re)?.[1]?.trim() || "";
  };
  return {
    chief_complaint: get("Chief complaint"),
    medical_history: get("Medical history"),
    posture: get("Posture"),
    clinical_findings: get("Findings") || (!text.includes("Chief complaint:") ? text : ""),
  };
}

export function emptyAssessment(appointmentId: string, physioId: string | null): AssessmentForm {
  return {
    appointment_id: appointmentId,
    pain_score: 5,
    body_part: "",
    diagnosis: "",
    clinical_findings: "",
    range_of_motion: "",
    muscle_strength: "",
    special_tests: "",
    treatment_given: "",
    home_exercise: "",
    notes: "",
    duration_minutes: 30,
    next_visit_needed: false,
    assessed_by: physioId,
    chief_complaint: "",
    medical_history: "",
    posture: "",
  };
}

export function assessmentFromRow(row: AssessmentRow, physioId: string | null): AssessmentForm {
  const packed = unpackFindings(row.clinical_findings);
  return {
    id: row.id,
    appointment_id: row.appointment_id,
    pain_score: row.pain_score,
    body_part: row.body_part || "",
    diagnosis: row.diagnosis || "",
    clinical_findings: packed.clinical_findings,
    range_of_motion: row.range_of_motion || "",
    muscle_strength: row.muscle_strength || "",
    special_tests: row.special_tests || "",
    treatment_given: row.treatment_given || "",
    home_exercise: row.home_exercise || "",
    notes: row.notes || "",
    duration_minutes: row.duration_minutes,
    next_visit_needed: row.next_visit_needed,
    assessed_by: row.assessed_by || physioId,
    chief_complaint: packed.chief_complaint,
    medical_history: packed.medical_history,
    posture: packed.posture,
  };
}

export async function fetchAssessmentForAppointment(appointmentId: string) {
  return supabaseRest<AssessmentRow[]>(
    `assessments?appointment_id=eq.${appointmentId}&deleted_at=is.null&select=${ASSESS_SELECT}&limit=1`,
  );
}

export async function fetchPatientAssessments(patientId: string) {
  return supabaseRest<
    (AssessmentRow & {
      appointments?: {
        appointment_code: string;
        preferred_date: string;
        scheduled_date: string | null;
        physiotherapy_categories?: { name: string } | null;
      } | null;
    })[]
  >(
    `assessments?deleted_at=is.null&select=${ASSESS_SELECT},appointments!inner(appointment_code,preferred_date,scheduled_date,patient_id,physiotherapy_categories(name))&appointments.patient_id=eq.${patientId}&order=created_at.desc`,
  );
}

export async function saveAssessment(form: AssessmentForm) {
  const payload = {
    appointment_id: form.appointment_id,
    pain_score: form.pain_score,
    body_part: form.body_part || null,
    diagnosis: form.diagnosis || null,
    clinical_findings: packFindings(form) || null,
    range_of_motion: form.range_of_motion || null,
    muscle_strength: form.muscle_strength || null,
    special_tests: form.special_tests || null,
    treatment_given: form.treatment_given || null,
    home_exercise: form.home_exercise || null,
    notes: form.notes || null,
    duration_minutes: form.duration_minutes,
    next_visit_needed: form.next_visit_needed,
    assessed_by: form.assessed_by,
  };

  if (form.id) {
    return supabaseRest<AssessmentRow[]>(`assessments?id=eq.${form.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  return supabaseRest<AssessmentRow[]>("assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scheduleFollowUp(input: {
  fromAppointment: PhysioAppointment;
  physioId: string;
  date: string;
  time: string;
  notes?: string;
  createdBy: string;
}) {
  const time = input.time.length === 5 ? `${input.time}:00` : input.time;

  const booked = await createAppointment({
    patientId: input.fromAppointment.patient_id,
    clinicId: input.fromAppointment.clinic_id,
    categoryId: input.fromAppointment.category_id,
    preferredDate: input.date,
    preferredTime: time,
    symptoms: `Follow-up after ${input.fromAppointment.appointment_code}. ${input.notes || ""}`.trim(),
    createdBy: input.createdBy,
  });

  // Staff create pending then immediately accept for follow-ups
  const newAppt = booked.data?.[0];
  if (booked.error || !newAppt) return booked;

  // Patients insert policy requires physiotherapist_id null and status pending —
  // staff/admin can update. Accept as this physio:
  const accepted = await supabaseRest(`appointments?id=eq.${newAppt.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "accepted",
      physiotherapist_id: input.physioId,
      scheduled_date: input.date,
      scheduled_time: time,
    }),
  });

  await supabaseRest("follow_up_sessions", {
    method: "POST",
    body: JSON.stringify({
      from_appointment_id: input.fromAppointment.id,
      new_appointment_id: newAppt.id,
      patient_id: input.fromAppointment.patient_id,
      clinic_id: input.fromAppointment.clinic_id,
      physiotherapist_id: input.physioId,
      next_visit_date: input.date,
      next_visit_time: time,
      notes: input.notes || null,
      status: "booked",
    }),
  });

  const patientRes = await supabaseRest<{ user_id: string }[]>(
    `patients?id=eq.${input.fromAppointment.patient_id}&select=user_id&limit=1`,
  );
  const userId = patientRes.data?.[0]?.user_id;
  if (userId) {
    await supabaseRest("notifications", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        appointment_id: newAppt.id,
        title: "Follow-up scheduled",
        body: `Your next visit is scheduled for ${input.date} at ${input.time}.`,
        channel: "in_app",
        status: "pending",
      }),
    });
  }

  return accepted.error ? accepted : { data: newAppt, error: null };
}

export async function fetchAssessableAppointments() {
  const { fetchMyProfile } = await import("@/lib/auth");
  const { fetchMyPhysioId } = await import("@/lib/physio-data");
  type PhysioAppointment = import("@/lib/physio-data").PhysioAppointment;
  const { matchesClinicId } = await import("@/lib/clinic-data");

  const { data: profile } = await fetchMyProfile();
  const isStaff =
    profile?.role === "physiotherapist" ||
    profile?.role === "clinic_manager" ||
    profile?.role === "receptionist";
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
    `appointments?deleted_at=is.null${clinicFilter}&status=in.(checked_in,completed,accepted)&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,medical_history,profiles(full_name,phone))&order=scheduled_date.desc.nullslast,preferred_date.desc&limit=80`,
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
          const isAssessable = ["checked_in", "completed", "accepted"].includes(item.status);
          const matchesClinic = !clinicId || matchesClinicId(clinicId, item.clinic_id);
          if (
            isAssessable &&
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
