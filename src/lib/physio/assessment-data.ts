import { supabaseRest } from "@/lib/auth";
import type { PhysioAppointment } from "@/lib/physio/physio-data";
import { createAppointment } from "@/lib/patient/clinic-data";

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
  started_at: string | null;
  admin_edit_unlocked: boolean;
  created_at: string;
  updated_at: string;
};

const ASSESS_SELECT =
  "id,appointment_id,pain_score,body_part,diagnosis,clinical_findings,range_of_motion,muscle_strength,special_tests,treatment_given,home_exercise,notes,duration_minutes,next_visit_needed,assessed_by,started_at,admin_edit_unlocked,created_at,updated_at";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function assessmentEditState(
  row: Pick<AssessmentRow, "started_at" | "created_at" | "admin_edit_unlocked"> | null | undefined,
  isNew: boolean,
  options?: { isPriorVisit?: boolean },
) {
  if (options?.isPriorVisit) {
    return {
      editable: false,
      locked: true,
      reason:
        "This is a previous visit. Open the current session to record a new assessment on the same profile.",
    };
  }
  if (isNew || !row) {
    return { editable: true, locked: false, reason: null as string | null };
  }
  if (row.admin_edit_unlocked) {
    return { editable: true, locked: false, reason: null };
  }
  const startedAt = new Date(row.started_at || row.created_at).getTime();
  if (Number.isNaN(startedAt)) {
    return { editable: true, locked: false, reason: null };
  }
  const expiresAt = startedAt + EDIT_WINDOW_MS;
  if (Date.now() < expiresAt) {
    return { editable: true, locked: false, reason: null };
  }
  return {
    editable: false,
    locked: true,
    reason: "Editing closed after 24 hours. Ask admin to unlock this assessment.",
  };
}

export type PatientVisitSummary = {
  id: string;
  appointment_code: string;
  status: string;
  visit_type: "initial" | "follow_up";
  preferred_date: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  preferred_time: string;
  created_at: string;
  has_assessment: boolean;
};

export type FollowUpSessionRow = {
  id: string;
  from_appointment_id: string;
  new_appointment_id: string | null;
  next_visit_date: string;
  next_visit_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

function visitSortKey(
  row: Pick<
    PatientVisitSummary,
    "scheduled_date" | "preferred_date" | "scheduled_time" | "preferred_time" | "created_at"
  >,
) {
  const date = row.scheduled_date || row.preferred_date || row.created_at.slice(0, 10);
  const time = row.scheduled_time || row.preferred_time || "00:00:00";
  return `${date}T${time}`;
}

export function isPriorVisitAppointment(
  appointmentId: string,
  visits: PatientVisitSummary[],
): boolean {
  const active = visits.filter((v) => !["cancelled", "rejected"].includes(v.status));
  if (active.length <= 1) return false;

  const sorted = [...active].sort((a, b) => visitSortKey(b).localeCompare(visitSortKey(a)));
  const currentVisit = sorted[0];
  if (currentVisit.id === appointmentId) return false;

  const target = active.find((v) => v.id === appointmentId);
  return Boolean(target?.has_assessment && target.status === "completed");
}

export async function fetchPatientVisitSummaries(patientId: string, excludeAppointmentId?: string) {
  const res = await supabaseRest<PatientVisitSummary[]>(
    `appointments?patient_id=eq.${patientId}&deleted_at=is.null&status=not.in.(cancelled,rejected)&select=id,appointment_code,status,visit_type,preferred_date,scheduled_date,scheduled_time,preferred_time,created_at&order=scheduled_date.desc.nullslast,preferred_date.desc,created_at.desc&limit=50`,
  );
  const visits = (res.data || []).filter((v) => v.id !== excludeAppointmentId);
  const ids = visits.map((v) => v.id);
  const saved = await fetchSavedAssessmentAppointmentIds(ids);
  const savedSet = new Set(saved.data || []);
  return {
    data: visits.map((v) => ({ ...v, has_assessment: savedSet.has(v.id) || v.status === "completed" })),
    error: res.error,
  };
}

export async function fetchPatientCompletedVisitCount(patientId: string, excludeAppointmentId?: string) {
  const res = await fetchPatientVisitSummaries(patientId, excludeAppointmentId);
  const count = (res.data || []).filter((v) => v.has_assessment && v.status === "completed").length;
  return { data: count, error: res.error };
}

export async function fetchLatestCompletedAppointmentId(
  patientId: string,
  excludeAppointmentId?: string,
) {
  const res = await fetchPatientVisitSummaries(patientId, excludeAppointmentId);
  const latest = (res.data || []).find((v) => v.has_assessment && v.status === "completed");
  return { data: latest?.id ?? null, error: res.error };
}

export async function fetchPatientFollowUpSessions(patientId: string) {
  return supabaseRest<FollowUpSessionRow[]>(
    `follow_up_sessions?patient_id=eq.${patientId}&deleted_at=is.null&select=id,from_appointment_id,new_appointment_id,next_visit_date,next_visit_time,status,notes,created_at&order=next_visit_date.desc,created_at.desc&limit=30`,
  );
}

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

export function unpackFindings(
  raw: string | null | undefined,
): Pick<AssessmentForm, "chief_complaint" | "medical_history" | "posture" | "clinical_findings"> {
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
        id: string;
        appointment_code: string;
        preferred_date: string;
        scheduled_date: string | null;
        visit_type: "initial" | "follow_up";
        status: string;
        physiotherapy_categories?: { name: string } | null;
      } | null;
    })[]
  >(
    `assessments?deleted_at=is.null&select=${ASSESS_SELECT},appointments!inner(id,appointment_code,preferred_date,scheduled_date,visit_type,status,patient_id,physiotherapy_categories(name))&appointments.patient_id=eq.${patientId}&order=created_at.desc`,
  );
}

