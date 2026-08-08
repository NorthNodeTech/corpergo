import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import {
  isPatientReportReady,
  PatientReportReadonly,
  type PatientReportDetail,
} from "@/components/portal/PatientReportReadonly";
import { supabaseRest } from "@/lib/auth";

export const Route = createFileRoute("/patient/reports/$reportId")({
  component: PatientReportDetailPage,
});

const REPORT_SELECT =
  "id,appointment_id,pain_score,body_part,diagnosis,clinical_findings,range_of_motion,muscle_strength,special_tests,treatment_given,home_exercise,notes,duration_minutes,next_visit_needed,assessed_by,started_at,admin_edit_unlocked,created_at,updated_at,appointments!inner(appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,status,clinics(name,address,phone),physiotherapists(profiles(full_name)))";

function PatientReportDetailPage() {
  const { reportId } = Route.useParams();
  const [report, setReport] = useState<PatientReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await supabaseRest<PatientReportDetail[]>(
        `assessments?deleted_at=is.null&id=eq.${reportId}&select=${REPORT_SELECT}&limit=1`,
      );
      if (cancelled) return;
      const row = res.data?.[0] || null;
      if (!row || !isPatientReportReady(row)) {
        setMissing(true);
        setReport(null);
      } else {
        setReport(row);
        setMissing(false);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-black/[0.06]" />
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (missing || !report) {
    return (
      <EmptyState
        icon={FileText}
        title="Report not available"
        description="This session report is not ready yet or you do not have access to view it."
        action={
          <Link
            to="/patient/reports"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        to="/patient/reports"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All medical reports
      </Link>
      <PatientReportReadonly report={report} />
    </div>
  );
}
