import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/shared/components/layout/PortalPageHeader";
import { LoadingSpinner, LoadingSpinnerLabel, LoadingState } from "@/shared/components/ui/loading-spinner";
import {
  FollowUpSchedulerModal,
  nextBookableDate,
  type FollowUpSlot,
} from "@/features/physio/components/FollowUpSchedulerModal";
import { PatientVisitSidebar } from "@/features/physio/components/PatientVisitSidebar";
import { fetchMyProfile, supabaseRest } from "@/lib/auth";
import {
  assessmentFromRow,
  assessmentEditState,
  emptyAssessment,
  fetchAssessmentForAppointment,
  fetchPatientAssessments,
  fetchPatientVisitSummaries,
  isPriorVisitAppointment,
  saveAssessment,
  scheduleFollowUp,
  type AssessmentForm,
  type AssessmentRow,
  type PatientVisitSummary,
} from "@/lib/physio/assessment-data";
import { formatDateLabel, uniqueSlotTimes } from "@/lib/patient/clinic-data";
import {
  ageFromPatient,
  fetchAvailableSlots,
  fetchMyPhysioId,
  formatPatientGender,
  type PhysioAppointment,
} from "@/lib/physio/physio-data";
import { cn } from "@/lib/core/utils";

export const Route = createFileRoute("/physio/assessments/$appointmentId")({
  component: AssessmentEditorPage,
});

const field =
  "mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]";