export async function saveAssessment(
  form: AssessmentForm,
  options?: { allowLocked?: boolean },
) {
  if (form.id && !options?.allowLocked) {
    const existing = await fetchAssessmentForAppointment(form.appointment_id);
    const row = existing.data?.[0];
    const apptRes = await supabaseRest<{ patient_id: string }[]>(
      `appointments?id=eq.${form.appointment_id}&select=patient_id&limit=1`,
    );
    const patientId = apptRes.data?.[0]?.patient_id;
    let isPriorVisit = false;
    if (patientId) {
      const visits = await fetchPatientVisitSummaries(patientId);
      isPriorVisit = isPriorVisitAppointment(form.appointment_id, visits.data || []);
    }
    const lock = assessmentEditState(row, false, { isPriorVisit });
    if (lock.locked) {
      return { data: null, error: lock.reason || "Assessment is locked for editing." };
    }
  }

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
    const result = await supabaseRest<AssessmentRow[]>(`assessments?id=eq.${form.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!result.error) {
      await supabaseRest(`appointments?id=eq.${form.appointment_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
    }
    return result;
  }

  const result = await supabaseRest<AssessmentRow[]>("assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!result.error) {
    await supabaseRest(`appointments?id=eq.${form.appointment_id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
  }
  return result;
}

export async function fetchSavedAssessmentAppointmentIds(appointmentIds: string[]) {
  if (!appointmentIds.length) {
    return { data: [] as string[], error: null };
  }
  const res = await supabaseRest<{ appointment_id: string }[]>(
    `assessments?appointment_id=in.(${appointmentIds.join(",")})&deleted_at=is.null&select=appointment_id`,
  );
  return {
    data: (res.data || []).map((row) => row.appointment_id),
    error: res.error,
  };
}

export function isVisitDocumented(
  appointment: { id: string; status: string },
  assessedIds: Set<string>,
) {
  return appointment.status === "completed" || assessedIds.has(appointment.id);
}

export function visitSessionStatus(
  appointment: { id: string; status: string },
  assessedIds: Set<string>,
) {
  return isVisitDocumented(appointment, assessedIds) ? "completed" : "progress";
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
    symptoms:
      `Follow-up after ${input.fromAppointment.appointment_code}. ${input.notes || ""}`.trim(),
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
      visit_type: "follow_up",
      parent_appointment_id: input.fromAppointment.id,
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

export type AssessmentSessionRow = PhysioAppointment & {
  documented: boolean;
};

export async function fetchAllAssessmentSessions() {
  const { resolveStaffClinicId } = await import("@/lib/physio/physio-data");
  type PhysioAppointment = import("@/lib/physio/physio-data").PhysioAppointment;
  const { matchesClinicId } = await import("@/lib/patient/clinic-data");

  const clinicId = await resolveStaffClinicId();
  if (!clinicId) {
    return { data: [] as AssessmentSessionRow[], error: null };
  }

  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null&clinic_id=eq.${clinicId}&status=in.(accepted,checked_in,completed)&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,visit_type,parent_appointment_id,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,age_years,gender,profiles(full_name,phone))&order=scheduled_date.desc.nullslast,preferred_date.desc,scheduled_time.desc.nullslast,preferred_time.desc&limit=120`,
  );

  const list = (res.data || []).filter((item) => matchesClinicId(clinicId, item.clinic_id));
  const ids = list.map((item) => item.id);
  const saved = await fetchSavedAssessmentAppointmentIds(ids);
  const savedSet = new Set(saved.data || []);

  const rows: AssessmentSessionRow[] = list.map((appointment) => ({
    ...appointment,
    documented: savedSet.has(appointment.id) || appointment.status === "completed",
  }));

  rows.sort((a, b) => {
    const dateA = a.scheduled_date || a.preferred_date || "";
    const dateB = b.scheduled_date || b.preferred_date || "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    const timeA = (a.scheduled_time || a.preferred_time || "").slice(0, 5);
    const timeB = (b.scheduled_time || b.preferred_time || "").slice(0, 5);
    return timeB.localeCompare(timeA);
  });

  return { data: rows, error: res.error };
}

export async function fetchAssessableAppointments() {
  const { resolveStaffClinicId } = await import("@/lib/physio/physio-data");
  type PhysioAppointment = import("@/lib/physio/physio-data").PhysioAppointment;
  const { matchesClinicId } = await import("@/lib/patient/clinic-data");

  const clinicId = await resolveStaffClinicId();
  if (!clinicId) {
    return { data: [] as PhysioAppointment[], error: null };
  }

  const res = await supabaseRest<PhysioAppointment[]>(
    `appointments?deleted_at=is.null&clinic_id=eq.${clinicId}&status=in.(checked_in,completed,accepted)&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,age_years,gender,medical_history,profiles(full_name,phone))&order=scheduled_date.desc.nullslast,preferred_date.desc&limit=80`,
  );

  const list = (res.data || []).filter((item) => matchesClinicId(clinicId, item.clinic_id));
  const ids = list.map((item) => item.id);
  const saved = await fetchSavedAssessmentAppointmentIds(ids);
  const savedSet = new Set(saved.data || []);
  return {
    data: list.filter((item) => !savedSet.has(item.id)),
    error: res.error,
  };
}

export type AdminAssessmentRow = AssessmentRow & {
  appointments?: {
    appointment_code: string;
    clinic_id: string;
    clinics?: { id: string; name: string } | null;
    patients?: { profiles?: { full_name: string | null } | null } | null;
  } | null;
};

export async function fetchAdminAssessments() {
  return supabaseRest<AdminAssessmentRow[]>(
    `assessments?deleted_at=is.null&select=${ASSESS_SELECT},appointments(appointment_code,clinic_id,clinics(id,name),patients(profiles(full_name)))&order=created_at.desc&limit=200`,
  );
}

export async function setAssessmentAdminEditUnlocked(id: string, unlocked: boolean) {
  return supabaseRest<AssessmentRow[]>(`assessments?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ admin_edit_unlocked: unlocked }),
  });
}
