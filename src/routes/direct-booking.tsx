import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import { GoogleMapsIcon, PhoneAppIcon } from "@/shared/components/icons/BrandIcons";
import {
  createDirectBookingRequest,
  fetchPublicClinics,
  type DirectBookingGender,
} from "@/lib/booking/direct-booking-data";
import type { Clinic } from "@/lib/patient/clinic-data";
import { cn } from "@/lib/core/utils";
import { LoadingSpinner, LoadingSpinnerLabel } from "@/shared/components/ui/loading-spinner";

export const Route = createFileRoute("/direct-booking")({
  component: DirectBookingPage,
  head: () => ({
    meta: [
      { title: "Direct booking - CorpErgo Physiotherapy" },
      {
        name: "description",
        content:
          "Book a quick physiotherapy appointment request without logging in. CorpErgo clinic staff will call to confirm.",
      },
    ],
  }),
});

function DirectBookingPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<DirectBookingGender | "">("");
  const [age, setAge] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedClinic, setSubmittedClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadClinics() {
      setLoadingClinics(true);
      const { data } = await fetchPublicClinics();
      if (cancelled) return;
      const list = data || [];
      setClinics(list);
      setClinicId((current) => current || list[0]?.id || "");
      setLoadingClinics(false);
    }
    void loadClinics();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === clinicId) || null,
    [clinicId, clinics],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!gender) {
      setError("Please choose gender.");
      return;
    }

    const ageYears = Number(age);
    setSubmitting(true);
    const { error: submitError } = await createDirectBookingRequest({
      fullName,
      phone,
      gender,
      ageYears,
      clinicId,
    });
    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setSubmittedClinic(selectedClinic);
  }

  return (
    <main className="min-h-dvh bg-[var(--ivory)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[var(--ink-soft)] ring-1 ring-black/5 transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[var(--sage-deep)] ring-1 ring-black/5"
          >
            Login
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
          <section>
            <CorpErgoLogo size="lg" />
            <p className="type-eyebrow mt-7 font-black text-[var(--bronze)]">
              Direct booking
            </p>
            <h1 className="type-h1 mt-3 max-w-xl font-extrabold tracking-tight text-balance">
              Request a visit in under a minute.
            </h1>
            <p className="type-lead mt-4 max-w-lg text-[var(--ink-soft)]">
              No login needed. Share only the details the clinic needs to call you and confirm the
              appointment.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[var(--ink-soft)] sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                <PhoneAppIcon className="h-4 w-4" />
                Staff confirms by phone
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                <ShieldCheck className="h-4 w-4 text-[var(--sage)]" />
                Account can be created at the clinic
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-7">
            {submittedClinic ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="type-h2 mt-5 font-extrabold tracking-tight">Request sent</h2>
                <p className="type-body-sm mx-auto mt-2 max-w-sm text-[var(--ink-soft)]">
                  {submittedClinic.name} has received your request. A clinician will call{" "}
                  {phone.trim()} to confirm whether the appointment is booked.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white"
                  >
                    Done
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setFullName("");
                      setPhone("");
                      setGender("");
                      setAge("");
                      setSubmittedClinic(null);
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ivory)] px-5 py-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    Send another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="type-h2 font-extrabold tracking-tight">Quick details</h2>
                  <p className="type-body-sm mt-1 text-[var(--ink-soft)]">
                    The clinic will call this number before confirming the visit.
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  <Field label="Full name">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Patient name"
                      autoComplete="name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Mobile number">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Gender">
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as DirectBookingGender | "")}
                        className={inputClass}
                      >
                        <option value="">Choose</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Age">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        inputMode="numeric"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Clinic">
                    <div className="relative">
                      <GoogleMapsIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                      <select
                        value={clinicId}
                        onChange={(e) => setClinicId(e.target.value)}
                        disabled={loadingClinics}
                        className={cn(inputClass, "pl-10")}
                      >
                    {loadingClinics ? (
                      <option>Loading clinics…</option>
                    ) : (
                          clinics.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {loadingClinics ? (
                      <LoadingSpinnerLabel
                        label="Loading clinics…"
                        size="sm"
                        className="mt-2 justify-start"
                      />
                    ) : null}
                    {selectedClinic ? (
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">
                        {selectedClinic.address}
                      </p>
                    ) : null}
                  </Field>

                  {error ? (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting || loadingClinics}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] px-5 py-3.5 text-sm font-bold text-white shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--pink-hover)] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="text-white" />
                        Sending request…
                      </>
                    ) : (
                      "Direct book"
                    )}
                    {!submitting ? (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    ) : null}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] transition-all placeholder:text-[var(--ink-soft)]/55 focus:outline-none focus:ring-2 focus:ring-[var(--sage)] disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[var(--ink)]">
      <span className="type-label font-bold text-[var(--ink-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}
