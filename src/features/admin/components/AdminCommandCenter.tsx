import { useEffect, useMemo, useState, Fragment } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";
import { GoogleMapsIcon } from "@/shared/components/icons/BrandIcons";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clinicStatus,
  fetchAdminDashboard,
  utilizationPct,
  type AdminDashboardBundle,
  type ActivityItem,
  type ClinicStatus,
  type RecentBooking,
} from "@/lib/admin/admin-dashboard-data";
import {
  assessmentEditState,
  fetchAdminAssessments,
  setAssessmentAdminEditUnlocked,
  type AdminAssessmentRow,
} from "@/lib/physio/assessment-data";
import { AdminCardCarousel } from "@/features/admin/components/AdminCardCarousel";
import { AdminClinicComparison } from "@/features/admin/components/AdminClinicComparison";
import { AdminPaymentsOverview } from "@/features/admin/components/AdminPaymentsOverview";
import { cn, formatClinicName } from "@/lib/core/utils";
import { toast } from "sonner";
import { ShowMoreButton, useShowMore } from "@/shared/components/layout/ShowMoreList";
import { Skeleton } from "@/shared/components/ui/skeleton";

const STATUS_COLOR: Record<ClinicStatus, string> = {
  normal: "#f28c28",
  busy: "#8a3324",
  attention: "#dc2626",
};

const CHART_SAFFRON = "#f28c28";
const CHART_SAFFRON_DEEP = "#8a3324";

/** Strip Dr. prefix from staff/clinic labels shown in admin lists. */
function displayStaffLabel(name: string) {
  const cleaned = name.replace(/^dr\.?\s+/i, "").replace(/^physio\s*/i, "").trim();
  return formatClinicName(cleaned) || cleaned || name;
}

function greetingForHour(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatActivityTime(iso: string, groupLabel: string) {
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (groupLabel === "Today") return time;
    return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
  } catch {
    return "—";
  }
}

