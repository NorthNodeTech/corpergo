import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  BLOOD_GROUPS,
  MEDICAL_CONDITION_OPTIONS,
  ageFromPatient,
  type MedicalConditions,
  type PatientRecord,
} from "@/lib/patient/patient-intake";
import { GlassDatePicker } from "@/shared/components/layout/GlassDatePicker";
import { cn } from "@/lib/core/utils";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20 disabled:bg-slate-50 disabled:opacity-70";

const labelClass = "block text-sm font-medium text-[var(--ink)]";

export type PatientIntakeValues = {
  full_name: string;
  phone: string;
  email: string;
  avatar_url?: string | null;
  patient: PatientRecord;
};

type PatientIntakeFormProps = {
  values: PatientIntakeValues;
  onChange: (next: PatientIntakeValues) => void;
  /** When true, name/phone/email are locked (physio reviewing patient-owned identity). */
  lockIdentity?: boolean;
  /**
   * Patient profile UX: show core fields only; tuck the rest under
   * “Additional details”. Physio review should leave this false/undefined.
   */
  collapsibleExtras?: boolean;
  className?: string;
};

export function PatientIntakeForm({
  values,
  onChange,
  lockIdentity = false,
  collapsibleExtras = false,
  className,
}: PatientIntakeFormProps) {
  const age = ageFromPatient(values.patient);
  const [extrasOpen, setExtrasOpen] = useState(!collapsibleExtras);

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

  const showExtras = !collapsibleExtras || extrasOpen;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Core identity — always visible */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--ink)]">Personal details</h2>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
            Required information for your clinic visits.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={cn(labelClass, "sm:col-span-2")}>
            Full name
            <input
              className={fieldClass}
              value={values.full_name}
              disabled={lockIdentity}
              onChange={(e) => onChange({ ...values, full_name: e.target.value })}
              required
            />
          </label>

          <label className={labelClass}>
            Phone number
            <input
              className={fieldClass}
              value={values.phone}
              disabled={lockIdentity}
              onChange={(e) => onChange({ ...values, phone: e.target.value })}
              inputMode="tel"
            />
          </label>

          <label className={labelClass}>
            Email
            <input className={fieldClass} value={values.email} disabled />
          </label>

          <label className={labelClass}>
            Date of birth
            <GlassDatePicker
              value={values.patient.date_of_birth}
              onChange={(iso) => patchPatient({ date_of_birth: iso })}
              placeholder="Select date of birth"
              yearDropdown
              maxDate={new Date()}
              allowClear
            />
          </label>

          <label className={labelClass}>
            Age
            <input className={fieldClass} value={age != null ? `${age} years` : "—"} disabled />
          </label>

          <label className={labelClass}>
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

          <label className={labelClass}>
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
        </div>
      </section>

      {collapsibleExtras ? (
        <button
          type="button"
          onClick={() => setExtrasOpen((v) => !v)}
          aria-expanded={extrasOpen}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">Additional details</div>
            <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
              Address, emergency contact, medical history, allergies & medications
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200",
              extrasOpen && "rotate-180",
            )}
          />
        </button>
      ) : null}

      {showExtras ? (
        <div className="space-y-6">
          <section
            className={cn(collapsibleExtras && "rounded-xl border border-slate-200 p-4 sm:p-5")}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={cn(labelClass, "sm:col-span-2")}>
                Street address
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={values.patient.address || ""}
                  onChange={(e) => patchPatient({ address: e.target.value || null })}
                />
              </label>
              <label className={labelClass}>
                City
                <input
                  className={fieldClass}
                  value={values.patient.city || ""}
                  onChange={(e) => patchPatient({ city: e.target.value || null })}
                />
              </label>
              <label className={labelClass}>
                Pincode
                <input
                  className={fieldClass}
                  value={values.patient.pincode || ""}
                  onChange={(e) => patchPatient({ pincode: e.target.value || null })}
                />
              </label>
            </div>
          </section>

          <section
            className={cn(collapsibleExtras && "rounded-xl border border-slate-200 p-4 sm:p-5")}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">Emergency contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Contact name
                <input
                  className={fieldClass}
                  value={values.patient.emergency_contact_name || ""}
                  onChange={(e) => patchPatient({ emergency_contact_name: e.target.value || null })}
                />
              </label>
              <label className={labelClass}>
                Phone number
                <input
                  className={fieldClass}
                  value={values.patient.emergency_contact_phone || ""}
                  onChange={(e) =>
                    patchPatient({ emergency_contact_phone: e.target.value || null })
                  }
                />
              </label>
              <label className={labelClass}>
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

          <section
            className={cn(collapsibleExtras && "rounded-xl border border-slate-200 p-4 sm:p-5")}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">Medical history</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {MEDICAL_CONDITION_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--ink)]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(values.patient.medical_conditions?.[key])}
                    onChange={() => toggleCondition(key)}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--sage)] focus:ring-[var(--sage)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <label className={cn(labelClass, "mt-4")}>
              Previous surgeries
              <textarea
                className={fieldClass}
                rows={2}
                value={values.patient.previous_surgeries || ""}
                onChange={(e) => patchPatient({ previous_surgeries: e.target.value || null })}
                placeholder="Year and procedure, if any"
              />
            </label>
            <label className={cn(labelClass, "mt-4")}>
              Other medical conditions
              <textarea
                className={fieldClass}
                rows={2}
                value={values.patient.other_medical_conditions || ""}
                onChange={(e) => patchPatient({ other_medical_conditions: e.target.value || null })}
              />
            </label>
          </section>

          <section
            className={cn(collapsibleExtras && "rounded-xl border border-slate-200 p-4 sm:p-5")}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">Allergies</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Medicine allergies
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={values.patient.medicine_allergies || ""}
                  onChange={(e) => patchPatient({ medicine_allergies: e.target.value || null })}
                />
              </label>
              <label className={labelClass}>
                Food allergies
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={values.patient.food_allergies || ""}
                  onChange={(e) => patchPatient({ food_allergies: e.target.value || null })}
                />
              </label>
              <label className={labelClass}>
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

          <section
            className={cn(collapsibleExtras && "rounded-xl border border-slate-200 p-4 sm:p-5")}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">Current medications</h2>
            <label className={cn(labelClass, "mt-4")}>
              List medicines and doses
              <textarea
                className={fieldClass}
                rows={4}
                value={values.patient.current_medications || ""}
                onChange={(e) => patchPatient({ current_medications: e.target.value || null })}
                placeholder="Example: Metformin 500mg twice daily"
              />
            </label>
          </section>
        </div>
      ) : null}
    </div>
  );
}
