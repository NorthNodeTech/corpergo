import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import {
  isPatientReportReady,
  type PatientReportDetail,
} from "@/components/portal/PatientReportReadonly";
import { ShowMoreButton, useShowMore } from "@/components/portal/ShowMoreList";
import { supabaseRest } from "@/lib/auth";
import { formatDateLabel, fetchMyPatient } from "@/lib/clinic-data";

export const Route = createFileRoute("/patient/reports")({
  component: MedicalReportsPage,
});

type ReportRow = PatientReportDetail;

function MedicalReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const readyReports = useMemo(() => rows.filter(isPatientReportReady), [rows]);
  const listMore = useShowMore(readyReports);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pat = await fetchMyPatient();
      const patientId = pat.data?.[0]?.id;
      if (!patientId) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const res = await supabaseRest<ReportRow[]>(
        `assessments?deleted_at=is.null&select=id,diagnosis,treatment_given,home_exercise,notes,clinical_findings,pain_score,created_at,appointments!inner(patient_id,appointment_code,preferred_date,scheduled_date,clinics(name))&appointments.patient_id=eq.${patientId}&order=created_at.desc`,
      );
      if (cancelled) return;
      setRows(res.data || []);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PortalPageHeader
        eyebrow="Records"
        title="Medical reports"
        description="Read-only clinical summaries from your completed CorpErgo sessions."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : readyReports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="After your physiotherapist completes and saves your session assessment, the read-only report will appear here."
          action={
            <Link
              to="/patient/book"
              className="rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Book a visit
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {listMore.visible.map((r) => (
              <article
                key={r.id}
                className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--bronze)]">
                        {r.appointments?.appointment_code || "Assessment"}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--saffron-deep)]">
                        <Lock className="h-3 w-3" />
                        Read-only
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">
                      {r.diagnosis || "Clinical assessment"}
                    </h3>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {r.appointments?.clinics?.name} ·{" "}
                      {formatDateLabel(
                        r.appointments?.scheduled_date ||
                          r.appointments?.preferred_date ||
                          r.created_at.slice(0, 10),
                      )}
                    </p>
                  </div>
                  {r.pain_score != null ? (
                    <div className="rounded-full bg-[var(--ivory)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                      Pain {r.pain_score}/10
                    </div>
                  ) : null}
                </div>

                {r.treatment_given ? (
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">
                    <span className="font-semibold text-[var(--ink)]">Treatment: </span>
                    {r.treatment_given}
                  </p>
                ) : null}

                <Link
                  to="/patient/reports/$reportId"
                  params={{ reportId: r.id }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--saffron-deep)] sm:w-auto"
                >
                  View full report
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          <ShowMoreButton
            hiddenCount={listMore.hiddenCount}
            expanded={listMore.expanded}
            onClick={listMore.toggle}
          />
        </>
      )}
    </div>
  );
}
