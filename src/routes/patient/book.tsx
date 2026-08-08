import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { fetchMyProfile } from "@/lib/auth";
import {
  createAppointment,
  ensureSlotsGenerated,
  fetchCategories,
  fetchClinics,
  fetchMyPatient,
  fetchSlotsForClinicDate,
  formatDateLabel,
  formatTimeLabel,
  uniqueSlotTimes,
  updateMyPatient,
  type Category,
  type Clinic,
} from "@/lib/clinic-data";
import type { DirectBookingGender } from "@/lib/direct-booking-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/book")({
  component: BookAppointmentPage,
});

const STEPS = [
  "Clinic",
  "Category",
  "About you",
  "Problem",
  "Date & time",
  "Confirm",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  orthopaedic: "🦴",
  neurological: "🧠",
  "sports-rehabilitation": "🏃",
  musculoskeletal: "💪",
  "womens-health": "🌸",
  pediatric: "🧒",
  geriatric: "🌿",
  "post-surgical": "🏥",
};

function BookAppointmentPage() {
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [gender, setGender] = useState<DirectBookingGender | "">("");
  const [ageYears, setAgeYears] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start_time: string; end_time: string; available: boolean; remaining_slots?: number }[]>(
    [],
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await ensureSlotsGenerated();
      const [c, cat] = await Promise.all([fetchClinics(), fetchCategories()]);
      if (cancelled) return;
      if (c.error) setLoadError(c.error);
      setClinics(c.data || []);
      setCategories(cat.data || []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchMyPatient().then((res) => {
      if (cancelled) return;
      const patient = res.data?.[0];
      if (!patient) return;
      if (patient.gender) {
        setGender(patient.gender as DirectBookingGender);
      }
      if (patient.age_years != null) {
        setAgeYears(String(patient.age_years));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dateIso = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;

  useEffect(() => {
    if (!clinicId || !dateIso) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    void fetchSlotsForClinicDate(clinicId, dateIso).then((res) => {
      if (cancelled) return;
      setSlots(uniqueSlotTimes(res.data || []));
      setSlotsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clinicId, dateIso]);

  const selectedClinic = useMemo(
    () => clinics.find((c) => c.id === clinicId) || null,
    [clinics, clinicId],
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId],
  );

  function canNext() {
    if (step === 0) return !!clinicId;
    if (step === 1) return !!categoryId;
    if (step === 2) {
      const age = Number(ageYears);
      return !!gender && Number.isFinite(age) && age >= 0 && age <= 120;
    }
    if (step === 3) return symptoms.trim().length >= 10;
    if (step === 4) return !!dateIso && !!time;
    return true;
  }

  async function submit() {
    if (!clinicId || !categoryId || !dateIso || !time || !gender) return;
    const age = Number(ageYears);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      toast.error("Please enter a valid age.");
      return;
    }

    setSubmitting(true);
    const [profileRes, patientRes] = await Promise.all([fetchMyProfile(), fetchMyPatient()]);
    const profile = profileRes.data;
    const patient = patientRes.data?.[0];
    if (!profile || !patient) {
      setSubmitting(false);
      toast.error(profileRes.error || patientRes.error || "Could not load your patient profile.");
      return;
    }

    const patientUpdate = await updateMyPatient(patient.id, {
      gender,
      age_years: age,
    });
    if (patientUpdate.error) {
      setSubmitting(false);
      toast.error(patientUpdate.error);
      return;
    }

    const { data, error } = await createAppointment({
      patientId: patient.id,
      clinicId,
      categoryId,
      preferredDate: dateIso,
      preferredTime: time.length === 5 ? `${time}:00` : time,
      symptoms,
      createdBy: profile.id,
    });

    setSubmitting(false);
    if (error || !data?.[0]) {
      toast.error(error || "Could not request appointment.");
      return;
    }

    toast.success("Appointment requested");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg text-center"
      >
        <div className="rounded-[2rem] bg-white p-10 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-[var(--ink)]">Request submitted</h1>
          <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
            Your booking request has been sent to <strong>{selectedClinic?.name || "the clinic"}</strong>.
            Once the {selectedClinic?.name || "clinic"} portal reviews and accepts your request, your booking will be <strong>confirmed</strong> and your QR boarding pass will be ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/patient/appointments"
              className="rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white"
            >
              View my appointments
            </Link>
            <Link
              to="/patient/dashboard"
              className="rounded-full bg-[var(--ivory)] px-6 py-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Booking"
        title="Book an appointment"
        description="Five simple steps. Large buttons. We’ll guide you through clinic, care type, and time."
      />

      {loadError ? (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</div>
      ) : null}

      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
              i === step
                ? "bg-[var(--sage)] text-white"
                : i < step
                  ? "bg-[var(--sage)]/15 text-[var(--sage-deep)]"
                  : "bg-white text-[var(--ink-soft)] ring-1 ring-black/5",
            )}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-black/10 text-[10px]">
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-5 sm:p-8 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--bronze)]" /> Choose your clinic
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  All five CorpErgo branches in Bengaluru.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {clinics.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClinicId(c.id)}
                      className={cn(
                        "rounded-3xl p-5 text-left transition-all ring-1",
                        clinicId === c.id
                          ? "bg-[var(--sage)] text-white ring-[var(--sage)] shadow-lg scale-[1.02]"
                          : "bg-[var(--ivory)] text-[var(--ink)] ring-black/5 hover:ring-[var(--sage)]/40",
                      )}
                    >
                      <div className="text-lg font-extrabold">{c.name}</div>
                      <div
                        className={cn(
                          "mt-2 text-sm leading-relaxed",
                          clinicId === c.id ? "text-white/85" : "text-[var(--ink-soft)]",
                        )}
                      >
                        {c.address}
                      </div>
                      {c.phone ? (
                        <div
                          className={cn(
                            "mt-3 text-xs font-semibold",
                            clinicId === c.id ? "text-white/80" : "text-[var(--bronze)]",
                          )}
                        >
                          {c.phone}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--bronze)]" /> Care category
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Pick the physiotherapy focus that best matches your needs.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "rounded-3xl p-5 text-left ring-1 transition-all",
                        categoryId === cat.id
                          ? "bg-[var(--sage)] text-white ring-[var(--sage)]"
                          : "bg-[var(--ivory)] ring-black/5 hover:ring-[var(--sage)]/40",
                      )}
                    >
                      <div className="text-2xl">{CATEGORY_ICONS[cat.slug] || "✨"}</div>
                      <div className="mt-3 font-extrabold">{cat.name}</div>
                      <div
                        className={cn(
                          "mt-1 text-sm line-clamp-2",
                          categoryId === cat.id ? "text-white/85" : "text-[var(--ink-soft)]",
                        )}
                      >
                        {cat.description || "Specialized physiotherapy care"}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)]">About you</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Help your physiotherapist prepare with basic details.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[var(--ink)]">
                    Age
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageYears}
                      onChange={(e) => setAgeYears(e.target.value)}
                      placeholder="e.g. 34"
                      className="mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[var(--ink)]">
                    Gender
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as DirectBookingGender)}
                      className="mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)]">Describe your problem</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  A few sentences help your physiotherapist prepare.
                </p>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={8}
                  placeholder={`Examples:\n• Lower back pain for 2 weeks, worse when sitting\n• Knee stiffness after surgery, difficulty climbing stairs\n• Shoulder pain while lifting the arm above head`}
                  className="mt-6 w-full rounded-3xl border-0 bg-[var(--ivory)] px-5 py-4 text-base text-[var(--ink)] placeholder:text-[var(--ink-soft)]/70 ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
                />
                <div className="mt-2 text-xs text-[var(--ink-soft)]">
                  Minimum 10 characters · {symptoms.trim().length} typed
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)] flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[var(--bronze)]" /> Choose date & time
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Pick a day, then select an available slot at {selectedClinic?.name || "your clinic"}.
                  Sundays and past dates are unavailable.
                </p>
                <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
                  <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:justify-start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        setTime(null);
                      }}
                      disabled={(d) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return d < today || d.getDay() === 0;
                      }}
                      formatters={{
                        formatWeekdayName: (d) =>
                          d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
                      }}
                      className="std-calendar w-[300px]"
                      classNames={{
                        root: "w-[300px]",
                        months: "flex w-full flex-col",
                        month: "flex w-full flex-col gap-3",
                        weekdays: "mb-1 grid w-full grid-cols-7",
                        weekday:
                          "flex h-8 w-full items-center justify-center text-[11px] font-semibold text-slate-500",
                        week: "mt-0 grid w-full grid-cols-7",
                        day: "h-9 w-full p-0 text-center",
                        today: "rounded-md bg-slate-100 font-semibold text-[var(--ink)]",
                        caption_label: "text-sm font-semibold text-[var(--ink)]",
                        button_previous: "rounded-md hover:bg-slate-100",
                        button_next: "rounded-md hover:bg-slate-100",
                      }}
                    />
                  </div>

                  <div className="min-w-0 rounded-2xl bg-[var(--ivory)] p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                      <Clock className="h-4 w-4 text-[var(--bronze)]" />
                      {dateIso
                        ? `Available slots · ${formatDateLabel(dateIso)}`
                        : "Select a date to see available times"}
                    </div>

                    {!dateIso ? (
                      <p className="mt-4 text-sm text-[var(--ink-soft)]">
                        Choose a date on the calendar first.
                      </p>
                    ) : slotsLoading ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-2xl bg-white" />
                        ))}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        No slots found for this day. Try another date.
                      </p>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {slots.map((s) => {
                          const rem =
                            s.remaining_slots !== undefined
                              ? s.remaining_slots
                              : s.available
                                ? 2
                                : 0;
                          return (
                            <button
                              key={s.start_time}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setTime(s.start_time)}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-2xl px-3 py-2.5 transition-all ring-1 text-center cursor-pointer",
                                !s.available
                                  ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-transparent opacity-60"
                                  : time === s.start_time
                                    ? "bg-[var(--sage)] text-white ring-[var(--sage)] shadow-sm"
                                    : "bg-white text-[var(--ink)] ring-black/5 hover:ring-[var(--sage)]/40",
                              )}
                            >
                              <span className="text-sm font-extrabold">
                                {formatTimeLabel(s.start_time)}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold mt-0.5",
                                  !s.available
                                    ? "text-red-500 font-bold"
                                    : time === s.start_time
                                      ? "text-emerald-100"
                                      : rem === 1
                                        ? "text-amber-600 font-bold"
                                        : "text-emerald-600",
                                )}
                              >
                                {rem > 0
                                  ? `${rem} ${rem === 1 ? "slot left" : "slots available"}`
                                  : "Full (0 slots)"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-xl font-extrabold text-[var(--ink)]">Confirm request</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Review details, then submit. Status will be Pending until the clinic accepts.
                </p>
                <dl className="mt-6 space-y-4 rounded-3xl bg-[var(--ivory)] p-5">
                  {[
                    ["Clinic", selectedClinic?.name],
                    ["Category", selectedCategory?.name],
                    ["Age", ageYears ? `${ageYears} years` : "—"],
                    ["Gender", gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "—"],
                    ["Problem", symptoms],
                    [
                      "Date & time",
                      dateIso && time
                        ? `${formatDateLabel(dateIso)} · ${formatTimeLabel(time)}`
                        : "—",
                    ],
                  ].map(([k, v]) => (
                    <div key={k as string} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                        {k}
                      </dt>
                      <dd className="text-[var(--ink)] font-semibold whitespace-pre-wrap">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-[85px] z-30 mt-28 flex flex-wrap items-center justify-between gap-3 rounded-b-[2rem] border-t border-black/[0.05] bg-white/95 py-4 backdrop-blur-md sm:bottom-4 sm:mt-12 sm:bg-white">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-[var(--ink-soft)] disabled:opacity-40 hover:bg-[var(--ivory)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex-1 text-right">
            <AnimatePresence mode="popLayout">
              {canNext() && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-block"
                >
                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStep((s) => s + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--sage)]/20 hover:bg-[var(--sage-deep)]"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void submit()}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--sage)]/20 disabled:opacity-40 hover:bg-[var(--sage-deep)]"
                    >
                      {submitting ? "Submitting…" : "Request appointment"}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
