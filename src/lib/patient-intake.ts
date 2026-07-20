export type MedicalConditions = {
  diabetes?: boolean;
  hypertension?: boolean;
  heart_disease?: boolean;
  thyroid?: boolean;
  arthritis?: boolean;
  asthma?: boolean;
  neurological?: boolean;
};

export type PatientRecord = {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  medical_history: string | null;
  allergies: string | null;
  current_medications: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  previous_surgeries: string | null;
  medical_conditions: MedicalConditions | null;
  medicine_allergies: string | null;
  food_allergies: string | null;
  other_allergies: string | null;
  other_medical_conditions: string | null;
  profiles?: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
};

export const MEDICAL_CONDITION_OPTIONS: {
  key: keyof MedicalConditions;
  label: string;
}[] = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "heart_disease", label: "Heart Disease" },
  { key: "thyroid", label: "Thyroid" },
  { key: "arthritis", label: "Arthritis" },
  { key: "asthma", label: "Asthma" },
  { key: "neurological", label: "Neurological Disorders" },
];

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
] as const;

export const PATIENT_SELECT =
  "id,user_id,date_of_birth,gender,blood_group,address,city,pincode,medical_history,allergies,current_medications,emergency_contact_name,emergency_contact_phone,emergency_contact_relation,previous_surgeries,medical_conditions,medicine_allergies,food_allergies,other_allergies,other_medical_conditions,profiles(full_name,phone,email)";

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const born = new Date(dob + "T12:00:00");
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export function emptyMedicalConditions(): MedicalConditions {
  return {
    diabetes: false,
    hypertension: false,
    heart_disease: false,
    thyroid: false,
    arthritis: false,
    asthma: false,
    neurological: false,
  };
}

export function normalizePatient(row: PatientRecord): PatientRecord {
  return {
    ...row,
    medical_conditions: {
      ...emptyMedicalConditions(),
      ...(row.medical_conditions || {}),
    },
  };
}

export function composeAllergiesSummary(p: PatientRecord): string {
  const parts = [
    p.medicine_allergies ? `Medicine: ${p.medicine_allergies}` : "",
    p.food_allergies ? `Food: ${p.food_allergies}` : "",
    p.other_allergies ? `Other: ${p.other_allergies}` : "",
  ].filter(Boolean);
  return parts.join(" | ") || p.allergies || "";
}

export function isPatientIntakeComplete(p: PatientRecord): boolean {
  return Boolean(
    p.date_of_birth &&
      p.gender &&
      p.blood_group &&
      p.address &&
      p.city &&
      p.pincode &&
      p.emergency_contact_name &&
      p.emergency_contact_phone,
  );
}
