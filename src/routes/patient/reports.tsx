import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { supabaseRest } from "@/lib/auth";
import { formatDateLabel } from "@/lib/clinic-data";

export const Route = createFileRoute("/patient/reports")({
  component: MedicalReportsPage,
});

type ReportRow = {
  id: string;
  diagnosis: string | null;
  treatment_given: string | null;
  home_exercise: string | null;
  notes: string | null;
  pain_score: number | null;
  created_at: string;
  appointments?: {
    appointment_code: string;
    preferred_date: string;
    scheduled_date: string | null;
    clinics?: { name: string } | null;
  } | null;
};

function MedicalReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void supabaseRest<ReportRow[]>(
      "assessments?deleted_at=is.null&select=id,diagnosis,treatment_given,home_exercise,notes,pain_score,created_at,appointments(appointment_code,preferred_date,scheduled_date,clinics(name))&order=created_at.desc",
    ).then((res) => {
      if (cancelled) return;
      setRows(res.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PortalPageHeader
        eyebrow="Records"
        title="Medical reports"
        description="Clinical assessments and home exercise plans from your CorpErgo visits."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="After your physiotherapist completes an assessment, the summary will appear here."
          action={
            <Link
              to="/patient/book"
              className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Book a visit
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--bronze)]">
                    {r.appointments?.appointment_code || "Assessment"}
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
                <p className="mt-3 text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Treatment: </span>
                  {r.treatment_given}
                </p>
              ) : null}
              {r.home_exercise ? (
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Home exercises: </span>
                  {r.home_exercise}
                </p>
              ) : null}
              {r.notes ? (
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{r.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
