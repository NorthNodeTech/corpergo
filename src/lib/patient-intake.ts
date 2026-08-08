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
  age_years: number | null;
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
  created_at?: string | null;
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

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

export const PATIENT_SELECT =
  "id,user_id,date_of_birth,age_years,gender,blood_group,address,city,pincode,medical_history,allergies,current_medications,emergency_contact_name,emergency_contact_phone,emergency_contact_relation,previous_surgeries,medical_conditions,medicine_allergies,food_allergies,other_allergies,other_medical_conditions,created_at,profiles(full_name,phone,email)";

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

export function ageFromPatient(
  patient: Pick<PatientRecord, "date_of_birth" | "age_years"> | null | undefined,
) {
  return ageFromDob(patient?.date_of_birth) ?? patient?.age_years ?? null;
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

export type ProfileCompletion = {
  percent: number;
  missing: { id: string; label: string }[];
  checks: { id: string; label: string; done: boolean }[];
};

export function computeProfileCompletion(values: {
  full_name: string;
  phone: string;
  email: string;
  patient: PatientRecord;
}): ProfileCompletion {
  const p = values.patient;
  const conditions = p.medical_conditions || {};
  const hasCondition =
    Object.values(conditions).some(Boolean) || Boolean(p.other_medical_conditions?.trim());
  const hasAllergy =
    Boolean(p.medicine_allergies?.trim()) ||
    Boolean(p.food_allergies?.trim()) ||
    Boolean(p.other_allergies?.trim()) ||
    Boolean(p.allergies?.trim());

  const checks = [
    {
      id: "personal",
      label: "Personal details",
      done: Boolean(values.full_name.trim() && values.phone.trim() && p.date_of_birth && p.gender),
    },
    { id: "blood", label: "Blood group", done: Boolean(p.blood_group) },
    {
      id: "address",
      label: "Address",
      done: Boolean(p.address?.trim() && p.city?.trim() && p.pincode?.trim()),
    },
    {
      id: "emergency",
      label: "Emergency contact",
      done: Boolean(p.emergency_contact_name?.trim() && p.emergency_contact_phone?.trim()),
    },
    {
      id: "medical",
      label: "Medical history",
      done: hasCondition || Boolean(p.previous_surgeries?.trim()),
    },
    { id: "allergies", label: "Allergies", done: hasAllergy },
    {
      id: "medications",
      label: "Current medications",
      done: Boolean(p.current_medications?.trim()),
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  return {
    percent,
    checks,
    missing: checks.filter((c) => !c.done).map(({ id, label }) => ({ id, label })),
  };
}

export function formatPatientCode(patientId: string, year = new Date().getFullYear()) {
  const tail = patientId.replace(/-/g, "").slice(-5).toUpperCase();
  return `CE-${year}-${tail.padStart(5, "0")}`;
}
