import { Link } from "@tanstack/react-router";
import { CalendarPlus, ClipboardList, History, Sparkles } from "lucide-react";
import { formatDateLabel } from "@/lib/patient/clinic-data";
import type { PatientVisitSummary } from "@/lib/physio/assessment-data";
import { cn } from "@/lib/core/utils";

type TimelineItem = {
  id: string;
  appointment_id: string;
  diagnosis: string | null;
  pain_score: number | null;
  treatment_given: string | null;
  created_at: string;
  appointments?: {
    visit_type?: "initial" | "follow_up";
    scheduled_date?: string | null;
    preferred_date?: string;
  } | null;
};

type PatientVisitSidebarProps = {
  patientName: string;
  appointmentId: string;
  visitLabel: string;
  visitDate: string;
  isCurrentVisit: boolean;
  assessmentSaved: boolean;
  upcomingVisits: PatientVisitSummary[];
  history: TimelineItem[];
  onScheduleFollowUp: () => void;
  followUpDisabled?: boolean;
};

function visitTypeLabel(type: "initial" | "follow_up" | undefined) {
  return type === "follow_up" ? "Follow-up" : "New session";
}

export function PatientVisitSidebar({
  patientName,
  appointmentId,
  visitLabel,
  visitDate,
  isCurrentVisit,
  assessmentSaved,
  upcomingVisits,
  history,
  onScheduleFollowUp,
  followUpDisabled,
}: PatientVisitSidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
          Patient profile
        </p>
        <h2 className="mt-1 font-extrabold text-[var(--ink)]">{patientName}</h2>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          All visits for this patient — current session, follow-ups, and history.
        </p>
      </section>

      <section
        className={cn(
          "rounded-3xl p-5 ring-1",
          isCurrentVisit
            ? "bg-[var(--saffron-light)] ring-[var(--saffron)]/30"
            : "bg-white ring-black/[0.05]",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
              isCurrentVisit ? "bg-white text-[var(--saffron-deep)]" : "bg-[var(--ivory)] text-[var(--ink-soft)]",
            )}
          >
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
              This session
            </p>
            <p className="font-extrabold text-[var(--ink)]">{visitLabel}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
              {formatDateLabel(visitDate)}
              {assessmentSaved ? " · Saved" : isCurrentVisit ? " · In progress" : " · Read-only"}
            </p>
          </div>
        </div>
      </section>

      {isCurrentVisit && assessmentSaved ? (
        <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--saffron-light)] text-[var(--saffron-deep)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[var(--ink)]">Assessment saved</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Book the patient&apos;s next visit on the same profile.
              </p>
              <button
                type="button"
                disabled={followUpDisabled}
                onClick={onScheduleFollowUp}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <CalendarPlus className="h-4 w-4" />
                Schedule follow-up
              </button>
            </div>
          </div>
        </section>
      ) : isCurrentVisit && !assessmentSaved ? (
        <section className="rounded-3xl bg-[var(--ivory)] p-5 ring-1 ring-black/[0.05]">
          <p className="text-sm font-semibold text-[var(--ink)]">Save assessment first</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            After you save, you can schedule a follow-up visit from here.
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-[var(--saffron-deep)]" />
          <h2 className="font-extrabold text-[var(--ink)]">Upcoming visits</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Follow-ups and new sessions already booked for this profile.
        </p>
        {!upcomingVisits.length ? (
          <p className="mt-4 rounded-2xl bg-[var(--ivory)] px-3 py-4 text-sm text-[var(--ink-soft)]">
            No upcoming visits yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcomingVisits.map((v) => (
              <li key={v.id}>
                <Link
                  to="/physio/assessments/$appointmentId"
                  params={{ appointmentId: v.id }}
                  className="block rounded-2xl bg-[var(--ivory)] p-3 text-sm ring-1 ring-black/5 transition-colors hover:ring-[var(--saffron)]/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">{visitTypeLabel(v.visit_type)}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-soft)] ring-1 ring-black/5">
                      Booked
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--ink-soft)]">
                    {v.appointment_code} · {formatDateLabel(v.scheduled_date || v.preferred_date)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--ink-soft)]" />
          <h2 className="font-extrabold text-[var(--ink)]">Previous history</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Past assessments on this profile — open to review, editing is locked.
        </p>
        {!history.length ? (
          <p className="mt-4 rounded-2xl bg-[var(--ivory)] px-3 py-4 text-sm text-[var(--ink-soft)]">
            No prior assessments.
          </p>
        ) : (
          <ul className="mt-4 max-h-[36vh] space-y-2 overflow-y-auto pr-1">
            {history.map((t) => {
              const apptMeta = t.appointments;
              const isFollowUp = apptMeta?.visit_type === "follow_up";
              return (
                <li key={t.id}>
                  <Link
                    to="/physio/assessments/$appointmentId"
                    params={{ appointmentId: t.appointment_id }}
                    className={cn(
                      "block rounded-2xl p-3 text-sm ring-1 transition-colors",
                      t.appointment_id === appointmentId
                        ? "bg-[var(--saffron-light)] ring-[var(--saffron)]/30"
                        : "bg-[var(--ivory)] ring-black/5 hover:ring-[var(--saffron)]/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ink)]">
                        {t.diagnosis || visitTypeLabel(apptMeta?.visit_type)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-soft)] ring-1 ring-black/5">
                        {isFollowUp ? "Follow-up" : "New session"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--ink-soft)]">
                      {formatDateLabel(
                        apptMeta?.scheduled_date ||
                          apptMeta?.preferred_date ||
                          t.created_at.slice(0, 10),
                      )}
                      {t.pain_score != null ? ` · Pain ${t.pain_score}/10` : ""}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
