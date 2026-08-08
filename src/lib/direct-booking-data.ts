import { normalizePhone, supabasePublicRest, supabaseRest } from "@/lib/auth";
import type { Category, Clinic } from "@/lib/clinic-data";

export type DirectBookingGender = "male" | "female" | "other";

export type DirectBookingStatus = "new" | "called" | "ready_for_session" | "converted" | "closed";

export const ACTIVE_DIRECT_BOOKING_STATUSES: DirectBookingStatus[] = [
  "new",
  "called",
  "ready_for_session",
];

export function filterActiveDirectRequests(
  requests: DirectBookingRequest[],
  documentedAppointmentIds?: Iterable<string>,
) {
  const documented = new Set(documentedAppointmentIds || []);
  return requests.filter(
    (request) =>
      (request.booking_source || "web") === "web" &&
      ACTIVE_DIRECT_BOOKING_STATUSES.includes(request.status) &&
      (!request.appointment_id || !documented.has(request.appointment_id)),
  );
}

export function instantWalkInAppointments(
  requests: DirectBookingRequest[],
  appointments: import("@/lib/physio-data").PhysioAppointment[],
  documentedAppointmentIds: Set<string>,
) {
  const byId = new Map(appointments.map((appt) => [appt.id, appt]));
  return requests
    .filter(
      (request) =>
        request.booking_source === "instant" &&
        request.appointment_id &&
        !documentedAppointmentIds.has(request.appointment_id),
    )
    .map((request) => byId.get(request.appointment_id!))
    .filter((appt): appt is import("@/lib/physio-data").PhysioAppointment => Boolean(appt))
    .filter((appt) => appt.status !== "completed");
}

export type DirectBookingRequest = {
  id: string;
  request_code: string;
  clinic_id: string;
  full_name: string;
  phone: string;
  gender: DirectBookingGender;
  age_years: number;
  status: DirectBookingStatus;
  booking_source?: "web" | "instant";
  staff_notes: string | null;
  contacted_at: string | null;
  ready_at: string | null;
  converted_at: string | null;
  patient_user_id: string | null;
  patient_id: string | null;
  appointment_id: string | null;
  created_at: string;
  updated_at: string;
  clinics?: Pick<Clinic, "name" | "address" | "phone"> | null;
};

export type CreateDirectBookingInput = {
  fullName: string;
  phone: string;
  gender: DirectBookingGender;
  ageYears: number;
  clinicId: string;
};

export type ConvertDirectBookingInput = {
  requestId: string;
  email: string;
  password: string;
  categoryId: string | null;
  scheduledDate: string;
  scheduledTime: string;
};

export type ConvertDirectBookingResult = {
  request_id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string;
  appointment_code: string;
  email: string;
};

export async function fetchPublicClinics() {
  return supabasePublicRest<Clinic[]>(
    "clinics?is_active=eq.true&deleted_at=is.null&select=id,name,slug,address,city,phone,working_hours,slot_duration_minutes&order=name.asc",
  );
}

export async function createDirectBookingRequest(input: CreateDirectBookingInput) {
  const phone = normalizePhone(input.phone);
  const phoneDigits = phone.replace(/\D/g, "");
  if (!input.fullName.trim()) {
    return { data: null, error: "Please enter your name." };
  }
  if (phoneDigits.length < 10) {
    return { data: null, error: "Please enter a valid mobile number." };
  }
  if (!input.clinicId) {
    return { data: null, error: "Please choose a clinic." };
  }
  if (!Number.isFinite(input.ageYears) || input.ageYears < 0 || input.ageYears > 120) {
    return { data: null, error: "Please enter a valid age." };
  }

  return supabasePublicRest<null>("direct_booking_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      full_name: input.fullName.trim(),
      phone,
      gender: input.gender,
      age_years: input.ageYears,
      clinic_id: input.clinicId,
    }),
  });
}

export async function fetchDirectBookingRequests() {
  return supabaseRest<DirectBookingRequest[]>(
    "direct_booking_requests?deleted_at=is.null&status=in.(new,called,ready_for_session,converted)&select=id,request_code,clinic_id,full_name,phone,gender,age_years,status,booking_source,staff_notes,contacted_at,ready_at,converted_at,patient_user_id,patient_id,appointment_id,created_at,updated_at,clinics(name,address,phone)&order=created_at.desc&limit=200",
  );
}

export async function updateDirectBookingRequest(
  id: string,
  patch: Partial<
    Pick<DirectBookingRequest, "status" | "staff_notes" | "contacted_at" | "ready_at">
  >,
) {
  return supabaseRest<DirectBookingRequest[]>(`direct_booking_requests?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function convertDirectBookingRequest(input: ConvertDirectBookingInput) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { data: null, error: "Enter a valid email/login id." };
  }
  if (input.password.length < 6) {
    return { data: null, error: "Password must be at least 6 characters." };
  }

  const time = input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

  return supabaseRest<ConvertDirectBookingResult>("rpc/convert_direct_booking_request", {
    method: "POST",
    body: JSON.stringify({
      p_request_id: input.requestId,
      p_email: email,
      p_password: input.password,
      p_category_id: input.categoryId,
      p_scheduled_date: input.scheduledDate,
      p_scheduled_time: time,
    }),
  });
}

export function defaultDirectBookingEmail(request: DirectBookingRequest) {
  const digits = request.phone.replace(/\D/g, "").slice(-10);
  const handle = digits || request.request_code.toLowerCase().replace(/[^a-z0-9]+/g, ".");
  return `direct.${handle}@corpergo.direct`;
}

export function defaultDirectBookingPassword(request: DirectBookingRequest) {
  const digits = request.phone.replace(/\D/g, "");
  const tail = digits.slice(-4) || request.request_code.replace(/\D/g, "").slice(-4) || "0000";
  return `CE${tail}${new Date().getFullYear()}`;
}

export function defaultDirectBookingCategory(categories: Category[]) {
  return categories.find((category) => category.slug === "other")?.id || categories[0]?.id || null;
}
