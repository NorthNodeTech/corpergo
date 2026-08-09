import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, ClipboardList, ScanLine, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PatientIntakeForm, type PatientIntakeValues } from "@/components/portal/PatientIntakeForm";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { LoadingSpinner, LoadingSpinnerLabel } from "@/components/ui/loading-spinner";
import { QrCameraScanner } from "@/components/portal/QrCameraScanner";
import { supabaseRest } from "@/lib/auth";
import {
  fetchPatientById,
  formatDateLabel,
  formatTimeLabel,
  updateMyPatient,
} from "@/lib/clinic-data";
import {
  emptyMedicalConditions,
  isPatientIntakeComplete,
  normalizePatient,
} from "@/lib/patient-intake";
import { scanQrToken, type PhysioAppointment } from "@/lib/physio-data";

export const Route = createFileRoute("/physio/scan")({
  component: QrScanPage,
  head: () => ({
    meta: [{ title: "Scan QR — CorpErgo Physio" }],
  }),
});

type CheckedInPatient = {
  appointment: PhysioAppointment;
  intake: PatientIntakeValues;
};

function QrScanPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [success, setSuccess] = useState<CheckedInPatient | null>(null);
  const [savingChart, setSavingChart] = useState(false);

  async function handleDecoded(raw: string) {
    if (busy || success) return;

    const token = extractToken(raw);
    if (!token) {
      toast.error("Could not read a valid ticket from this QR code.");
      return;
    }

    setBusy(true);
    setPaused(true);

    const { data, error } = await scanQrToken(token);
    if (error || !data) {
      setBusy(false);
      setPaused(false);
      toast.error(error || "Check-in failed. Ask the patient to refresh their QR ticket.");
      return;
    }

    const appointmentId = (data as { id?: string }).id;
    if (!appointmentId) {
      setBusy(false);
      setPaused(false);
      toast.error("Ticket scanned, but appointment details were missing.");
      return;
    }

    const { data: rows, error: loadError } = await supabaseRest<PhysioAppointment[]>(
      `appointments?id=eq.${appointmentId}&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,age_years,profiles(full_name,phone))&limit=1`,
    );

    if (loadError || !rows?.[0]) {
      setBusy(false);
      setPaused(false);
      toast.error(loadError || "Checked in, but could not load appointment details.");
      return;
    }

    const appointment = rows[0];
    const patientRes = await fetchPatientById(appointment.patient_id);
    setBusy(false);

    if (patientRes.error || !patientRes.data?.[0]) {
      setPaused(false);
      toast.error(patientRes.error || "Could not load patient health profile.");
      return;
    }

    const patient = normalizePatient({
      ...patientRes.data[0],
      medical_conditions: patientRes.data[0].medical_conditions || emptyMedicalConditions(),
    });

    setSuccess({
      appointment,
      intake: {
        full_name:
          patient.profiles?.full_name || appointment.patients?.profiles?.full_name || "Patient",
        phone: patient.profiles?.phone || "",
        email: patient.profiles?.email || "",
        patient,
      },
    });
  }

  function scanAnother() {
    setSuccess(null);
    setPaused(false);
    setBusy(false);
  }

  async function saveChart() {
    if (!success) return;
    setSavingChart(true);
    const { error } = await updateMyPatient(success.intake.patient.id, success.intake.patient);
    setSavingChart(false);
    if (error) toast.error(error);
    else toast.success("Patient chart saved");
  }

  if (success) {
    const a = success.appointment;
    const complete = isPatientIntakeComplete(success.intake.patient);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] bg-white p-6 sm:p-8 text-center ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--saffron)] text-white shadow-lg shadow-[var(--saffron)]/30"
          >
            <Check className="h-10 w-10" strokeWidth={3} />
          </motion.div>

          <h1 className="mt-5 text-3xl font-extrabold text-[var(--ink)]">Checked in</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Review this patient’s registration chart, complete any missing fields, then proceed.
          </p>

          <div className="mt-5 rounded-3xl bg-[var(--ivory)] p-4 text-left text-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--saffron-deep)]">
              {a.appointment_code}
            </div>
            <div className="mt-1 text-lg font-extrabold text-[var(--ink)]">
              {success.intake.full_name}
            </div>
            <div className="mt-1 text-[var(--ink-soft)]">
              {a.physiotherapy_categories?.name} · {a.clinics?.name}
            </div>
            <div className="mt-1 font-semibold text-[var(--ink)]">
              {formatDateLabel(a.scheduled_date || a.preferred_date)} ·{" "}
              {formatTimeLabel(a.scheduled_time || a.preferred_time)}
            </div>
          </div>

          {!complete ? (
            <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900">
              Registration chart is incomplete. Capture missing personal / medical details before
              assessment.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-[var(--saffron-light)] px-4 py-3 text-left text-sm font-semibold text-[var(--ink)]">
              Registration chart looks complete.
            </div>
          )}
        </motion.div>

        <div className="rounded-[2rem] bg-white p-6 sm:p-8 ring-1 ring-black/[0.05]">
          <h2 className="text-xl font-extrabold text-[var(--ink)]">Patient registration chart</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Personal details, emergency contact, medical history, allergies, and medications.
          </p>

          <div className="mt-6">
            <PatientIntakeForm
              values={success.intake}
              lockIdentity
              onChange={(intake) => setSuccess({ ...success, intake })}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={savingChart}
              onClick={() => void saveChart()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ivory)] px-6 py-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5 disabled:opacity-50"
            >
              {savingChart ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving…
                </>
              ) : (
                "Save patient chart"
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/physio/assessments/$appointmentId",
                  params: { appointmentId: a.id },
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-6 py-3.5 text-sm font-bold text-white"
            >
              <ClipboardList className="h-4 w-4" /> Proceed to assessment
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/physio/queue"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[var(--ink-soft)]"
            >
              View today’s queue
            </Link>
            <button
              type="button"
              onClick={scanAnother}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[var(--saffron-deep)]"
            >
              <ScanLine className="h-4 w-4" /> Scan another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Reception"
        title="Scan patient QR"
        description="Open the device camera, scan the boarding-pass ticket, then review the full patient chart."
        actions={
          <Link
            to="/physio/queue"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
          >
            <X className="h-4 w-4" /> Close
          </Link>
        }
      />

      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-5 sm:p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--saffron)] text-white">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-[var(--ink)]">Live camera scanner</div>
            <div className="text-sm text-[var(--ink-soft)]">
              {busy ? (
                <LoadingSpinnerLabel label="Verifying ticket…" size="sm" className="justify-start" />
              ) : (
                "Ready to scan"
              )}
            </div>
          </div>
        </div>

        <QrCameraScanner onScan={(text) => void handleDecoded(text)} paused={paused || busy} />

        {busy ? (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
            <LoadingSpinnerLabel
              label="Checking ticket and loading patient registration chart…"
              size="sm"
              labelClassName="text-amber-900"
              className="justify-start"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function extractToken(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const fromQuery = url.searchParams.get("token") || url.searchParams.get("t");
      if (fromQuery) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
  } catch {
    // not a URL
  }

  return trimmed;
}