function AssessmentEditorPage() {
  const { appointmentId } = Route.useParams();
  const [appt, setAppt] = useState<PhysioAppointment | null>(null);
  const [assessmentRow, setAssessmentRow] = useState<AssessmentRow | null>(null);
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [timeline, setTimeline] = useState<
    NonNullable<Awaited<ReturnType<typeof fetchPatientAssessments>>["data"]>
  >([]);
  const [visitSummaries, setVisitSummaries] = useState<PatientVisitSummary[]>([]);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [followDate, setFollowDate] = useState<Date | undefined>();
  const [followTime, setFollowTime] = useState<string | null>(null);
  const [followSlots, setFollowSlots] = useState<FollowUpSlot[]>([]);
  const [followSlotsLoading, setFollowSlotsLoading] = useState(false);
  const formRef = useRef(form);
  const savingRef = useRef(false);
  formRef.current = form;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [apptRes, assessRes, me] = await Promise.all([
        supabaseRest<PhysioAppointment[]>(
          `appointments?id=eq.${appointmentId}&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,visit_type,parent_appointment_id,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,age_years,gender,medical_history,profiles(full_name,phone))&limit=1`,
        ),
        fetchAssessmentForAppointment(appointmentId),
        fetchMyPhysioId(),
      ]);
      if (cancelled) return;
      const a = apptRes.data?.[0] || null;
      setAppt(a);
      const pid = me.data?.[0]?.id || null;
      setPhysioId(pid);
      const existing = assessRes.data?.[0];
      setAssessmentRow(existing || null);
      const base = existing
        ? assessmentFromRow(existing, pid)
        : emptyAssessment(appointmentId, pid);
      if (!existing && a?.patients?.medical_history) {
        base.medical_history = a.patients.medical_history;
      }
      if (!existing && a?.symptoms) {
        base.chief_complaint = a.symptoms;
      }
      setForm(base);
      setDirty(false);
      if (a?.patient_id) {
        const [tl, visits] = await Promise.all([
          fetchPatientAssessments(a.patient_id),
          fetchPatientVisitSummaries(a.patient_id),
        ]);
        if (!cancelled) {
          setTimeline(tl.data || []);
          setVisitSummaries(visits.data || []);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const followIso = followDate
    ? `${followDate.getFullYear()}-${String(followDate.getMonth() + 1).padStart(2, "0")}-${String(followDate.getDate()).padStart(2, "0")}`
    : null;

  useEffect(() => {
    if (!appt || !followIso) {
      setFollowSlots([]);
      setFollowSlotsLoading(false);
      return;
    }
    let cancelled = false;
    setFollowSlotsLoading(true);
    void fetchAvailableSlots(appt.clinic_id, followIso).then((res) => {
      if (cancelled) return;
      setFollowSlots(uniqueSlotTimes(res.data || []));
      setFollowSlotsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [appt, followIso]);

  useEffect(() => {
    if (!followOpen) return;
    setFollowDate((current) => current ?? nextBookableDate());
    setFollowTime(null);
  }, [followOpen]);

  async function persist(silent = false): Promise<boolean> {
    const current = formRef.current;
    if (!current || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    const { data, error } = await saveAssessment(current);
    savingRef.current = false;
    setSaving(false);
    if (error) {
      if (!silent) toast.error(error);
      return false;
    }
    const saved = data?.[0];
    if (saved) {
      setAssessmentRow(saved);
      setForm((prev) => {
        if (!prev) return prev;
        if (prev.id === saved.id) return prev;
        return { ...prev, id: saved.id };
      });
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      if (!silent) toast.success("Saved");
    }
    return true;
  }

  async function onSave() {
    await persist(false);
  }

  async function confirmFollowUp() {
    if (!appt || !physioId || !followIso || !followTime) {
      toast.error("Choose follow-up date and time");
      return;
    }
    const profile = await fetchMyProfile();
    if (!profile.data) {
      toast.error("Could not load profile");
      return;
    }
    setSaving(true);
    const { error } = await scheduleFollowUp({
      fromAppointment: appt,
      physioId,
      date: followIso,
      time: followTime,
      notes: form?.notes || "",
      createdBy: profile.data.id,
    });
    setSaving(false);
    if (error) toast.error(error);
    else {
      toast.success("Follow-up booked — patient notified");
      setFollowOpen(false);
      if (appt.patient_id) {
        const [tl, visits] = await Promise.all([
          fetchPatientAssessments(appt.patient_id),
          fetchPatientVisitSummaries(appt.patient_id),
        ]);
        setTimeline(tl.data || []);
        setVisitSummaries(visits.data || []);
      }
    }
  }

  function patch<K extends keyof AssessmentForm>(key: K, value: AssessmentForm[K]) {
    if (!editable) return;
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  if (!appt || !form) {
    return <LoadingState label="Loading assessment…" variant="plain" minHeight="min-h-[30vh]" />;
  }

  const patientName = appt.patients?.profiles?.full_name || "Patient";
  const age = ageFromPatient(appt.patients);
  const gender = formatPatientGender(appt.patients?.gender);
  const isPriorVisit = isPriorVisitAppointment(appointmentId, visitSummaries);
  const editState = assessmentEditState(assessmentRow, !form.id, { isPriorVisit });
  const editable = editState.editable;
  const visitLabel = appt.visit_type === "follow_up" ? "Follow-up session" : "Assessment session";
  const upcomingVisits = visitSummaries.filter(
    (v) =>
      v.id !== appointmentId &&
      !v.has_assessment &&
      ["accepted", "checked_in", "pending"].includes(v.status),
  );
  const pastAssessments = timeline.filter((t) => t.appointment_id !== appointmentId);
  const isCurrentVisit = !isPriorVisit;

  return (
    <div>
      <PortalPageHeader
        eyebrow={appt.appointment_code}
        title={`Assess ${patientName}`}
        description={`${appt.clinics?.name} · ${appt.physiotherapy_categories?.name} · ${formatDateLabel(appt.scheduled_date || appt.preferred_date)} · ${visitLabel}`}
      />

      {editState.locked ? (
        <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
          {editState.reason}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/[0.05]">
            <h2 className="font-extrabold text-[var(--ink)]">Patient information</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[var(--ink-soft)]">Name</span>
                <div className="font-semibold">{patientName}</div>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Age</span>
                <div className="font-semibold">{age != null ? `${age} years` : "—"}</div>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Gender</span>
                <div className="font-semibold capitalize">{gender || "—"}</div>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Phone</span>
                <div className="font-semibold">{appt.patients?.profiles?.phone || "—"}</div>
              </div>
              <div>
                <span className="text-[var(--ink-soft)]">Category</span>
                <div className="font-semibold">{appt.physiotherapy_categories?.name}</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/[0.05] space-y-4">
            <label className="block text-sm font-semibold">
              Medical history
              <textarea
                className={field}
                rows={2}
                value={form.medical_history}
                readOnly={!editable}
                onChange={(e) => patch("medical_history", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Chief complaint
              <textarea
                className={field}
                rows={2}
                value={form.chief_complaint}
                readOnly={!editable}
                onChange={(e) => patch("chief_complaint", e.target.value)}
              />
            </label>
            <div>
              <div className="text-sm font-semibold">Pain scale (1–10)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={!editable}
                    onClick={() => patch("pain_score", n)}
                    className={cn(
                      "h-10 w-10 rounded-xl text-sm font-bold ring-1",
                      form.pain_score === n
                        ? "bg-[var(--saffron)] text-white ring-[var(--saffron)]"
                        : "bg-[var(--ivory)] ring-black/5",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm font-semibold">
              Body pain location
              <input
                className={field}
                value={form.body_part}
                readOnly={!editable}
                onChange={(e) => patch("body_part", e.target.value)}
                placeholder="e.g. Right lumbar, left knee"
              />
            </label>
            <label className="block text-sm font-semibold">
              Posture
              <textarea
                className={field}
                rows={2}
                value={form.posture}
                readOnly={!editable}
                onChange={(e) => patch("posture", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              ROM
              <textarea
                className={field}
                rows={2}
                value={form.range_of_motion}
                readOnly={!editable}
                onChange={(e) => patch("range_of_motion", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Muscle strength
              <textarea
                className={field}
                rows={2}
                value={form.muscle_strength}
                readOnly={!editable}
                onChange={(e) => patch("muscle_strength", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Special tests
              <textarea
                className={field}
                rows={2}
                value={form.special_tests}
                readOnly={!editable}
                onChange={(e) => patch("special_tests", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Clinical findings
              <textarea
                className={field}
                rows={2}
                value={form.clinical_findings}
                readOnly={!editable}
                onChange={(e) => patch("clinical_findings", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Diagnosis
              <input
                className={field}
                value={form.diagnosis}
                readOnly={!editable}
                onChange={(e) => patch("diagnosis", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Treatment given
              <textarea
                className={field}
                rows={2}
                value={form.treatment_given}
                readOnly={!editable}
                onChange={(e) => patch("treatment_given", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Exercises / home program
              <textarea
                className={field}
                rows={2}
                value={form.home_exercise}
                readOnly={!editable}
                onChange={(e) => patch("home_exercise", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Clinical notes
              <textarea
                className={field}
                rows={3}
                value={form.notes}
                readOnly={!editable}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Duration (minutes)
                <input
                  type="number"
                  min={5}
                  className={field}
                  value={form.duration_minutes ?? ""}
                  readOnly={!editable}
                  onChange={(e) =>
                    patch("duration_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </label>
            </div>
          </section>

          {/* Save at bottom — manual only (auto-save loop removed) */}
          <div className="sticky bottom-[5.5rem] z-20 rounded-[1.75rem] bg-white/95 p-4 shadow-[0_-8px_30px_rgba(38,50,56,0.08)] ring-1 ring-black/[0.05] backdrop-blur-md lg:static lg:bottom-auto lg:bg-white lg:p-5 lg:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--ink-soft)]">
                {saving ? (
                  <LoadingSpinnerLabel
                    label="Saving…"
                    size="sm"
                    className="justify-start"
                    labelClassName="font-semibold text-[var(--saffron-deep)]"
                  />
                ) : dirty ? (
                  <span className="font-semibold text-amber-800">Unsaved changes</span>
                ) : lastSaved ? (
                  <span className="font-semibold">Saved {lastSaved}</span>
                ) : (
                  <span>Fill the form, then save when ready.</span>
                )}
                {isCurrentVisit && !form.id ? (
                  <span className="mt-1 block text-xs">
                    Schedule a follow-up from the panel on the right after saving.
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={saving || !dirty || !editable}
                onClick={() => void onSave()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Saving…
                  </>
                ) : (
                  "Save assessment"
                )}
              </button>
            </div>
          </div>
        </div>

        <PatientVisitSidebar
          patientName={patientName}
          appointmentId={appointmentId}
          visitLabel={visitLabel}
          visitDate={appt.scheduled_date || appt.preferred_date}
          isCurrentVisit={isCurrentVisit}
          assessmentSaved={Boolean(form.id)}
          upcomingVisits={upcomingVisits}
          history={pastAssessments}
          onScheduleFollowUp={() => setFollowOpen(true)}
          followUpDisabled={saving}
        />
      </div>

      <FollowUpSchedulerModal
        open={followOpen}
        onOpenChange={setFollowOpen}
        patientName={patientName}
        clinicName={appt.clinics?.name}
        followDate={followDate}
        onFollowDateChange={setFollowDate}
        followTime={followTime}
        onFollowTimeChange={setFollowTime}
        slots={followSlots}
        slotsLoading={followSlotsLoading}
        saving={saving}
        onConfirm={() => void confirmFollowUp()}
        onSkip={() => setFollowOpen(false)}
      />
    </div>
  );
}
