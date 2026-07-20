import { useMemo } from "react";
import {
  BLOOD_GROUPS,
  MEDICAL_CONDITION_OPTIONS,
  ageFromDob,
  type MedicalConditions,
  type PatientRecord,
} from "@/lib/patient-intake";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--sage)] disabled:opacity-70";

export type PatientIntakeValues = {
  full_name: string;
  phone: string;
  email: string;
  patient: PatientRecord;
};

type PatientIntakeFormProps = {
  values: PatientIntakeValues;
  onChange: (next: PatientIntakeValues) => void;
  /** When true, name/phone/email are locked (physio reviewing patient-owned identity). */
  lockIdentity?: boolean;
  className?: string;
};

export function PatientIntakeForm({
  values,
  onChange,
  lockIdentity = false,
  className,
}: PatientIntakeFormProps) {
  const age = useMemo(() => ageFromDob(values.patient.date_of_birth), [values.patient.date_of_birth]);

  function patchPatient(patch: Partial<PatientRecord>) {
    onChange({
      ...values,
      patient: { ...values.patient, ...patch },
    });
  }

  function toggleCondition(key: keyof MedicalConditions) {
    const current = values.patient.medical_conditions || {};
    patchPatient({
      medical_conditions: {
        ...current,
        [key]: !current[key],
      },
    });
  }

  return (
    <div className={cn("space-y-8", className)}>
      <section>
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Personal details</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Basic information for safe clinical care. Update only when something changes.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[var(--ink)] sm:col-span-2">
            Full name
            <input
              className={fieldClass}
              value={values.full_name}
              disabled={lockIdentity}
              onChange={(e) => onChange({ ...values, full_name: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Date of birth
            <input
              type="date"
              className={fieldClass}
              value={values.patient.date_of_birth || ""}
              onChange={(e) => patchPatient({ date_of_birth: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Age (auto-calculated)
            <input className={fieldClass} value={age != null ? `${age} years` : "—"} disabled />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Gender
            <select
              className={fieldClass}
              value={values.patient.gender || ""}
              onChange={(e) => patchPatient({ gender: e.target.value || null })}
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Blood group
            <select
              className={fieldClass}
              value={values.patient.blood_group || ""}
              onChange={(e) => patchPatient({ blood_group: e.target.value || null })}
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Phone number
            <input
              className={fieldClass}
              value={values.phone}
              disabled={lockIdentity}
              onChange={(e) => onChange({ ...values, phone: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Email
            <input className={fieldClass} value={values.email} disabled />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)] sm:col-span-2">
            Address
            <textarea
              className={fieldClass}
              rows={2}
              value={values.patient.address || ""}
              onChange={(e) => patchPatient({ address: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            City
            <input
              className={fieldClass}
              value={values.patient.city || ""}
              onChange={(e) => patchPatient({ city: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Pincode
            <input
              className={fieldClass}
              value={values.patient.pincode || ""}
              onChange={(e) => patchPatient({ pincode: e.target.value || null })}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Emergency contact</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Contact name
            <input
              className={fieldClass}
              value={values.patient.emergency_contact_name || ""}
              onChange={(e) => patchPatient({ emergency_contact_name: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Phone number
            <input
              className={fieldClass}
              value={values.patient.emergency_contact_phone || ""}
              onChange={(e) => patchPatient({ emergency_contact_phone: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Relationship
            <input
              className={fieldClass}
              value={values.patient.emergency_contact_relation || ""}
              onChange={(e) =>
                patchPatient({ emergency_contact_relation: e.target.value || null })
              }
              placeholder="Spouse, parent, friend…"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Medical history</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MEDICAL_CONDITION_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-2xl bg-[var(--ivory)] px-4 py-3 text-sm font-semibold text-[var(--ink)] ring-1 ring-black/5"
            >
              <input
                type="checkbox"
                checked={Boolean(values.patient.medical_conditions?.[key])}
                onChange={() => toggleCondition(key)}
                className="h-5 w-5 rounded border-[var(--sage)]"
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold text-[var(--ink)]">
          Previous surgeries
          <textarea
            className={fieldClass}
            rows={2}
            value={values.patient.previous_surgeries || ""}
            onChange={(e) => patchPatient({ previous_surgeries: e.target.value || null })}
            placeholder="Year and procedure, if any"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-[var(--ink)]">
          Other medical conditions
          <textarea
            className={fieldClass}
            rows={2}
            value={values.patient.other_medical_conditions || ""}
            onChange={(e) => patchPatient({ other_medical_conditions: e.target.value || null })}
          />
        </label>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Allergies</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Medicine allergies
            <textarea
              className={fieldClass}
              rows={2}
              value={values.patient.medicine_allergies || ""}
              onChange={(e) => patchPatient({ medicine_allergies: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Food allergies
            <textarea
              className={fieldClass}
              rows={2}
              value={values.patient.food_allergies || ""}
              onChange={(e) => patchPatient({ food_allergies: e.target.value || null })}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--ink)]">
            Other allergies
            <textarea
              className={fieldClass}
              rows={2}
              value={values.patient.other_allergies || ""}
              onChange={(e) => patchPatient({ other_allergies: e.target.value || null })}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Current medications</h2>
        <label className="mt-4 block text-sm font-semibold text-[var(--ink)]">
          List medicines and doses
          <textarea
            className={fieldClass}
            rows={5}
            value={values.patient.current_medications || ""}
            onChange={(e) => patchPatient({ current_medications: e.target.value || null })}
            placeholder="Example: Taking Metformin 500mg twice daily."
          />
        </label>
      </section>
    </div>
  );
}
