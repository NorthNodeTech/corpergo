import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatCard } from "@/components/portal/PortalShell";
import { supabaseRest } from "@/lib/auth";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

type ClinicOverview = {
  clinic_id: string;
  clinic_name: string;
  todays_appointments: number;
  completed: number;
  pending: number;
  active_physiotherapists: number;
  total_patients_seen: number;
};

type Counts = {
  clinics: number;
  physios: number;
  patients: number;
  today: number;
  pending: number;
  completed: number;
  cancelled: number;
};

function AdminDashboardPage() {
  const [overview, setOverview] = useState<ClinicOverview[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [ov, clinics, physios, patients, appts] = await Promise.all([
        supabaseRest<ClinicOverview[]>(
          "v_admin_clinic_summary?select=clinic_id,clinic_name,todays_appointments,completed,pending,active_physiotherapists,total_patients_seen&order=clinic_name.asc",
        ),
        supabaseRest<{ id: string }[]>("clinics?deleted_at=is.null&select=id"),
        supabaseRest<{ id: string }[]>("physiotherapists?deleted_at=is.null&select=id"),
        supabaseRest<{ id: string }[]>("patients?deleted_at=is.null&select=id"),
        supabaseRest<{ status: string; preferred_date: string; scheduled_date: string | null }[]>(
          "appointments?deleted_at=is.null&select=status,preferred_date,scheduled_date",
        ),
      ]);
      if (cancelled) return;

      const list = appts.data || [];
      setOverview(ov.data || []);
      setCounts({
        clinics: clinics.data?.length || 0,
        physios: physios.data?.length || 0,
        patients: patients.data?.length || 0,
        today: list.filter((a) => (a.scheduled_date || a.preferred_date) === today).length,
        pending: list.filter((a) => a.status === "pending").length,
        completed: list.filter((a) => a.status === "completed").length,
        cancelled: list.filter((a) => ["cancelled", "rejected"].includes(a.status)).length,
      });
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
        eyebrow="Executive"
        title="Admin dashboard"
        description="Network-wide pulse across CorpErgo’s five Bengaluru clinics."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clinics"
          value={loading ? "…" : String(counts?.clinics ?? 0)}
          icon={Building2}
        />
        <StatCard
          label="Physiotherapists"
          value={loading ? "…" : String(counts?.physios ?? 0)}
          icon={Stethoscope}
        />
        <StatCard
          label="Today’s appointments"
          value={loading ? "…" : String(counts?.today ?? 0)}
          icon={CalendarCheck2}
        />
        <StatCard
          label="Active patients"
          value={loading ? "…" : String(counts?.patients ?? 0)}
          icon={Users}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={loading ? "…" : String(counts?.pending ?? 0)}
          icon={Clock3}
        />
        <StatCard
          label="Completed"
          value={loading ? "…" : String(counts?.completed ?? 0)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Cancelled"
          value={loading ? "…" : String(counts?.cancelled ?? 0)}
          icon={XCircle}
        />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">Clinic overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(overview.length
            ? overview
            : Array.from({ length: 5 }).map((_, i) => ({
                clinic_id: String(i),
                clinic_name: "Loading…",
                todays_appointments: 0,
                completed: 0,
                pending: 0,
                active_physiotherapists: 0,
                total_patients_seen: 0,
              }))
          ).map((c) => {
            const util =
              c.todays_appointments > 0
                ? Math.min(
                    100,
                    Math.round(
                      (c.completed / Math.max(c.todays_appointments + c.completed, 1)) * 100,
                    ),
                  )
                : c.completed > 0
                  ? 70
                  : 0;
            return (
              <div
                key={c.clinic_id}
                className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
              >
                <div className="text-xl font-extrabold text-[var(--ink)]">{c.clinic_name}</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-[var(--ink-soft)]">Today</div>
                    <div className="font-bold text-[var(--ink)]">{c.todays_appointments}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--ink-soft)]">Completed</div>
                    <div className="font-bold text-[var(--ink)]">{c.completed}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--ink-soft)]">Pending</div>
                    <div className="font-bold text-[var(--ink)]">{c.pending}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--ink-soft)]">Physios</div>
                    <div className="font-bold text-[var(--ink)]">{c.active_physiotherapists}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-soft)]">
                    <span>Utilization</span>
                    <span>{util}%</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[var(--ivory)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--sage)]"
                      style={{ width: `${util}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
