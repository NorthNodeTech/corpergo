import { normalizePhone, supabaseRest } from "@/lib/auth";
import type { DirectBookingGender } from "@/lib/direct-booking-data";

export type CreateInstantBookingRequestInput = {
  fullName: string;
  phone: string;
  gender: DirectBookingGender;
  ageYears: number;
  clinicId?: string;
};

export type CreateInstantBookingRequestResult = {
  request_id: string;
  request_code: string;
};

export async function createInstantBookingRequest(input: CreateInstantBookingRequestInput) {
  const phone = normalizePhone(input.phone);

  if (!input.fullName.trim()) {
    return { data: null, error: "Please enter the patient name." };
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { data: null, error: "Please enter a valid mobile number." };
  }
  if (!Number.isFinite(input.ageYears) || input.ageYears < 0 || input.ageYears > 120) {
    return { data: null, error: "Please enter a valid age." };
  }

  return supabaseRest<CreateInstantBookingRequestResult>("rpc/create_instant_booking_request", {
    method: "POST",
    body: JSON.stringify({
      p_full_name: input.fullName.trim(),
      p_phone: phone,
      p_gender: input.gender,
      p_age_years: input.ageYears,
      p_clinic_id: input.clinicId || null,
    }),
  });
}
