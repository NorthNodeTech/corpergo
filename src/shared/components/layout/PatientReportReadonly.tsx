import { Lock } from "lucide-react";
import { unpackFindings, type AssessmentRow } from "@/lib/physio/assessment-data";
import { formatDateLabel } from "@/lib/patient/clinic-data";

export type PatientReportDetail = AssessmentRow & {
  appointments?: {
    appointment_code: string;
    preferred_date: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    preferred_time: string | null;
    status: string;
    clinics?: { name: string; address?: string | null; phone?: string | null } | null;
    physiotherapists?: { profiles?: { full_name: string | null } | null } | null;
  } | null;
};

function ReadonlyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-2xl bg-[var(--ivory)] px-4 py-3 ring-1 ring-black/[0.04]">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--bronze)]">
        {label}
      </div>
      <p className={`mt-1.5 text-sm text-[var(--ink)] ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function PatientReportReadonly({ report }: { report: PatientReportDetail }) {
  const appt = report.appointments;
  const visitDate =
    appt?.scheduled_date || appt?.preferred_date || report.created_at.slice(0, 10);
  const findings = unpackFindings(report.clinical_findings);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)] sm:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron-light)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--saffron-deep)] ring-1 ring-[var(--saffron)]/20">
            <Lock className="h-3 w-3" />
            Read-only report
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-[var(--ink)] sm:text-2xl">
            {report.diagnosis?.trim() || "Clinical assessment summary"}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {appt?.appointment_code || "Visit"} · {appt?.clinics?.name || "CorpErgo clinic"} ·{" "}
            {formatDateLabel(visitDate)}
          </p>
          {appt?.physiotherapists?.profiles?.full_name ? (
            <p className="mt-1 text-sm font-semibold text-[var(--ink-soft)]">
              Physiotherapist: {appt.physiotherapists.profiles.full_name}
            </p>
          ) : null}
        </div>
        {report.pain_score != null ? (
          <div className="rounded-2xl bg-[var(--ivory)] px-4 py-3 text-center ring-1 ring-black/[0.04]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Pain score
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[var(--ink)]">{report.pain_score}/10</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReadonlyField label="Body region" value={report.body_part} />
        <ReadonlyField
          label="Session duration"
          value={report.duration_minutes ? `${report.duration_minutes} minutes` : null}
        />
        <ReadonlyField label="Diagnosis" value={report.diagnosis} multiline />
        <ReadonlyField label="Chief complaint" value={findings.chief_complaint} multiline />
        <ReadonlyField label="Clinical findings" value={findings.clinical_findings} multiline />
        <ReadonlyField label="Range of motion" value={report.range_of_motion} multiline />
        <ReadonlyField label="Muscle strength" value={report.muscle_strength} multiline />
        <ReadonlyField label="Special tests" value={report.special_tests} multiline />
        <ReadonlyField label="Treatment given" value={report.treatment_given} multiline />
        <ReadonlyField label="Home exercise plan" value={report.home_exercise} multiline />
        <ReadonlyField label="Posture notes" value={findings.posture} multiline />
        <ReadonlyField label="Additional notes" value={report.notes} multiline />
      </div>

      {report.next_visit_needed ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
          Follow-up visit recommended by your physiotherapist.
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
        This report is a read-only summary of your completed session. Contact your clinic if you
        need corrections or have questions about your care plan.
      </p>
    </div>
  );
}

export function isPatientReportReady(report: Pick<PatientReportDetail, "diagnosis" | "treatment_given" | "home_exercise" | "notes" | "clinical_findings">) {
  return Boolean(
    report.diagnosis?.trim() ||
      report.treatment_given?.trim() ||
      report.home_exercise?.trim() ||
      report.notes?.trim() ||
      report.clinical_findings?.trim(),
  );
}
