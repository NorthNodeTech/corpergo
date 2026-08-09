import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FileBarChart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ShowMoreButton, useShowMore } from "@/components/portal/ShowMoreList";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { LoadingState } from "@/components/ui/loading-spinner";
import {
  fetchAllAssessmentSessions,
  type AssessmentSessionRow,
} from "@/lib/assessment-data";
import { formatDateLabel, formatTimeLabel } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/physio/assessments/")({
  component: AssessmentsListPage,
});

type SessionFilter = "all" | "incomplete" | "completed";

const FILTERS: { id: SessionFilter; label: string }[] = [
  { id: "all", label: "All sessions" },
  { id: "incomplete", label: "Incomplete" },
  { id: "completed", label: "Completed" },
];

function sessionStatusForBadge(row: AssessmentSessionRow) {
  return row.documented ? "completed" : "checked_in";
}

function AssessmentsListPage() {
  const [items, setItems] = useState<AssessmentSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SessionFilter>("all");

  useEffect(() => {
    void fetchAllAssessmentSessions().then((res) => {
      setItems(res.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "incomplete") return items.filter((row) => !row.documented);
    if (filter === "completed") return items.filter((row) => row.documented);
    return items;
  }, [filter, items]);

  const listMore = useShowMore(filtered);

  useEffect(() => {
    listMore.collapse();
  }, [filter, listMore.collapse]);

  const counts = useMemo(
    () => ({
      all: items.length,
      incomplete: items.filter((row) => !row.documented).length,
      completed: items.filter((row) => row.documented).length,
    }),
    [items],
  );

  return (
    <div>
      <PortalPageHeader
        eyebrow="Clinical"
        title="Assessments"
        description="Open any session to write or review clinical notes — incomplete and completed visits together."
      />

      <div className="mb-6 portal-filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              filter === item.id
                ? "bg-black text-white"
                : "bg-white text-[var(--ink-soft)] ring-1 ring-black/5 hover:bg-[var(--ivory)]",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                filter === item.id ? "bg-white/20 text-white" : "bg-black/5 text-[var(--ink-soft)]",
              )}
            >
              {counts[item.id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading assessments…" minHeight="min-h-[12rem]" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title={
            filter === "completed"
              ? "No completed assessments yet"
              : filter === "incomplete"
                ? "No incomplete sessions"
                : "No assessment sessions"
          }
          description="Checked-in and completed visits for your clinic appear here."
          action={
            <Link
              to="/physio/queue"
              className="rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Open today's queue
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {listMore.visible.map((a) => (
              <Link
                key={a.id}
                to="/physio/assessments/$appointmentId"
                params={{ appointmentId: a.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] transition-all hover:ring-[var(--saffron)]/40"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-2xl",
                      a.documented
                        ? "bg-black text-white"
                        : "bg-[var(--saffron-light)] text-[var(--saffron-deep)]",
                    )}
                  >
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-[var(--ink)]">
                      {a.patients?.profiles?.full_name || a.appointment_code}
                      {a.visit_type === "follow_up" ? (
                        <span className="ml-2 rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--saffron-deep)]">
                          Follow-up
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-[var(--ink-soft)]">
                      {formatDateLabel(a.scheduled_date || a.preferred_date)} -{" "}
                      {formatTimeLabel(a.scheduled_time || a.preferred_time)} -{" "}
                      {a.physiotherapy_categories?.name} · {a.appointment_code}
                    </div>
                  </div>
                </div>
                <StatusBadge status={sessionStatusForBadge(a)} />
              </Link>
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
