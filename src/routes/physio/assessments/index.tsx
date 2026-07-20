import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileBarChart } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { fetchAssessableAppointments } from "@/lib/assessment-data";
import { formatDateLabel, formatTimeLabel } from "@/lib/clinic-data";
import { ageFromDob, type PhysioAppointment } from "@/lib/physio-data";

export const Route = createFileRoute("/physio/assessments/")({
  component: AssessmentsListPage,
});

function AssessmentsListPage() {
  const [items, setItems] = useState<PhysioAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAssessableAppointments().then((res) => {
      setItems(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PortalPageHeader
        eyebrow="Clinical"
        title="Assessments"
        description="Digital clinical notes that replace paper files. Open a visit to assess, auto-save, and schedule follow-up."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="No visits ready"
          description="Accepted or checked-in appointments will appear here for assessment."
          action={
            <Link
              to="/physio/queue"
              className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Open today’s queue
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((a) => (
            <Link
              key={a.id}
              to="/physio/assessments/$appointmentId"
              params={{ appointmentId: a.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] hover:ring-[var(--sage)]/40 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-[var(--ink)]">
                    {a.patients?.profiles?.full_name || a.appointment_code}
                    {ageFromDob(a.patients?.date_of_birth) != null
                      ? ` · ${ageFromDob(a.patients?.date_of_birth)} yrs`
                      : ""}
                  </div>
                  <div className="text-sm text-[var(--ink-soft)]">
                    {formatDateLabel(a.scheduled_date || a.preferred_date)} ·{" "}
                    {formatTimeLabel(a.scheduled_time || a.preferred_time)} ·{" "}
                    {a.physiotherapy_categories?.name}
                  </div>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