function groupActivityByTime(items: ActivityItem[], now: Date) {
  const groups: { label: string; items: ActivityItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "This Month", items: [] },
    { label: "Older", items: [] },
  ];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 1 * 24 * 60 * 60 * 1000;
  const thisWeekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thisMonthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  for (const item of items) {
    const t = new Date(item.at).getTime();
    if (t >= todayStart) {
      groups[0].items.push(item);
    } else if (t >= yesterdayStart) {
      groups[1].items.push(item);
    } else if (t >= thisWeekStart) {
      groups[2].items.push(item);
    } else if (t >= thisMonthStart) {
      groups[3].items.push(item);
    } else {
      groups[4].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function groupBookingsByTime(items: RecentBooking[], now: Date) {
  const groups: { label: string; items: RecentBooking[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "This Month", items: [] },
    { label: "Older", items: [] },
  ];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 1 * 24 * 60 * 60 * 1000;
  const thisWeekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thisMonthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (t >= todayStart) {
      groups[0].items.push(item);
    } else if (t >= yesterdayStart) {
      groups[1].items.push(item);
    } else if (t >= thisWeekStart) {
      groups[2].items.push(item);
    } else if (t >= thisMonthStart) {
      groups[3].items.push(item);
    } else {
      groups[4].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function groupUpcomingByTime(items: RecentBooking[], now: Date) {
  const groups: { label: string; items: RecentBooking[] }[] = [
    { label: "Today", items: [] },
    { label: "Tomorrow", items: [] },
    { label: "This Week", items: [] },
    { label: "Next Week", items: [] },
    { label: "Later", items: [] },
  ];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tomorrowStart = todayStart + 1 * 24 * 60 * 60 * 1000;
  const inOneWeek = todayStart + 7 * 24 * 60 * 60 * 1000;
  const inTwoWeeks = todayStart + 14 * 24 * 60 * 60 * 1000;

  for (const item of items) {
    const rawDate = item.scheduled_date || item.preferred_date;
    const t = rawDate ? new Date(rawDate).getTime() : 0;
    if (t === 0) continue;

    if (t < tomorrowStart) {
      groups[0].items.push(item);
    } else if (t < todayStart + 2 * 24 * 60 * 60 * 1000) {
      groups[1].items.push(item);
    } else if (t < inOneWeek) {
      groups[2].items.push(item);
    } else if (t < inTwoWeeks) {
      groups[3].items.push(item);
    } else {
      groups[4].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatApptWhen(b: AdminDashboardBundle["bookings"][number]) {
  const date = b.scheduled_date || b.preferred_date;
  const time = (b.scheduled_time || b.preferred_time || "").slice(0, 5);
  return `${date}${time ? ` · ${time}` : ""}`;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-[var(--saffron-light)] text-[var(--saffron-deep)]";
    case "pending":
      return "bg-[var(--saffron-light)] text-[var(--saffron-deep)]";
    case "checked_in":
    case "accepted":
      return "bg-[var(--saffron-light)] text-[var(--saffron-deep)]";
    case "cancelled":
    case "rejected":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function adminVisitStatusLabel(status: string) {
  if (status === "accepted" || status === "checked_in") return "progress";
  return status.replace(/_/g, " ");
}

function AnimatedNumber({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

function bookingClinicId(b: RecentBooking) {
  return b.clinic_id || b.clinics?.id || "";
}

function assessmentClinicId(row: AdminAssessmentRow) {
  return row.appointments?.clinic_id || row.appointments?.clinics?.id || "";
}

export function AdminCommandCenter() {
  const [data, setData] = useState<AdminDashboardBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [clinicTab, setClinicTab] = useState<"requests" | "upcoming" | "assessments">("requests");
  const [assessments, setAssessments] = useState<AdminAssessmentRow[]>([]);
  const [assessBusy, setAssessBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminAssessments().then((res) => {
      if (cancelled) return;
      setAssessments(res.data || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminDashboard().then((bundle) => {
      if (cancelled) return;
      setData(bundle);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const open = () => setNotifyOpen(true);
    window.addEventListener("corpergo:admin-alerts", open);
    return () => window.removeEventListener("corpergo:admin-alerts", open);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || loading) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [loading, data]);

  useEffect(() => {
    if (!data?.clinics?.length || selectedClinicId) return;
    setSelectedClinicId(data.clinics[0]!.clinic_id);
  }, [data?.clinics, selectedClinicId]);

  const kpis = data?.kpis;
  const waiting = (kpis?.checked_in || 0) + (kpis?.accepted || 0);
  const upcoming = Math.max((kpis?.todays_bookings || 0) - (kpis?.completed || 0) - waiting, 0);

  const kpiCards = [
    { label: "Appointments", value: kpis?.todays_bookings ?? 0, icon: Activity },
    { label: "Completed", value: kpis?.completed ?? 0, icon: CheckCircle2 },
    { label: "Waiting", value: waiting, icon: Clock3 },
    { label: "Upcoming", value: upcoming, icon: TrendingUp },
  ] as const;

  const clinicList = loading
    ? Array.from({ length: 5 }).map((_, i) => ({
        clinic_id: `sk-${i}`,
        clinic_name: "…",
        slug: null,
        is_active: true,
        todays_appointments: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        active_physiotherapists: 0,
        total_patients_seen: 0,
      }))
    : data?.clinics || [];

  function renderKpiCard({ label, value, icon: Icon }: (typeof kpiCards)[number]) {
    return (
      <div
        key={label}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
            {label}
          </span>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--saffron)]/10 text-[var(--saffron-deep)] transition-colors group-hover:bg-[var(--saffron)] group-hover:text-white">
            <Icon className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">
          {loading ? <Skeleton className="h-8 w-14 rounded-lg" /> : <AnimatedNumber value={value} />}
        </div>
      </div>
    );
  }

  function renderClinicCard(c: (typeof clinicList)[number]) {
    const status = clinicStatus(c);
    const util = utilizationPct(c);
    const name = formatClinicName(c.clinic_name);
    const isSelected = selectedClinicId === c.clinic_id;

    return (
      <button
        key={c.clinic_id}
        type="button"
        onClick={() => selectClinic(c.clinic_id)}
        className={cn(
          "group relative flex h-full min-w-0 w-full flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
          isSelected
            ? "border-2 border-[var(--saffron)] shadow-md shadow-[var(--saffron)]/10 ring-2 ring-[var(--saffron)]/20"
            : "border border-[var(--border)] shadow-sm hover:border-[var(--saffron)]/60 hover:shadow-md",
        )}
      >
        <div className="w-full min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                <span className="grid h-4 w-4 place-items-center rounded-md bg-[var(--saffron)]/10 text-[var(--saffron-deep)]">
                  <GoogleMapsIcon className="h-2.5 w-2.5" />
                </span>
                Clinic
              </div>
              <div className="mt-1 truncate text-sm sm:text-base font-black text-[var(--ink)]" title={name}>
                {name}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                status === "normal"
                  ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)] border border-[var(--saffron)]/25"
                  : status === "busy"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200",
              )}
            >
              {status === "normal" ? "Normal" : status === "busy" ? "Busy" : "Alert"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1 text-center">
            {[
              { label: "Today", value: c.todays_appointments, bg: "bg-blue-50/70 text-blue-900", border: "border-blue-100" },
              { label: "Pend", value: c.pending, bg: "bg-amber-50/70 text-amber-900", border: "border-amber-100" },
              { label: "Done", value: c.completed, bg: "bg-[var(--saffron-light)] text-[var(--saffron-deep)]", border: "border-[var(--saffron)]/20" },
              { label: "Team", value: c.active_physiotherapists, bg: "bg-neutral-100 text-neutral-800", border: "border-neutral-200" },
            ].map((m) => (
              <div
                key={m.label}
                className={cn("min-w-0 rounded-lg p-1 sm:p-1.5 border", m.bg, m.border)}
              >
                <div className="text-xs sm:text-sm font-black leading-none">{m.value}</div>
                <div className="mt-0.5 truncate text-[8px] sm:text-[9px] font-bold uppercase tracking-tight opacity-75">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 w-full min-w-0 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
            <span className="text-[var(--ink-soft)]">Capacity</span>
            <span className="font-extrabold text-[var(--ink)]">{util}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full transition-all"
              style={{
                background:
                  status === "normal"
                    ? "linear-gradient(90deg, #10b981, #059669)"
                    : status === "busy"
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #ef4444, #dc2626)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${util}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </button>
    );
  }

  const selectedClinic = useMemo(
    () => (data?.clinics || []).find((c) => c.clinic_id === selectedClinicId) ?? null,
    [data?.clinics, selectedClinicId],
  );

  const clinicBookings = useMemo(
    () =>
      selectedClinicId
        ? (data?.bookings || []).filter((b) => bookingClinicId(b) === selectedClinicId)
        : [],
    [data?.bookings, selectedClinicId],
  );

  const clinicUpcoming = useMemo(
    () =>
      selectedClinicId
        ? (data?.upcoming_bookings || []).filter((b) => bookingClinicId(b) === selectedClinicId)
        : [],
    [data?.upcoming_bookings, selectedClinicId],
  );

  const clinicAssessments = useMemo(
    () =>
      selectedClinicId
        ? assessments.filter((row) => assessmentClinicId(row) === selectedClinicId)
        : [],
    [assessments, selectedClinicId],
  );

  const insights = data?.insights || [];
  const activity = data?.activity || [];
  const clinicPerformance = useMemo(() => {
    const list = [...(data?.clinics || [])];
    list.sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      return utilizationPct(b) - utilizationPct(a);
    });
    return list;
  }, [data?.clinics]);
  const insightsMore = useShowMore(insights);
  const activityMore = useShowMore(activity);
  const clinicPerformanceMore = useShowMore(clinicPerformance);
  const clinicBookingsMore = useShowMore(clinicBookings);
  const clinicUpcomingMore = useShowMore(clinicUpcoming);
  const clinicAssessmentsMore = useShowMore(clinicAssessments);

  useEffect(() => {
    clinicBookingsMore.collapse();
    clinicUpcomingMore.collapse();
    clinicAssessmentsMore.collapse();
  }, [
    selectedClinicId,
    clinicTab,
    clinicBookingsMore.collapse,
    clinicUpcomingMore.collapse,
    clinicAssessmentsMore.collapse,
  ]);

  function selectClinic(clinicId: string) {
    setSelectedClinicId(clinicId);
    setClinicTab("requests");
  }

  return (
    <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-hidden pb-4 sm:gap-8 sm:pb-10">
      {/* Executive header */}
      <motion.section
        id="admin-overview"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-0 scroll-mt-24 overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-white via-white to-[var(--ivory)] p-5 shadow-[var(--shadow-soft)] sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
              {greetingForHour(now.getHours())},
            </div>
            <h1 className="type-h1 mt-1 font-black tracking-tight text-[var(--ink)]">
              CorpErgo Admin
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--ink-soft)] sm:text-sm">
              <span>
                {now.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-black/20">·</span>
              <span>
                {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNotifyOpen((v) => !v)}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-white text-[var(--ink)] shadow-sm hover:bg-[var(--ivory)]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {(kpis?.pending || 0) > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              ) : null}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--saffron-light)] px-3 py-2 text-xs font-bold text-[var(--saffron-deep)] border border-[var(--saffron)]/25">
              <span className="h-2 w-2 rounded-full bg-[var(--saffron)] animate-pulse" /> Online
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
            Today&apos;s operations
          </div>
          <div className="mt-3 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4">
            {kpiCards.map((card) => renderKpiCard(card))}
          </div>
        </div>
      </motion.section>

      {/* Notifications drawer */}
      {notifyOpen ? (
        <div className="mt-4 rounded-[24px] border border-black/[0.05] bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[var(--ink)]">Notification center</h3>
            <button
              type="button"
              className="text-xs font-bold text-[var(--ink-soft)]"
              onClick={() => setNotifyOpen(false)}
            >
              Close
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {insightsMore.visible.map((ins) => (
              <li
                key={ins.id}
                className={cn(
                  "rounded-2xl px-3.5 py-3 text-sm",
                  ins.tone === "warn"
                    ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)]"
                    : ins.tone === "good"
                      ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)]"
                      : "bg-white text-[var(--ink)] ring-1 ring-black/[0.05]",
                )}
              >
                <div className="font-bold">{ins.title}</div>
                <div className="mt-0.5 text-xs opacity-80">{ins.detail}</div>
              </li>
            ))}
            {!insights.length ? (
              <li className="rounded-2xl bg-[var(--ivory)] px-3.5 py-3 text-sm text-[var(--ink-soft)]">
                No alerts right now — network is calm.
              </li>
            ) : null}
          </ul>
          <ShowMoreButton
            hiddenCount={insightsMore.hiddenCount}
            expanded={insightsMore.expanded}
            onClick={insightsMore.toggle}
          />
        </div>
      ) : null}

      {/* Network clinics — five compact cards in one row */}
      <section id="admin-network" className="scroll-mt-24">
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
            Network overview
          </div>
          <h2 className="mt-1 text-2xl font-black text-[var(--ink)]">Five clinics. One pulse.</h2>
        </div>
        <AdminCardCarousel
          itemCount={Math.max(clinicList.length, 1)}
          ariaLabel="clinic"
          renderItem={(i) => renderClinicCard(clinicList[i]!)}
          desktop={
            <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid min-w-[700px] grid-cols-5 items-stretch gap-3">
                {clinicList.map((c) => renderClinicCard(c))}
              </div>
            </div>
          }
        />
      </section>

      {/* Live activity */}
      <section className="w-full min-w-0">
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
                Live activity
              </div>
              <h3 className="mt-1 text-xl font-black text-[var(--ink)]">What happened today</h3>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--saffron)]/10 text-[var(--saffron-deep)]">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <ul className="mt-5 space-y-4 pr-1">
            {loading ? (
              <>
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
              </>
            ) : activity.length ? (
              groupActivityByTime(activityMore.visible, now).map((group, gi) => (
                <div key={group.label} className="mb-5 last:mb-0">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ivory)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--ink-soft)] border border-black/[0.04]">
                    {group.label}
                  </div>
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-3.5 ml-2">
                    {group.items.map((a, i) => (
                      <motion.li
                        key={a.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (gi * 2 + i) * 0.04 }}
                        className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-2xl bg-[var(--ivory)]/70 p-3.5 border border-black/[0.04] transition-all hover:bg-white hover:shadow-sm"
                      >
                        <span
                          className="absolute -left-[31px] top-4 h-3 w-3 rounded-full ring-4 ring-white"
                          style={{
                            background:
                              a.tone === "attention"
                                ? STATUS_COLOR.attention
                                : a.tone === "busy"
                                  ? STATUS_COLOR.busy
                                  : a.tone === "normal"
                                    ? STATUS_COLOR.normal
                                    : "#94a3b8",
                          }}
                        />
                        <div className="shrink-0 text-xs font-bold text-[var(--ink-soft)] sm:w-20">
                          {formatActivityTime(a.at, group.label)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-[var(--ink)]">{a.label}</div>
                          <div className="mt-0.5 text-xs font-medium text-[var(--ink-soft)]">{a.meta}</div>
                        </div>
                      </motion.li>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <li className="rounded-2xl bg-[var(--ivory)] px-3 py-6 text-center text-sm text-[var(--ink-soft)]">
                No recent activity yet.
              </li>
            )}
          </ul>
          {!loading && activity.length ? (
            <ShowMoreButton
              hiddenCount={activityMore.hiddenCount}
              expanded={activityMore.expanded}
              onClick={activityMore.toggle}
            />
          ) : null}
        </div>
      </section>

      {/* Analytics — stacked vertically */}
      <section id="admin-analytics" className="flex w-full min-w-0 scroll-mt-24 flex-col gap-4 sm:gap-5">
        <div className="rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--burnt-amber)]">
                Appointments
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Last 7 days — all clinics</h3>
            </div>
            <Users className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" />
          </div>
          <div className="mt-4 h-52 w-full min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart
                data={data?.series7d || []}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_SAFFRON} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_SAFFRON} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#5E6A6A", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fill: "#5E6A6A", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 24px rgba(38,50,56,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_SAFFRON_DEEP}
                  strokeWidth={2.5}
                  fill="url(#apptFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: "Network clinics", value: data?.totals.clinics ?? 0, hint: "Active locations" },
            { label: "Physiotherapists", value: data?.totals.physios ?? 0, hint: "Across Bengaluru" },
            { label: "Active patients", value: data?.totals.patients ?? 0, hint: "Registered" },
            {
              label: "Cancelled / rejected",
              value: (kpis?.cancelled || 0) + (kpis?.rejected || 0),
              hint: "Needs follow-up",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex h-full min-h-[108px] flex-col rounded-[24px] bg-gradient-to-br from-white to-[var(--ivory)] p-4 ring-1 ring-black/[0.05] sm:p-5"
            >
              <div className="text-xs font-semibold text-[var(--ink-soft)]">{m.label}</div>
              <div className="type-h2 mt-auto pt-2 font-extrabold text-[var(--ink)]">
                {loading ? <Skeleton className="h-9 w-12 rounded-lg" /> : <AnimatedNumber value={m.value} />}
              </div>
              <div className="mt-1 text-[11px] font-medium text-[var(--ink-soft)]">{m.hint}</div>
            </div>
          ))}
        </div>

        <AdminClinicComparison clinics={data?.clinics || []} loading={loading} />
      </section>

      <AdminPaymentsOverview />

      {/* Clinic performance */}
      <section className="min-w-0">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--burnt-amber)]">
              Clinics
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Clinic performance</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          <div className="divide-y divide-black/[0.05]">
            {clinicPerformanceMore.visible.map((c, i) => {
              const name = formatClinicName(c.clinic_name);
              const rate = utilizationPct(c);
              return (
                <div key={c.clinic_id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <div className="w-6 text-center text-xs font-extrabold text-[var(--ink-soft)]">
                    {i + 1}
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--saffron)] text-xs font-bold text-white">
                    {initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-extrabold text-[var(--ink)]">{name}</div>
                      {i === 0 && clinicPerformance.length > 0 ? (
                        <span className="rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--saffron-deep)]">
                          Top clinic
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-[var(--ink-soft)]">
                      {c.active_physiotherapists} physio
                      {c.active_physiotherapists === 1 ? "" : "s"} · {c.todays_appointments} today
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-extrabold text-[var(--ink)]">{c.completed}</div>
                    <div className="text-[10px] font-semibold text-[var(--ink-soft)]">Completed</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[var(--saffron-deep)]">{rate}%</div>
                    <div className="text-[10px] font-semibold text-[var(--ink-soft)]">Rate</div>
                  </div>
                </div>
              );
            })}
            {!loading && !clinicPerformance.length ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--ink-soft)]">
                No clinic performance data yet.
              </div>
            ) : null}
          </div>
          {!loading && clinicPerformance.length ? (
            <ShowMoreButton
              hiddenCount={clinicPerformanceMore.hiddenCount}
              expanded={clinicPerformanceMore.expanded}
              onClick={clinicPerformanceMore.toggle}
              className="mx-4 mb-4 sm:mx-5"
            />
          ) : null}
        </div>
      </section>

      {/* Clinic detail — patients, schedule, assessment locks */}
      <section id="admin-clinic-detail" className="scroll-mt-24">
        {!selectedClinic ? (
          <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
            <GoogleMapsIcon className="mx-auto h-8 w-8" />
            <p className="mt-3 text-sm font-semibold text-[var(--ink)]">Select a clinic above</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              View patients, upcoming schedule, and assessment edit access for that location.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
            <div className="border-b border-black/[0.05] p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--burnt-amber)]">
                    Clinic workspace
                  </div>
                  <h2 className="type-h3 mt-1 font-extrabold text-[var(--ink)]">
                    {formatClinicName(selectedClinic.clinic_name)}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Patients and assessment controls for this location only
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(data?.clinics || []).map((c) => (
                    <button
                      key={c.clinic_id}
                      type="button"
                      onClick={() => selectClinic(c.clinic_id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition",
                        selectedClinicId === c.clinic_id
                          ? "bg-[var(--saffron)] text-white ring-[var(--saffron)]"
                          : "bg-white text-[var(--ink-soft)] ring-black/[0.08] hover:text-[var(--ink)]",
                      )}
                    >
                      {formatClinicName(c.clinic_name.replace(/ CorpErgo.*/i, "").trim() || c.clinic_name)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Today", selectedClinic.todays_appointments],
                  ["Pending", selectedClinic.pending],
                  ["Completed", selectedClinic.completed],
                  ["Cancelled", selectedClinic.cancelled],
                  ["Physios", selectedClinic.active_physiotherapists],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl bg-[var(--ivory)]/80 px-3 py-3 text-center ring-1 ring-black/[0.04]"
                  >
                    <div className="text-lg font-extrabold text-[var(--ink)]">{value as number}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-black/[0.05] px-3 py-3 sm:px-6">
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                {(
                  [
                    ["requests", "Recent requests", "Requests", clinicBookings.length],
                    ["upcoming", "Upcoming schedule", "Schedule", clinicUpcoming.length],
                    ["assessments", "Assessment locks", "Locks", clinicAssessments.length],
                  ] as const
                ).map(([tab, label, shortLabel, count]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setClinicTab(tab)}
                    className={cn(
                      "min-w-0 rounded-xl px-2 py-2 text-center text-[10px] font-bold leading-tight transition sm:px-4 sm:py-2 sm:text-left sm:text-xs",
                      clinicTab === tab
                        ? "bg-[var(--saffron)] text-white shadow-sm"
                        : "bg-black/[0.04] text-[var(--ink-soft)] hover:text-[var(--ink)]",
                    )}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="ml-0 block opacity-80 sm:ml-1.5 sm:inline">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {clinicTab === "requests" ? (
                <>
                  <div className="md:hidden">
                    {!clinicBookings.length && !loading ? (
                      <div className="rounded-2xl bg-[var(--ivory)] px-5 py-10 text-center text-sm text-[var(--ink-soft)]">
                        No recent requests at this clinic.
                      </div>
                    ) : (
                      groupBookingsByTime(clinicBookingsMore.visible, now).map((group) => (
                        <div key={group.label} className="mb-6 last:mb-0">
                          <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                            {group.label}
                          </div>
                          <div className="space-y-3">
                            {group.items.map((b) => {
                              const patient = b.patients?.profiles?.full_name || "Patient";
                              return (
                                <div
                                  key={b.id}
                                  className="rounded-2xl bg-[var(--ivory)]/80 p-4 ring-1 ring-black/[0.04]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--saffron)]/15 text-[10px] font-bold text-[var(--saffron-deep)]">
                                        {initials(patient)}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="truncate font-extrabold text-[var(--ink)]">{patient}</div>
                                        <div className="truncate text-xs text-[var(--ink-soft)]">
                                          {displayStaffLabel(b.physiotherapists?.profiles?.full_name || "Unassigned")}
                                        </div>
                                      </div>
                                    </div>
                                    <span
                                      className={cn(
                                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
                                        statusBadgeClass(b.status),
                                      )}
                                    >
                                      {adminVisitStatusLabel(b.status)}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink-soft)]">
                                    <span>{formatApptWhen(b)}</span>
                                    <span>{b.physiotherapy_categories?.name || "—"}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Doctor</th>
                          <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                          <th className="px-4 py-3">When</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!clinicBookings.length && !loading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-[var(--ink-soft)]">
                              No recent requests at this clinic.
                            </td>
                          </tr>
                        ) : (
                          groupBookingsByTime(clinicBookingsMore.visible, now).map((group) => (
                            <Fragment key={group.label}>
                              <tr className="bg-[var(--ivory)]/40">
                                <td
                                  colSpan={5}
                                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]"
                                >
                                  {group.label}
                                </td>
                              </tr>
                              {group.items.map((b) => {
                                const patient = b.patients?.profiles?.full_name || "Patient";
                                return (
                                  <tr
                                    key={b.id}
                                    className="border-b border-black/[0.04] last:border-none hover:bg-[var(--ivory)]/70"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2.5">
                                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--saffron)]/15 text-[10px] font-bold text-[var(--saffron-deep)]">
                                          {initials(patient)}
                                        </span>
                                        <span className="font-semibold text-[var(--ink)]">{patient}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--ink-soft)]">
                                      {displayStaffLabel(b.physiotherapists?.profiles?.full_name || "Unassigned")}
                                    </td>
                                    <td className="hidden px-4 py-3 text-[var(--ink-soft)] lg:table-cell">
                                      {b.physiotherapy_categories?.name || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--ink-soft)]">{formatApptWhen(b)}</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={cn(
                                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                                          statusBadgeClass(b.status),
                                        )}
                                      >
                                        {adminVisitStatusLabel(b.status)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!loading && clinicBookings.length ? (
                    <ShowMoreButton
                      hiddenCount={clinicBookingsMore.hiddenCount}
                      expanded={clinicBookingsMore.expanded}
                      onClick={clinicBookingsMore.toggle}
                    />
                  ) : null}
                </>
              ) : null}

              {clinicTab === "upcoming" ? (
                <>
                  <div className="md:hidden">
                    {!clinicUpcoming.length && !loading ? (
                      <div className="rounded-2xl bg-[var(--ivory)] px-5 py-10 text-center text-sm text-[var(--ink-soft)]">
                        No upcoming appointments at this clinic.
                      </div>
                    ) : (
                      groupUpcomingByTime(clinicUpcomingMore.visible, now).map((group) => (
                        <div key={group.label} className="mb-6 last:mb-0">
                          <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                            {group.label}
                          </div>
                          <div className="space-y-3">
                            {group.items.map((b) => {
                              const patient = b.patients?.profiles?.full_name || "Patient";
                              return (
                                <div
                                  key={b.id}
                                  className="rounded-2xl bg-[var(--ivory)]/80 p-4 ring-1 ring-black/[0.04]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="font-extrabold text-[var(--ink)]">{patient}</div>
                                    <span
                                      className={cn(
                                        "rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
                                        statusBadgeClass(b.status),
                                      )}
                                    >
                                      {adminVisitStatusLabel(b.status)}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs text-[var(--ink-soft)]">
                                    {formatApptWhen(b)} · {displayStaffLabel(b.physiotherapists?.profiles?.full_name || "Unassigned")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Doctor</th>
                          <th className="px-4 py-3">When</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!clinicUpcoming.length && !loading ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-[var(--ink-soft)]">
                              No upcoming appointments at this clinic.
                            </td>
                          </tr>
                        ) : (
                          groupUpcomingByTime(clinicUpcomingMore.visible, now).map((group) => (
                            <Fragment key={group.label}>
                              <tr className="bg-[var(--ivory)]/40">
                                <td
                                  colSpan={4}
                                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]"
                                >
                                  {group.label}
                                </td>
                              </tr>
                              {group.items.map((b) => {
                                const patient = b.patients?.profiles?.full_name || "Patient";
                                return (
                                  <tr
                                    key={b.id}
                                    className="border-b border-black/[0.04] last:border-none hover:bg-[var(--ivory)]/70"
                                  >
                                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">{patient}</td>
                                    <td className="px-4 py-3 text-[var(--ink-soft)]">
                                      {displayStaffLabel(b.physiotherapists?.profiles?.full_name || "Unassigned")}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--ink-soft)]">{formatApptWhen(b)}</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={cn(
                                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                                          statusBadgeClass(b.status),
                                        )}
                                      >
                                        {adminVisitStatusLabel(b.status)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!loading && clinicUpcoming.length ? (
                    <ShowMoreButton
                      hiddenCount={clinicUpcomingMore.hiddenCount}
                      expanded={clinicUpcomingMore.expanded}
                      onClick={clinicUpcomingMore.toggle}
                    />
                  ) : null}
                </>
              ) : null}

              {clinicTab === "assessments" ? (
                <div className="overflow-x-auto">
                  <p className="mb-4 text-sm text-[var(--ink-soft)]">
                    Unlock or lock assessment editing for patients at {formatClinicName(selectedClinic.clinic_name)} only.
                  </p>
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                        <th className="px-4 py-3">Patient</th>
                        <th className="hidden px-4 py-3 md:table-cell">Diagnosis</th>
                        <th className="px-4 py-3">Started</th>
                        <th className="px-4 py-3">Edit access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!clinicAssessments.length ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-[var(--ink-soft)]">
                            No assessments at this clinic yet.
                          </td>
                        </tr>
                      ) : (
                        clinicAssessmentsMore.visible.map((row) => {
                          const lock = assessmentEditState(row, false);
                          const patient =
                            row.appointments?.patients?.profiles?.full_name || "Patient";
                          return (
                            <tr
                              key={row.id}
                              className="border-b border-black/[0.04] last:border-none hover:bg-[var(--ivory)]/70"
                            >
                              <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                                {patient}
                                <div className="text-xs font-normal text-[var(--ink-soft)]">
                                  {row.appointments?.appointment_code}
                                </div>
                              </td>
                              <td className="hidden px-4 py-3 text-[var(--ink-soft)] md:table-cell">
                                {row.diagnosis || "—"}
                              </td>
                              <td className="px-4 py-3 text-[var(--ink-soft)]">
                                {new Date(row.started_at || row.created_at).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  disabled={assessBusy === row.id}
                                  onClick={() => {
                                    const next = !row.admin_edit_unlocked;
                                    setAssessBusy(row.id);
                                    void setAssessmentAdminEditUnlocked(row.id, next).then((res) => {
                                      setAssessBusy(null);
                                      if (res.error) {
                                        toast.error(res.error);
                                        return;
                                      }
                                      setAssessments((prev) =>
                                        prev.map((item) =>
                                          item.id === row.id
                                            ? { ...item, admin_edit_unlocked: next }
                                            : item,
                                        ),
                                      );
                                      toast.success(
                                        next ? "Assessment editing enabled" : "Assessment editing locked",
                                      );
                                    });
                                  }}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                                    row.admin_edit_unlocked
                                      ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/20"
                                      : lock.editable
                                        ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/20"
                                        : "bg-slate-100 text-slate-600 ring-slate-200",
                                  )}
                                >
                                  {row.admin_edit_unlocked
                                    ? "Unlocked by admin"
                                    : lock.editable
                                      ? "Within 24h window"
                                      : "Locked — tap to unlock"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {!loading && clinicAssessments.length ? (
                    <ShowMoreButton
                      hiddenCount={clinicAssessmentsMore.hiddenCount}
                      expanded={clinicAssessmentsMore.expanded}
                      onClick={clinicAssessmentsMore.toggle}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
