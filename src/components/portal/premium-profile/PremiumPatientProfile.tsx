import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Pill,
  QrCode,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GlassDatePicker } from "@/components/portal/GlassDatePicker";
import { StatusBadge } from "@/components/portal/StatusBadge";
import type { PatientIntakeValues } from "@/components/portal/PatientIntakeForm";
import {
  formatDateLabel,
  formatTimeLabel,
  type Appointment,
} from "@/lib/clinic-data";
import {
  BLOOD_GROUPS,
  MEDICAL_CONDITION_OPTIONS,
  ageFromDob,
  computeProfileCompletion,
  formatPatientCode,
  type MedicalConditions,
} from "@/lib/patient-intake";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const ALLERGY_CHIPS = [
  { key: "medicine", label: "Medicine" },
  { key: "food", label: "Food" },
  { key: "dust", label: "Dust" },
  { key: "latex", label: "Latex" },
  { key: "none", label: "None" },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function SectionCard({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  action,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon: typeof UserRound;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="scroll-mt-28 rounded-[22px] border border-black/[0.04] bg-[color-mix(in_oklab,white_88%,var(--ivory))] p-5 shadow-[var(--shadow-soft)] sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--sage)]/12 text-[var(--sage-deep)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[var(--ink)]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon?: typeof UserRound;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        {Icon ? <Icon className="h-3.5 w-3.5 text-[var(--sage)]" /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "premium-input w-full rounded-2xl border border-black/[0.06] bg-white/90 px-4 py-3.5 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-soft)]/70 focus:border-[var(--sage)]/40 focus:ring-4 focus:ring-[var(--sage)]/15 disabled:bg-[var(--ivory)] disabled:opacity-70 min-h-12";

function Chip({
  active,
  children,
  onClick,
  interactive = true,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
}) {
  if (!interactive) {
    if (!active) return null;
    return (
      <span className="inline-flex min-h-10 items-center rounded-full bg-[var(--sage)]/12 px-4 py-2 text-sm font-semibold text-[var(--sage-deep)]">
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--sage)] text-white shadow-sm"
          : "bg-white text-[var(--ink-soft)] ring-1 ring-black/[0.06] hover:bg-[var(--sage)]/8 hover:text-[var(--sage-deep)]",
      )}
    >
      {children}
    </button>
  );
}

