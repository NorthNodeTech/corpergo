import { useEffect, useMemo, useState, Fragment } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
} from "@/lib/admin-dashboard-data";
import {
  assessmentEditState,
  fetchAdminAssessments,
  setAssessmentAdminEditUnlocked,
  type AdminAssessmentRow,
} from "@/lib/assessment-data";
import { AdminCardCarousel } from "@/components/admin/AdminCardCarousel";
import { cn, formatClinicName } from "@/lib/utils";
import { toast } from "sonner";
import { ShowMoreButton, useShowMore } from "@/components/portal/ShowMoreList";

const STATUS_COLOR: Record<ClinicStatus, string> = {
  normal: "#f28c28",
  busy: "#d97706",
  attention: "#dc2626",
};

const CHART_SAFFRON = "#f28c28";
const CHART_SAFFRON_DEEP = "#d97706";

const STATUS_LABEL: Record<ClinicStatus, string> = {
  normal: "Operating normally",
  busy: "Busy",
  attention: "Needs attention",
};

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
      return "bg-amber-50 text-amber-900";
    case "checked_in":
    case "accepted":
      return "bg-sky-50 text-sky-900";
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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-black/[0.05]", className)} />;
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

  const clinicBars = useMemo(
    () =>
      (data?.clinics || []).map((c) => {
        const full = formatClinicName(c.clinic_name);
        return {
          name: full.replace(/(.{8}).+/, "$1…"),
          full,
          today: c.todays_appointments,
          pending: c.pending,
        };
      }),
    [data?.clinics],
  );

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
    ? Array.from({ length: 4 }).map((_, i) => ({
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
        className="h-full rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/[0.06] shadow-sm sm:px-3 sm:py-2.5"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[10px] font-semibold leading-tight text-[var(--ink-soft)] sm:text-xs">
            {label}
          </span>
          <Icon className="h-3 w-3 shrink-0 text-[var(--saffron-deep)]" />
        </div>
        <div className="mt-0.5 text-lg font-extrabold leading-none text-[var(--ink)] sm:mt-1 sm:text-2xl">
          {loading ? "—" : <AnimatedNumber value={value} />}
        </div>
      </div>
    );
  }

  function renderClinicCard(c: (typeof clinicList)[number]) {
    const status = clinicStatus(c);
    const util = utilizationPct(c);
    const name = formatClinicName(c.clinic_name);
    return (
      <button
        key={c.clinic_id}
        type="button"
        onClick={() => selectClinic(c.clinic_id)}
        className={cn(
          "h-full w-full rounded-[24px] bg-white p-4 text-left shadow-[var(--shadow-soft)] ring-1 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elev)]",
          selectedClinicId === c.clinic_id
            ? "ring-2 ring-[var(--saffron)] ring-offset-2"
            : "ring-black/[0.05]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              <MapPin className="h-3 w-3 shrink-0" /> Clinic
            </div>
            <div className="mt-1 truncate text-lg font-extrabold text-[var(--ink)]">{name}</div>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
            style={{
              background: `${STATUS_COLOR[status]}1f`,
              color: STATUS_COLOR[status],
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["Today", c.todays_appointments],
            ["Pending", c.pending],
            ["Done", c.completed],
            ["Physios", c.active_physiotherapists],
          ].map(([l, v]) => (
            <div key={String(l)}>
              <div className="text-base font-extrabold text-[var(--ink)]">{v as number}</div>
              <div className="text-[10px] font-semibold text-[var(--ink-soft)]">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-semibold text-[var(--ink-soft)]">
            <span>Utilization</span>
            <span>{util}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: STATUS_COLOR[status] }}
              initial={{ width: 0 }}
              animate={{ width: `${util}%` }}
              transition={{ duration: 0.7 }}
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
  const physios = data?.physios || [];
  const insightsMore = useShowMore(insights);
  const activityMore = useShowMore(activity);
  const physiosMore = useShowMore(physios);
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
    <div className="relative w-full min-w-0 max-w-full overflow-x-hidden pb-4 sm:pb-10">
      {/* Executive header */}
      <motion.section
        id="admin-overview"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-0 scroll-mt-24 overflow-hidden rounded-[28px] border border-white/60 bg-white/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--ink-soft)]">
              {greetingForHour(now.getHours())},
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              CorpErgo Admin
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-soft)] sm:text-sm">
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
              className="relative grid h-10 w-10 place-items-center rounded-full border border-black/[0.06] bg-white text-[var(--ink)] shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {(kpis?.pending || 0) > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              ) : null}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--saffron-light)] px-2.5 py-2 text-[10px] font-bold text-[var(--saffron-deep)] ring-1 ring-[var(--saffron)]/20 sm:px-3 sm:text-xs">
              <Radio className="h-3.5 w-3.5" /> Online
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
            Today&apos;s operations
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      ? "bg-[var(--saffron-light)] text-[var(--ink)]"
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

      {/* Network + activity */}
      <section id="admin-network" className="mt-6 grid w-full min-w-0 scroll-mt-24 gap-4 sm:mt-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
              Network overview
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Five clinics. One pulse.</h2>
          </div>
          <AdminCardCarousel
            className="mt-1"
            itemCount={Math.max(clinicList.length, 1)}
            ariaLabel="clinic"
            renderItem={(i) => renderClinicCard(clinicList[i]!)}
            desktop={
              <div className="grid gap-3 lg:grid-cols-2">
                {clinicList.map((c) => renderClinicCard(c))}
              </div>
            }
          />
        </div>

        <div className="min-w-0 rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
                Live activity
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">What happened today</h3>
            </div>
            <Activity className="h-4 w-4 text-[var(--saffron-deep)]" />
          </div>
          <ul className="mt-4 space-y-3 pr-1">
            {loading ? (
              <>
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </>
            ) : activity.length ? (
              groupActivityByTime(activityMore.visible, now).map((group, gi) => (
                <div key={group.label} className="mb-4 last:mb-0">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                    {group.label}
                  </div>
                  <div className="space-y-3">
                    {group.items.map((a, i) => (
                      <motion.li
                        key={a.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (gi * 2 + i) * 0.04 }}
                        className="flex gap-3"
                      >
                        <div className="w-16 shrink-0 pt-0.5 text-[11px] font-bold text-[var(--ink-soft)]">
                          {formatActivityTime(a.at, group.label)}
                        </div>
                        <div className="relative min-w-0 flex-1 rounded-2xl bg-[var(--ivory)]/80 px-3 py-2.5">
                          <span
                            className="absolute left-0 top-3 h-2 w-2 -translate-x-1/2 rounded-full"
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
                          <div className="truncate text-sm font-semibold text-[var(--ink)]">{a.label}</div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--ink-soft)]">{a.meta}</div>
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

      {/* KPI mix */}
      <section className="mt-6 grid w-full min-w-0 gap-4 sm:mt-8 lg:grid-cols-12">
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5 lg:col-span-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
                Appointments
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Last 7 days — all clinics</h3>
            </div>
            <Users className="h-4 w-4 text-[var(--ink-soft)]" />
          </div>
          <div className="mt-4 h-48 w-full min-w-0 overflow-hidden sm:h-56">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={data?.series7d || []}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_SAFFRON} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_SAFFRON} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5E6A6A", fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fill: "#5E6A6A", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 24px rgba(38,50,56,0.08)",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke={CHART_SAFFRON_DEEP} strokeWidth={2.5} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
          {[
            { label: "Network clinics", value: data?.totals.clinics ?? 0, hint: "Active locations" },
            { label: "Physiotherapists", value: data?.totals.physios ?? 0, hint: "Across Bengaluru" },
            { label: "Active patients", value: data?.totals.patients ?? 0, hint: "Registered" },
            { label: "Cancelled / rejected", value: (kpis?.cancelled || 0) + (kpis?.rejected || 0), hint: "Needs follow-up" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-[24px] bg-gradient-to-br from-white to-[var(--ivory)] p-5 ring-1 ring-black/[0.05]"
            >
              <div className="text-xs font-semibold text-[var(--ink-soft)]">{m.label}</div>
              <div className="mt-2 text-3xl font-extrabold text-[var(--ink)]">
                {loading ? "—" : <AnimatedNumber value={m.value} />}
              </div>
              <div className="mt-1 text-[11px] font-medium text-[var(--ink-soft)]">{m.hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics */}
      <section id="admin-analytics" className="mt-6 w-full min-w-0 scroll-mt-24 sm:mt-8">
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5">
          <h3 className="text-lg font-extrabold text-[var(--ink)]">Clinic comparison</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Today&apos;s appointments by location — tap a clinic above to drill down</p>
          <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={clinicBars} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorToday" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_SAFFRON} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={CHART_SAFFRON} stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C48A3A" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#C48A3A" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#5E6A6A", fontSize: 11 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tickLine={false} 
                  axisLine={false} 
                  width={90} 
                  tick={{ fill: "#5E6A6A", fontSize: 11 }} 
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 24px rgba(38,50,56,0.08)",
                    fontSize: 13,
                  }}
                  formatter={(value) => [value as number, "Count"]}
                  labelFormatter={(_, payload) =>
                    String((payload?.[0]?.payload as { full?: string } | undefined)?.full || "")
                  }
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#5E6A6A", paddingTop: 10 }} />
                <Bar name="Today" dataKey="today" stackId="a" fill="url(#colorToday)" radius={[0, 0, 0, 0]} maxBarSize={20} />
                <Bar name="Pending" dataKey="pending" stackId="a" fill="url(#colorPending)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Doctor performance */}
      <section className="mt-8 min-w-0">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
              Team
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Doctor performance</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          <div className="divide-y divide-black/[0.05]">
            {physiosMore.visible.map((p, i) => (
              <div key={p.physiotherapist_id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <div className="w-6 text-center text-xs font-extrabold text-[var(--ink-soft)]">{i + 1}</div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--saffron)] text-xs font-bold text-white">
                  {initials(p.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-extrabold text-[var(--ink)]">{p.full_name}</div>
                    {i === 0 ? (
                      <span className="rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--saffron-deep)]">
                        Top performer
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-xs text-[var(--ink-soft)]">{formatClinicName(p.clinic_name)}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-extrabold text-[var(--ink)]">{p.completed}</div>
                  <div className="text-[10px] font-semibold text-[var(--ink-soft)]">Completed</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[var(--saffron-deep)]">
                    {p.completion_pct ?? 0}%
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--ink-soft)]">Rate</div>
                </div>
              </div>
            ))}
            {!loading && !(data?.physios || []).length ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--ink-soft)]">
                No physiotherapist performance data yet.
              </div>
            ) : null}
          </div>
          {!loading && physios.length ? (
            <ShowMoreButton
              hiddenCount={physiosMore.hiddenCount}
              expanded={physiosMore.expanded}
              onClick={physiosMore.toggle}
              className="mx-4 mb-4 sm:mx-5"
            />
          ) : null}
        </div>
      </section>

      {/* Clinic detail — patients, schedule, assessment locks */}
      <section id="admin-clinic-detail" className="mt-8 scroll-mt-24">
        {!selectedClinic ? (
          <div className="rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
            <MapPin className="mx-auto h-8 w-8 text-[var(--ink-soft)]" />
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
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
                    Clinic workspace
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)] sm:text-2xl">
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
                                        ? "bg-sky-50 text-sky-800 ring-sky-100"
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
