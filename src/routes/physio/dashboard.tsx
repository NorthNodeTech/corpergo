import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatCard } from "@/components/portal/PortalShell";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { supabaseRest } from "@/lib/auth";
import { formatDateLabel, formatTimeLabel, type Appointment } from "@/lib/clinic-data";

export const Route = createFileRoute("/physio/dashboard")({
  component: PhysioDashboardPage,
});

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PhysioDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayIso();

  useEffect(() => {
    let cancelled = false;
    void supabaseRest<Appointment[]>(
      `appointments?deleted_at=is.null&select=id,appointment_code,preferred_date,preferred_time,scheduled_date,scheduled_time,symptoms,status,rejection_reason,clinic_id,category_id,physiotherapist_id,clinics(name,address,phone),physiotherapy_categories(name),patients(id,profiles(full_name))&order=preferred_date.asc,preferred_time.asc&limit=100`,
    ).then((res) => {
      if (cancelled) return;
      setAppointments(res.data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const todays = appointments.filter(
      (a) => (a.scheduled_date || a.preferred_date) === today,
    );
    return {
      today: todays.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) =>
        ["cancelled", "rejected"].includes(a.status),
      ).length,
      followUps: appointments.filter((a) => a.status === "accepted").length,
      schedule: todays
        .filter((a) => ["accepted", "checked_in", "pending"].includes(a.status))
        .slice(0, 8),
      recent: appointments
        .filter((a) => a.status === "completed")
        .slice(0, 5),
    };
  }, [appointments, today]);

  return (
    <div>
      <PortalPageHeader
        eyebrow="Clinic workspace"
        title="Physio dashboard"
        description="Today’s queue, pending requests, and follow-ups for your assigned clinic."
        actions={
          <Link
            to="/physio/scan"
            className="rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white"
          >
            Scan QR
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Today" value={loading ? "…" : String(stats.today)} icon={CalendarCheck2} />
        <StatCard label="Pending" value={loading ? "…" : String(stats.pending)} icon={Clock3} />
        <StatCard
          label="Completed"
          value={loading ? "…" : String(stats.completed)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Cancelled"
          value={loading ? "…" : String(stats.cancelled)}
          icon={XCircle}
        />
        <StatCard
          label="Follow-ups"
          value={loading ? "…" : String(stats.followUps)}
          hint="Accepted visits"
          icon={UserRound}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <h2 className="text-lg font-extrabold text-[var(--ink)]">Today’s schedule</h2>
          {stats.schedule.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">No appointments scheduled for today.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.schedule.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--ivory)] px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-[var(--ink)]">
                      {(a as Appointment & { patients?: { profiles?: { full_name?: string } } })
                        .patients?.profiles?.full_name || a.appointment_code}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {formatTimeLabel(a.scheduled_time || a.preferred_time)} ·{" "}
                      {a.physiotherapy_categories?.name}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <h2 className="text-lg font-extrabold text-[var(--ink)]">Recent patients</h2>
          {stats.recent.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Completed consultations will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recent.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--ivory)] px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-[var(--ink)]">{a.appointment_code}</div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {formatDateLabel(a.scheduled_date || a.preferred_date)}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