function CircularProgress({ percent }: { percent: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative h-[88px] w-[88px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-extrabold text-white">{percent}%</span>
      </div>
    </div>
  );
}

export function PremiumPatientProfile({
  values,
  onChange,
  appointments,
  saving,
  dirty,
  onSave,
  onDiscard,
  savedFlash,
}: {
  values: PatientIntakeValues;
  onChange: (next: PatientIntakeValues) => void;
  appointments: Appointment[];
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  savedFlash: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const age = ageFromDob(values.patient.date_of_birth);
  const completion = useMemo(() => computeProfileCompletion(values), [values]);
  const patientCode = formatPatientCode(values.patient.id);
  const memberSince = values.patient.created_at
    ? new Date(values.patient.created_at).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => ["pending", "accepted", "checked_in"].includes(a.status))
        .sort((a, b) => {
          const da = a.scheduled_date || a.preferred_date;
          const db = b.scheduled_date || b.preferred_date;
          return da.localeCompare(db);
        })[0],
    [appointments],
  );

  const recent = useMemo(() => appointments.slice(0, 5), [appointments]);
  const primaryClinic = upcoming?.clinics?.name || appointments[0]?.clinics?.name || "—";

  const conditions = values.patient.medical_conditions || {};
  const activeConditions = MEDICAL_CONDITION_OPTIONS.filter((o) => conditions[o.key]);

  const allergyActive = {
    medicine: Boolean(values.patient.medicine_allergies?.trim()),
    food: Boolean(values.patient.food_allergies?.trim()),
    dust: /dust/i.test(values.patient.other_allergies || ""),
    latex: /latex/i.test(values.patient.other_allergies || ""),
    none:
      !values.patient.medicine_allergies?.trim() &&
      !values.patient.food_allergies?.trim() &&
      !values.patient.other_allergies?.trim(),
  };

  function patchPatient(patch: Partial<PatientIntakeValues["patient"]>) {
    onChange({ ...values, patient: { ...values.patient, ...patch } });
  }

  function toggleCondition(key: keyof MedicalConditions) {
    const current = values.patient.medical_conditions || {};
    patchPatient({
      medical_conditions: { ...current, [key]: !current[key] },
    });
  }

  function toggleAllergy(key: (typeof ALLERGY_CHIPS)[number]["key"]) {
    if (key === "none") {
      patchPatient({
        medicine_allergies: null,
        food_allergies: null,
        other_allergies: null,
        allergies: "None",
      });
      return;
    }
    if (key === "medicine") {
      patchPatient({
        medicine_allergies: values.patient.medicine_allergies?.trim()
          ? null
          : "Yes — specify details below if needed",
        allergies: null,
      });
      return;
    }
    if (key === "food") {
      patchPatient({
        food_allergies: values.patient.food_allergies?.trim()
          ? null
          : "Yes — specify details below if needed",
        allergies: null,
      });
      return;
    }
    const tag = key === "dust" ? "Dust" : "Latex";
    const current = values.patient.other_allergies || "";
    const has = new RegExp(tag, "i").test(current);
    if (has) {
      patchPatient({
        other_allergies:
          current
            .split(/[,|]/)
            .map((s) => s.trim())
            .filter((s) => s && !new RegExp(tag, "i").test(s))
            .join(", ") || null,
        allergies: null,
      });
    } else {
      patchPatient({
        other_allergies: current.trim() ? `${current.trim()}, ${tag}` : tag,
        allergies: null,
      });
    }
  }

  function scrollToMissing() {
    const first = completion.missing[0]?.id;
    if (first === "personal" || first === "blood") {
      document.getElementById("personal")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (first === "address") {
      setExtrasOpen(true);
      window.setTimeout(
        () => document.getElementById("address")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } else if (first === "emergency") {
      setExtrasOpen(true);
      window.setTimeout(
        () =>
          document.getElementById("emergency")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } else {
      setExtrasOpen(true);
      window.setTimeout(
        () => document.getElementById("medical")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }
  }

  useEffect(() => {
    if (savedFlash) setEditing(false);
  }, [savedFlash]);

  useEffect(() => {
    if (!dirty || !editing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, editing, onSave]);

  function startEditing() {
    setEditing(true);
    setExtrasOpen(true);
  }

  function cancelEditing() {
    if (dirty) onDiscard();
    setEditing(false);
  }

  const alerts = [
    allergyActive.medicine || allergyActive.food || allergyActive.dust || allergyActive.latex
      ? "Allergies on file"
      : null,
    activeConditions.length ? `${activeConditions.length} condition(s)` : null,
    values.patient.current_medications?.trim() ? "On medication" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="relative mx-auto max-w-5xl pb-28">
      {/* Profile header */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[24px] border border-black/[0.04] bg-gradient-to-br from-[var(--sage-deep)] via-[var(--sage)] to-[var(--teal)] p-6 text-white shadow-[var(--shadow-elev)] sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15 text-2xl font-extrabold ring-4 ring-white/25 backdrop-blur">
              {initials(values.full_name)}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Health record
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{values.full_name || "Patient"}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
                <span>Patient ID · {patientCode}</span>
                <span>Member since · {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToMissing}
              className="rounded-2xl bg-white/10 p-3 backdrop-blur transition hover:bg-white/15"
              aria-label="Profile completion"
            >
              <CircularProgress percent={completion.percent} />
              <div className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/80">
                Complete
              </div>
            </button>
            <button
              type="button"
              onClick={() => (editing ? cancelEditing() : startEditing())}
              className="min-h-12 rounded-full bg-white px-5 text-sm font-bold text-[var(--sage-deep)] shadow-sm transition hover:bg-[var(--ivory)]"
            >
              {editing ? "Cancel" : "Edit profile"}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero summary */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {[
          { icon: CalendarDays, label: "Age", value: age != null ? `${age} yrs` : "—" },
          { icon: UserRound, label: "Gender", value: values.patient.gender || "—" },
          { icon: Droplets, label: "Blood", value: values.patient.blood_group || "—" },
          { icon: Building2, label: "Clinic", value: primaryClinic },
          {
            icon: Calendar,
            label: "Next visit",
            value: upcoming
              ? formatDateLabel(upcoming.scheduled_date || upcoming.preferred_date)
              : "None",
          },
          {
            icon: AlertTriangle,
            label: "Alerts",
            value: alerts.length ? String(alerts.length) : "None",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-[20px] border border-black/[0.04] bg-white/80 p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center gap-2 text-[var(--sage-deep)]">
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                {label}
              </span>
            </div>
            <div className="mt-2 truncate text-base font-extrabold text-[var(--ink)] capitalize">
              {value}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Completion nudge */}
      {completion.percent < 100 ? (
        <button
          type="button"
          onClick={scrollToMissing}
          className="mt-5 flex w-full items-center gap-4 rounded-[20px] border border-[var(--sage)]/20 bg-[var(--sage)]/8 px-5 py-4 text-left transition hover:bg-[var(--sage)]/12"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-[var(--ink)]">
              Profile completion · {completion.percent}%
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/80">
              <motion.div
                className="h-full rounded-full bg-[var(--sage)]"
                initial={{ width: 0 }}
                animate={{ width: `${completion.percent}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Complete your medical history to improve your consultation experience.
              {completion.missing[0] ? ` Next: ${completion.missing[0].label}.` : ""}
            </p>
          </div>
          <ChevronDown className="h-5 w-5 -rotate-90 text-[var(--sage-deep)]" />
        </button>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          {/* Personal */}
          <SectionCard
            id="personal"
            title="Personal information"
            subtitle="Identity details used across CorpErgo clinics"
            icon={UserRound}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" icon={UserRound} className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={values.full_name}
                  disabled={!editing}
                  onChange={(e) => onChange({ ...values, full_name: e.target.value })}
                />
              </Field>
              <Field label="Phone" icon={Phone}>
                <input
                  className={inputClass}
                  value={values.phone}
                  disabled={!editing}
                  onChange={(e) => onChange({ ...values, phone: e.target.value })}
                />
              </Field>
              <Field label="Email" icon={Mail}>
                <input className={inputClass} value={values.email} disabled />
              </Field>
              <Field label="Date of birth" icon={CalendarDays}>
                {editing ? (
                  <GlassDatePicker
                    value={values.patient.date_of_birth}
                    onChange={(iso) => patchPatient({ date_of_birth: iso })}
                    placeholder="Select date of birth"
                    yearDropdown
                    maxDate={new Date()}
                    className="!mt-0 !rounded-2xl !border-black/[0.06] !bg-white/90 !py-3.5 !shadow-none"
                  />
                ) : (
                  <input
                    className={inputClass}
                    disabled
                    value={
                      values.patient.date_of_birth
                        ? formatDateLabel(values.patient.date_of_birth)
                        : "—"
                    }
                  />
                )}
              </Field>
              <Field label="Age">
                <input className={inputClass} disabled value={age != null ? `${age} years` : "—"} />
              </Field>
              <Field label="Gender" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {(editing
                    ? ["female", "male", "other", "prefer_not_to_say"]
                    : [values.patient.gender].filter(Boolean)
                  ).map((g) => (
                    <Chip
                      key={g as string}
                      interactive={editing}
                      active={values.patient.gender === g}
                      onClick={() => patchPatient({ gender: g as string })}
                    >
                      {g === "prefer_not_to_say"
                        ? "Prefer not to say"
                        : String(g)[0]!.toUpperCase() + String(g).slice(1)}
                    </Chip>
                  ))}
                  {!editing && !values.patient.gender ? (
                    <span className="text-sm text-[var(--ink-soft)]">Not set</span>
                  ) : null}
                </div>
              </Field>
              <Field label="Blood group" icon={Droplets} className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {(editing ? BLOOD_GROUPS : [values.patient.blood_group].filter(Boolean)).map(
                    (g) => (
                      <Chip
                        key={g as string}
                        interactive={editing}
                        active={values.patient.blood_group === g}
                        onClick={() => patchPatient({ blood_group: g as string })}
                      >
                        {g}
                      </Chip>
                    ),
                  )}
                  {!editing && !values.patient.blood_group ? (
                    <span className="text-sm text-[var(--ink-soft)]">Not set</span>
                  ) : null}
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* Additional details toggle */}
          <button
            type="button"
            onClick={() => setExtrasOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-[22px] border border-black/[0.04] bg-white/80 px-5 py-4 text-left shadow-[var(--shadow-soft)] transition hover:bg-white"
          >
            <div>
              <div className="text-base font-extrabold text-[var(--ink)]">Additional details</div>
              <div className="mt-0.5 text-sm text-[var(--ink-soft)]">
                Address, emergency contact, medical history, allergies & medications
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-[var(--sage-deep)] transition-transform",
                extrasOpen && "rotate-180",
              )}
            />
          </button>

          {extrasOpen ? (
            <>
              <SectionCard id="address" title="Address" subtitle="Home location for clinic coordination" icon={MapPin}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Street address" className="sm:col-span-2">
                    <textarea
                      className={cn(inputClass, "min-h-[88px] resize-y")}
                      rows={2}
                      disabled={!editing}
                      value={values.patient.address || ""}
                      onChange={(e) => patchPatient({ address: e.target.value || null })}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={inputClass}
                      disabled={!editing}
                      value={values.patient.city || ""}
                      onChange={(e) => patchPatient({ city: e.target.value || null })}
                    />
                  </Field>
                  <Field label="Pincode">
                    <input
                      className={inputClass}
                      disabled={!editing}
                      value={values.patient.pincode || ""}
                      onChange={(e) => patchPatient({ pincode: e.target.value || null })}
                    />
                  </Field>
                  <div className="sm:col-span-2 rounded-2xl border border-dashed border-[var(--sage)]/25 bg-[var(--sage)]/5 px-4 py-6 text-center text-sm text-[var(--ink-soft)]">
                    Google Maps preview · coming soon
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                id="emergency"
                title="Emergency contact"
                subtitle="Someone we can reach during your visit"
                icon={Users}
              >
                <div className="rounded-[20px] bg-gradient-to-br from-[var(--sage)]/10 to-[var(--bronze)]/10 p-5 ring-1 ring-black/[0.04]">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Contact name">
                      <input
                        className={inputClass}
                        disabled={!editing}
                        value={values.patient.emergency_contact_name || ""}
                        onChange={(e) =>
                          patchPatient({ emergency_contact_name: e.target.value || null })
                        }
                      />
                    </Field>
                    <Field label="Relationship">
                      <input
                        className={inputClass}
                        disabled={!editing}
                        value={values.patient.emergency_contact_relation || ""}
                        onChange={(e) =>
                          patchPatient({ emergency_contact_relation: e.target.value || null })
                        }
                        placeholder="Spouse, parent…"
                      />
                    </Field>
                    <Field label="Phone" icon={Phone}>
                      <input
                        className={inputClass}
                        disabled={!editing}
                        value={values.patient.emergency_contact_phone || ""}
                        onChange={(e) =>
                          patchPatient({ emergency_contact_phone: e.target.value || null })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                id="medical"
                title="Medical information"
                subtitle="Help your physiotherapist understand your history"
                icon={HeartPulse}
              >
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      Known conditions
                    </div>
                    {editing || activeConditions.length ? (
                      <div className="flex flex-wrap gap-2">
                        {(editing ? MEDICAL_CONDITION_OPTIONS : activeConditions).map(
                          ({ key, label }) => (
                            <Chip
                              key={key}
                              interactive={editing}
                              active={Boolean(conditions[key])}
                              onClick={() => toggleCondition(key)}
                            >
                              {label}
                            </Chip>
                          ),
                        )}
                      </div>
                    ) : (
                      <EmptyMedical />
                    )}
                  </div>

                  <Field label="Previous surgeries">
                    <textarea
                      className={cn(inputClass, "min-h-[72px] resize-y")}
                      rows={2}
                      disabled={!editing}
                      value={values.patient.previous_surgeries || ""}
                      onChange={(e) => patchPatient({ previous_surgeries: e.target.value || null })}
                      placeholder="Year and procedure, if any"
                    />
                  </Field>

                  <Field label="Other medical conditions">
                    <textarea
                      className={cn(inputClass, "min-h-[72px] resize-y")}
                      rows={2}
                      disabled={!editing}
                      value={values.patient.other_medical_conditions || ""}
                      onChange={(e) =>
                        patchPatient({ other_medical_conditions: e.target.value || null })
                      }
                    />
                  </Field>

                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      Allergies
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(editing
                        ? ALLERGY_CHIPS
                        : ALLERGY_CHIPS.filter(({ key }) => allergyActive[key])
                      ).map(({ key, label }) => (
                        <Chip
                          key={key}
                          interactive={editing}
                          active={allergyActive[key]}
                          onClick={() => toggleAllergy(key)}
                        >
                          {label}
                        </Chip>
                      ))}
                      {!editing &&
                      !allergyActive.medicine &&
                      !allergyActive.food &&
                      !allergyActive.dust &&
                      !allergyActive.latex &&
                      !allergyActive.none ? (
                        <span className="text-sm text-[var(--ink-soft)]">None listed</span>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Field label="Medicine details">
                        <textarea
                          className={cn(inputClass, "min-h-[64px] resize-y")}
                          rows={2}
                          disabled={!editing}
                          value={values.patient.medicine_allergies || ""}
                          onChange={(e) =>
                            patchPatient({ medicine_allergies: e.target.value || null })
                          }
                        />
                      </Field>
                      <Field label="Food details">
                        <textarea
                          className={cn(inputClass, "min-h-[64px] resize-y")}
                          rows={2}
                          disabled={!editing}
                          value={values.patient.food_allergies || ""}
                          onChange={(e) => patchPatient({ food_allergies: e.target.value || null })}
                        />
                      </Field>
                      <Field label="Other details">
                        <textarea
                          className={cn(inputClass, "min-h-[64px] resize-y")}
                          rows={2}
                          disabled={!editing}
                          value={values.patient.other_allergies || ""}
                          onChange={(e) => patchPatient({ other_allergies: e.target.value || null })}
                        />
                      </Field>
                    </div>
                  </div>

                  <Field label="Current medications" icon={Pill}>
                    <textarea
                      className={cn(inputClass, "min-h-[120px] resize-y")}
                      rows={4}
                      disabled={!editing}
                      value={values.patient.current_medications || ""}
                      onChange={(e) =>
                        patchPatient({ current_medications: e.target.value || null })
                      }
                      placeholder="Enter current medications prescribed by your doctor..."
                    />
                  </Field>
                </div>
              </SectionCard>
            </>
          ) : null}
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <SectionCard title="Health summary" subtitle="At-a-glance clinical snapshot" icon={Shield}>
            <dl className="space-y-3 text-sm">
              <SummaryRow label="Blood group" value={values.patient.blood_group || "—"} />
              <SummaryRow label="Age" value={age != null ? `${age} years` : "—"} />
              <SummaryRow
                label="Conditions"
                value={
                  activeConditions.length
                    ? activeConditions.map((c) => c.label).join(", ")
                    : "None listed"
                }
              />
              <SummaryRow
                label="Allergies"
                value={
                  [
                    values.patient.medicine_allergies && "Medicine",
                    values.patient.food_allergies && "Food",
                    values.patient.other_allergies,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "None listed"
                }
              />
              <SummaryRow
                label="Medications"
                value={values.patient.current_medications?.trim() || "None listed"}
              />
              <SummaryRow
                label="Emergency"
                value={
                  values.patient.emergency_contact_name
                    ? `${values.patient.emergency_contact_name}${
                        values.patient.emergency_contact_phone
                          ? ` · ${values.patient.emergency_contact_phone}`
                          : ""
                      }`
                    : "Not set"
                }
              />
            </dl>
            {activeConditions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeConditions.map((c) => (
                  <span
                    key={c.key}
                    className="rounded-full bg-[var(--sage)]/12 px-3 py-1 text-xs font-bold text-[var(--sage-deep)]"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Next appointment" subtitle="Upcoming clinic visit" icon={Calendar}>
            {upcoming ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-extrabold text-[var(--ink)]">
                      {upcoming.clinics?.name || "Clinic"}
                    </div>
                    <div className="text-sm text-[var(--ink-soft)]">
                      {upcoming.physiotherapy_categories?.name || "Physiotherapy"}
                    </div>
                  </div>
                  <StatusBadge status={upcoming.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold text-[var(--ink)]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-[var(--bronze)]" />
                    {formatDateLabel(upcoming.scheduled_date || upcoming.preferred_date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--bronze)]" />
                    {formatTimeLabel(upcoming.scheduled_time || upcoming.preferred_time)}
                  </span>
                </div>
                <div className="text-sm text-[var(--ink-soft)]">
                  Physio · {upcoming.physiotherapists?.profiles?.full_name || "Assigned at clinic"}
                </div>
                {upcoming.status === "accepted" ? (
                  <Link
                    to="/patient/qr-ticket"
                    className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--sage)] px-4 text-sm font-bold text-white transition hover:bg-[var(--sage-deep)]"
                  >
                    <QrCode className="h-4 w-4" /> View QR ticket
                  </Link>
                ) : (
                  <Link
                    to="/patient/appointments"
                    className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ivory)] px-4 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    View appointments
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[var(--ivory)] px-4 py-6 text-center">
                <p className="text-sm text-[var(--ink-soft)]">No upcoming appointment.</p>
                <Link
                  to="/patient/book"
                  className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--sage)] px-5 text-sm font-bold text-white"
                >
                  Book now
                </Link>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent activity" subtitle="Your care timeline" icon={HeartPulse}>
            {recent.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">Activity will appear after your first booking.</p>
            ) : (
              <ol className="space-y-0">
                {recent.map((a, i) => (
                  <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < recent.length - 1 ? (
                      <span className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-[var(--sage)]/25" />
                    ) : null}
                    <span className="relative z-[1] mt-1 h-[18px] w-[18px] shrink-0 rounded-full bg-[var(--sage)] ring-4 ring-[var(--sage)]/15" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--ink)] capitalize">
                        {a.status.replaceAll("_", " ")} · {a.appointment_code}
                      </div>
                      <div className="text-xs text-[var(--ink-soft)]">
                        {a.clinics?.name} ·{" "}
                        {formatDateLabel(a.scheduled_date || a.preferred_date)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Sticky save bar — only while editing */}
      {editing ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-40 px-3 sm:bottom-6 lg:bottom-6">
          <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-[22px] border border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(38,50,56,0.16)] backdrop-blur-xl sm:px-5">
            <div className="min-w-0 text-sm">
              {savedFlash ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--sage-deep)]">
                  <Check className="h-4 w-4" /> Changes saved
                </span>
              ) : dirty ? (
                <span className="font-semibold text-[var(--ink)]">Unsaved changes</span>
              ) : (
                <span className="text-[var(--ink-soft)]">Editing profile</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="min-h-11 rounded-full px-4 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={!dirty || saving}
                onClick={onSave}
                className="min-h-11 rounded-full bg-[var(--sage)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--sage-deep)] disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save changes"}
              </motion.button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-black/[0.04] pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-[var(--ink-soft)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function EmptyMedical() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--sage)]/25 bg-[var(--sage)]/5 px-4 py-8 text-center">
      <HeartPulse className="mx-auto h-8 w-8 text-[var(--sage)]" />
      <p className="mt-3 text-sm font-semibold text-[var(--ink)]">No medical history yet</p>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Add your medical history to help your physiotherapist understand your condition better.
      </p>
    </div>
  );
}
