import { normalizePhone, supabaseRest } from "@/lib/auth";
import type { DirectBookingGender } from "@/lib/direct-booking-data";

export type CreateInstantBookingInput = {
  fullName: string;
  phone: string;
  gender: DirectBookingGender;
  ageYears: number;
  email: string;
  password: string;
  categoryId: string | null;
  scheduledDate: string;
  scheduledTime: string;
  clinicId?: string;
};

export type CreateInstantBookingResult = {
  request_id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string;
  appointment_code: string;
  email: string;
};

export function defaultInstantBookingEmail(fullName: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const handle =
    digits ||
    fullName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") ||
    "walkin";
  return `instant.${handle}@corpergo.instant`;
}

export function defaultInstantBookingPassword(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-4) || "0000";
  return `CE${tail}${new Date().getFullYear()}`;
}

export async function createInstantPatientSession(input: CreateInstantBookingInput) {
  const phone = normalizePhone(input.phone);
  const email = input.email.trim().toLowerCase();
  const time = input.scheduledTime.length === 5 ? `${input.scheduledTime}:00` : input.scheduledTime;

  if (!input.fullName.trim()) {
    return { data: null, error: "Please enter the patient name." };
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { data: null, error: "Please enter a valid mobile number." };
  }
  if (!email.includes("@")) {
    return { data: null, error: "Enter a valid email/login id." };
  }
  if (input.password.length < 6) {
    return { data: null, error: "Password must be at least 6 characters." };
  }

  return supabaseRest<CreateInstantBookingResult>("rpc/create_instant_patient_session", {
    method: "POST",
    body: JSON.stringify({
      p_full_name: input.fullName.trim(),
      p_phone: phone,
      p_gender: input.gender,
      p_age_years: input.ageYears,
      p_email: email,
      p_password: input.password,
      p_category_id: input.categoryId,
      p_scheduled_date: input.scheduledDate,
      p_scheduled_time: time,
      p_clinic_id: input.clinicId || null,
    }),
  });
}
