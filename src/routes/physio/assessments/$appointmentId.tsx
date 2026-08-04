import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { Calendar } from "@/components/ui/calendar";
import { fetchMyProfile, supabaseRest } from "@/lib/auth";
import {
  assessmentFromRow,
  emptyAssessment,
  fetchAssessmentForAppointment,
  fetchPatientAssessments,
  saveAssessment,
  scheduleFollowUp,
  type AssessmentForm,
} from "@/lib/assessment-data";
import { formatDateLabel, formatTimeLabel, uniqueSlotTimes } from "@/lib/clinic-data";
import {
  ageFromDob,
  fetchAvailableSlots,
  fetchMyPhysioId,
  type PhysioAppointment,
} from "@/lib/physio-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/physio/assessments/$appointmentId")({
  component: AssessmentEditorPage,
});

const field =
  "mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]";

function AssessmentEditorPage() {
  const { appointmentId } = Route.useParams();
  const [appt, setAppt] = useState<PhysioAppointment | null>(null);
  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [timeline, setTimeline] = useState<
    NonNullable<Awaited<ReturnType<typeof fetchPatientAssessments>>["data"]>
  >([]);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [followDate, setFollowDate] = useState<Date | undefined>();
  const [followTime, setFollowTime] = useState<string | null>(null);
  const [followSlots, setFollowSlots] = useState<
    { start_time: string; available: boolean }[]
  >([]);
  const formRef = useRef(form);
  const savingRef = useRef(false);
  formRef.current = form;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [apptRes, assessRes, me] = await Promise.all([
        supabaseRest<PhysioAppointment[]>(
          `appointments?id=eq.${appointmentId}&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,patient_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,date_of_birth,medical_history,profiles(full_name,phone))&limit=1`,
        ),
        fetchAssessmentForAppointment(appointmentId),
        fetchMyPhysioId(),
      ]);
      if (cancelled) return;
      let a = apptRes.data?.[0] || null;
      if (!a && typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("corpergo.demo.appointments");
          if (raw) {
            const list = JSON.parse(raw);
            a = list.find((item: any) => item.id === appointmentId || item.appointment_code === appointmentId) || null;
          }
        } catch {}
      }
      setAppt(a);
      const pid = me.data?.[0]?.id || null;
      setPhysioId(pid);
      const existing = assessRes.data?.[0];
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
        const tl = await fetchPatientAssessments(a.patient_id);
        if (!cancelled) setTimeline(tl.data || []);
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
      return;
    }
    void fetchAvailableSlots(appt.clinic_id, followIso).then((res) => {
      setFollowSlots(uniqueSlotTimes(res.data || []));
    });
  }, [appt, followIso]);

  async function persist(silent = false) {
    const current = formRef.current;
    if (!current || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const { data, error } = await saveAssessment(current);
    savingRef.current = false;
    setSaving(false);
    if (error) {
      if (!silent) toast.error(error);
      return;
    }
    const saved = data?.[0];
    if (saved) {
      // Only patch id if it changed — never replace the whole form (that caused an auto-save loop)
      setForm((prev) => {
        if (!prev) return prev;
        if (prev.id === saved.id) return prev;
        return { ...prev, id: saved.id };
      });
      setDirty(false);
      setLastSaved(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      );
      if (!silent) toast.success("Assessment saved");
    }
  }

  async function onSaveAndFollow() {
    await persist(false);
    if (formRef.current?.next_visit_needed) setFollowOpen(true);
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
    }
  }

  function patch<K extends keyof AssessmentForm>(key: K, value: AssessmentForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  }

  if (!appt || !form) {
    return <div className="text-[var(--ink-soft)]">Loading assessment…</div>;
  }

  const patientName = appt.patients?.profiles?.full_name || "Patient";
  const age = ageFromDob(appt.patients?.date_of_birth);

  return (
    <div>
      <PortalPageHeader
        eyebrow={appt.appointment_code}
        title={`Assess ${patientName}`}
        description={`${appt.clinics?.name} · ${appt.physiotherapy_categories?.name} · ${formatDateLabel(appt.scheduled_date || appt.preferred_date)}`}
        actions={
          <Link
            to="/physio/assessments"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

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
                onChange={(e) => patch("medical_history", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Chief complaint
              <textarea
                className={field}
                rows={2}
                value={form.chief_complaint}
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
                    onClick={() => patch("pain_score", n)}
                    className={cn(
                      "h-10 w-10 rounded-xl text-sm font-bold ring-1",
                      form.pain_score === n
                        ? "bg-[var(--sage)] text-white ring-[var(--sage)]"
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
                onChange={(e) => patch("posture", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              ROM
              <textarea
                className={field}
                rows={2}
                value={form.range_of_motion}
                onChange={(e) => patch("range_of_motion", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Muscle strength
              <textarea
                className={field}
                rows={2}
                value={form.muscle_strength}
                onChange={(e) => patch("muscle_strength", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Special tests
              <textarea
                className={field}
                rows={2}
                value={form.special_tests}
                onChange={(e) => patch("special_tests", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Clinical findings
              <textarea
                className={field}
                rows={2}
                value={form.clinical_findings}
                onChange={(e) => patch("clinical_findings", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Diagnosis
              <input
                className={field}
                value={form.diagnosis}
                onChange={(e) => patch("diagnosis", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Treatment given
              <textarea
                className={field}
                rows={2}
                value={form.treatment_given}
                onChange={(e) => patch("treatment_given", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Exercises / home program
              <textarea
                className={field}
                rows={2}
                value={form.home_exercise}
                onChange={(e) => patch("home_exercise", e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Clinical notes
              <textarea
                className={field}
                rows={3}
                value={form.notes}
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
                  onChange={(e) =>
                    patch("duration_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </label>
              <label className="flex items-center gap-3 pt-6 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.next_visit_needed}
                  onChange={(e) => patch("next_visit_needed", e.target.checked)}
                  className="h-5 w-5 rounded border-[var(--sage)]"
                />
                Schedule follow-up after save
              </label>
            </div>
          </section>

          {/* Save at bottom — manual only (auto-save loop removed) */}
          <div className="sticky bottom-[5.5rem] z-20 rounded-[1.75rem] bg-white/95 p-4 shadow-[0_-8px_30px_rgba(38,50,56,0.08)] ring-1 ring-black/[0.05] backdrop-blur-md lg:static lg:bottom-auto lg:bg-white lg:p-5 lg:shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--ink-soft)]">
                {saving ? (
                  <span className="font-semibold text-[var(--sage-deep)]">Saving…</span>
                ) : dirty ? (
                  <span className="font-semibold text-amber-800">Unsaved changes</span>
                ) : lastSaved ? (
                  <span className="font-semibold">Saved {lastSaved}</span>
                ) : (
                  <span>Fill the form, then save when ready.</span>
                )}
              </div>
              <button
                type="button"
                disabled={saving || !dirty}
                onClick={() => void onSaveAndFollow()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sage)] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save assessment"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
            <h2 className="font-extrabold text-[var(--ink)]">Patient timeline</h2>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Previous assessments for comparison.
            </p>
            {!timeline.length ? (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">No prior assessments.</p>
            ) : (
              <ul className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {timeline.map((t) => (
                  <li key={t.id} className="rounded-2xl bg-[var(--ivory)] p-3 text-sm">
                    <div className="font-bold text-[var(--ink)]">
                      {t.diagnosis || "Assessment"}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {formatDateLabel(
                        t.appointments?.scheduled_date ||
                          t.appointments?.preferred_date ||
                          t.created_at.slice(0, 10),
                      )}
                      {t.pain_score != null ? ` · Pain ${t.pain_score}/10` : ""}
                    </div>
                    {t.treatment_given ? (
                      <p className="mt-1 line-clamp-3 text-xs text-[var(--ink-soft)]">
                        {t.treatment_given}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {followOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">Schedule follow-up</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Only available slots are shown. Patient will be notified.
            </p>
            <div className="mt-4 flex justify-center rounded-3xl bg-[var(--ivory)] p-3">
              <Calendar
                mode="single"
                selected={followDate}
                onSelect={(d) => {
                  setFollowDate(d);
                  setFollowTime(null);
                }}
                disabled={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today || d.getDay() === 0;
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {followSlots.map((s) => (
                <button
                  key={s.start_time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setFollowTime(s.start_time)}
                  className={cn(
                    "rounded-2xl px-2 py-2.5 text-xs font-bold ring-1",
                    followTime === s.start_time
                      ? "bg-[var(--sage)] text-white ring-[var(--sage)]"
                      : "bg-[var(--ivory)] ring-black/5",
                  )}
                >
                  {formatTimeLabel(s.start_time)}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFollowOpen(false)}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={saving || !followTime}
                onClick={() => void confirmFollowUp()}
                className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Confirm follow-up
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
