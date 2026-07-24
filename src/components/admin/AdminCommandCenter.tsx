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
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<ClinicStatus, string> = {
  normal: "#5D725E",
  busy: "#C48A3A",
  attention: "#C45C5C",
};

const STATUS_LABEL: Record<ClinicStatus, string> = {
  normal: "Operating normally",
  busy: "Busy",
  attention: "Needs attention",
};

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
      return "bg-emerald-50 text-emerald-800";
    case "pending":
      return "bg-amber-50 text-amber-900";
    case "checked_in":
      return "bg-sky-50 text-sky-900";
    case "accepted":
      return "bg-[var(--sage)]/12 text-[var(--sage-deep)]";
    case "cancelled":
    case "rejected":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-black/[0.05]", className)} />;
}

export function AdminCommandCenter() {
  const [data, setData] = useState<AdminDashboardBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState<"recent" | "upcoming">("recent");

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

  const peakHours = useMemo(() => {
    const map = new Map<number, number>();
    for (const cell of data?.heatmap || []) {
      map.set(cell.hour_of_day, (map.get(cell.hour_of_day) || 0) + cell.booking_count);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .filter(([h]) => h >= 8 && h <= 20)
      .map(([hour, count]) => ({
        hour: `${hour % 12 || 12}${hour < 12 ? "a" : "p"}`,
        count,
      }));
  }, [data?.heatmap]);

  const conditionPie = useMemo(
    () =>
      (data?.conditions || []).slice(0, 5).map((c, i) => ({
        name: c.category_name,
        value: c.appointment_count,
        fill: ["#5D725E", "#6F9E9C", "#9A7059", "#47563F", "#C48A3A"][i % 5],
      })),
    [data?.conditions],
  );

  const clinicBars = useMemo(
    () =>
      (data?.clinics || []).map((c) => ({
        name: c.clinic_name.replace(/(.{8}).+/, "$1…"),
        full: c.clinic_name,
        today: c.todays_appointments,
        pending: c.pending,
      })),
    [data?.clinics],
  );

  const kpis = data?.kpis;
  const waiting = (kpis?.checked_in || 0) + (kpis?.accepted || 0);
  const upcoming = Math.max((kpis?.todays_bookings || 0) - (kpis?.completed || 0) - waiting, 0);

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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-2 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-100 sm:px-3 sm:text-xs">
              <Radio className="h-3.5 w-3.5" /> Online
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
            Today&apos;s operations
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible">
            {[
              { label: "Appointments", value: kpis?.todays_bookings ?? 0, icon: Activity },
              { label: "Completed", value: kpis?.completed ?? 0, icon: CheckCircle2 },
              { label: "Waiting", value: waiting, icon: Clock3 },
              { label: "Upcoming", value: upcoming, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="min-w-[9.5rem] shrink-0 rounded-2xl bg-[var(--ivory)]/90 px-4 py-3 ring-1 ring-black/[0.04] sm:min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--ink-soft)]">{label}</span>
                  <Icon className="h-3.5 w-3.5 text-[var(--sage-deep)]" />
                </div>
                <div className="mt-1 text-2xl font-extrabold text-[var(--ink)]">
                  {loading ? "—" : <AnimatedNumber value={value} />}
                </div>
              </div>
            ))}
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
            {(data?.insights || []).map((ins) => (
              <li
                key={ins.id}
                className={cn(
                  "rounded-2xl px-3.5 py-3 text-sm",
                  ins.tone === "warn"
                    ? "bg-amber-50 text-amber-950"
                    : ins.tone === "good"
                      ? "bg-emerald-50 text-emerald-950"
                      : "bg-[var(--ivory)] text-[var(--ink)]",
                )}
              >
                <div className="font-bold">{ins.title}</div>
                <div className="mt-0.5 text-xs opacity-80">{ins.detail}</div>
              </li>
            ))}
            {!data?.insights.length ? (
              <li className="rounded-2xl bg-[var(--ivory)] px-3.5 py-3 text-sm text-[var(--ink-soft)]">
                No alerts right now — network is calm.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {/* Network + activity */}
      <section id="admin-network" className="mt-6 grid w-full min-w-0 scroll-mt-24 gap-4 sm:mt-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
              Network overview
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Five clinics. One pulse.</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(loading
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
              : data?.clinics || []
            ).map((c) => {
              const status = clinicStatus(c);
              const util = utilizationPct(c);
              return (
                <button
                  key={c.clinic_id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`clinic-${c.slug || c.clinic_id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setExpandedClinic(c.clinic_id);
                  }}
                  className="min-w-[16.5rem] shrink-0 rounded-[24px] bg-white p-4 text-left shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elev)] lg:min-w-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                        <MapPin className="h-3 w-3" /> Clinic
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-[var(--ink)]">{c.clinic_name}</div>
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-bold"
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
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--ivory)]">
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
            })}
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
                Live activity
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">What happened today</h3>
            </div>
            <Activity className="h-4 w-4 text-[var(--sage-deep)]" />
          </div>
          <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <>
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </>
            ) : (data?.activity || []).length ? (
              groupActivityByTime(data!.activity, now).map((group, gi) => (
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
        </div>
      </section>

      {/* KPI mix */}
      <section className="mt-6 grid w-full min-w-0 gap-4 sm:mt-8 lg:grid-cols-12">
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
                Appointments
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Last 7 days</h3>
            </div>
            <Users className="h-4 w-4 text-[var(--ink-soft)]" />
          </div>
          <div className="mt-4 h-48 w-full min-w-0 overflow-hidden sm:h-56">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={data?.series7d || []}>
                <defs>
                  <linearGradient id="apptFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5D725E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5D725E" stopOpacity={0.02} />
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
                <Area type="monotone" dataKey="count" stroke="#47563F" strokeWidth={2.5} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5 lg:col-span-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
            Treatment mix
          </div>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Top categories</h3>
          <div className="mt-2 h-44 w-full min-w-0 overflow-hidden sm:h-48">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie data={conditionPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {conditionPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5">
            {conditionPie.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-xs">
                <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-[var(--ink)]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.fill }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="shrink-0 font-bold text-[var(--ink-soft)]">{c.value}</span>
              </li>
            ))}
          </ul>
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
      <section id="admin-analytics" className="mt-6 grid w-full min-w-0 scroll-mt-24 gap-4 sm:mt-8 lg:grid-cols-2">
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5">
          <h3 className="text-lg font-extrabold text-[var(--ink)]">Clinic comparison</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Today&apos;s appointments by location</p>
          <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={clinicBars} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorToday" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5D725E" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#5D725E" stopOpacity={1}/>
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
        <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5">
          <h3 className="text-lg font-extrabold text-[var(--ink)]">Peak hours</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Booking intensity across the day</p>
          <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6F9E9C" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6F9E9C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: "#5E6A6A", fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fill: "#5E6A6A", fontSize: 11 }} />
                <Tooltip
                  cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 24px rgba(38,50,56,0.08)",
                    fontSize: 13,
                  }}
                  formatter={(value) => [value as number, "Bookings"]}
                />
                <Area type="monotone" name="Bookings" dataKey="count" stroke="#6F9E9C" strokeWidth={3} fillOpacity={1} fill="url(#colorPeak)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Doctor performance */}
      <section className="mt-8 min-w-0">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
              Team
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Doctor performance</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
          <div className="divide-y divide-black/[0.05]">
            {(data?.physios || []).slice(0, 8).map((p, i) => (
              <div key={p.physiotherapist_id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <div className="w-6 text-center text-xs font-extrabold text-[var(--ink-soft)]">{i + 1}</div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--sage)] text-xs font-bold text-white">
                  {initials(p.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-extrabold text-[var(--ink)]">{p.full_name}</div>
                    {i === 0 ? (
                      <span className="rounded-full bg-[var(--bronze)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--bronze)]">
                        Top performer
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-xs text-[var(--ink-soft)]">{p.clinic_name}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-extrabold text-[var(--ink)]">{p.completed}</div>
                  <div className="text-[10px] font-semibold text-[var(--ink-soft)]">Completed</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[var(--sage-deep)]">
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
        </div>
      </section>

      {/* Clinic performance rows */}
      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-[var(--ink)]">Clinic performance</h2>
        <div className="mt-4 space-y-3">
          {(data?.clinics || []).map((c) => {
            const util = utilizationPct(c);
            const open = expandedClinic === c.clinic_id;
            return (
              <div
                key={c.clinic_id}
                id={`clinic-${c.slug || c.clinic_id}`}
                className="rounded-[24px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center"
                  onClick={() => setExpandedClinic(open ? null : c.clinic_id)}
                >
                  <div className="min-w-[8rem] font-extrabold text-[var(--ink)]">{c.clinic_name}</div>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--ivory)]">
                      <div
                        className="h-full rounded-full bg-[var(--sage)]"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-[var(--ink)]">{util}%</div>
                </button>
                {open ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/[0.05] pt-4 text-sm sm:grid-cols-5">
                    {[
                      ["Appointments", c.todays_appointments],
                      ["Waiting / pending", c.pending],
                      ["Completed", c.completed],
                      ["Cancelled", c.cancelled],
                      ["Staff", c.active_physiotherapists],
                    ].map(([l, v]) => (
                      <div key={String(l)}>
                        <div className="text-[11px] font-semibold text-[var(--ink-soft)]">{l}</div>
                        <div className="font-extrabold text-[var(--ink)]">{v as number}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent bookings */}
      <section id="admin-bookings" className="mt-6 scroll-mt-24 sm:mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
              Queue
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">
              {bookingTab === "recent" ? "Recent requests" : "Upcoming schedule"}
            </h2>
          </div>
          <div className="flex w-full items-center rounded-2xl bg-black/[0.03] p-1 sm:w-auto">
            <button
              onClick={() => setBookingTab("recent")}
              className={cn(
                "flex-1 rounded-xl px-4 py-2 text-xs font-bold transition sm:flex-none",
                bookingTab === "recent"
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
              )}
            >
              Recent requests
            </button>
            <button
              onClick={() => setBookingTab("upcoming")}
              className={cn(
                "flex-1 rounded-xl px-4 py-2 text-xs font-bold transition sm:flex-none",
                bookingTab === "upcoming"
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
              )}
            >
              Upcoming schedule
            </button>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {!(bookingTab === "recent" ? data?.bookings : data?.upcoming_bookings)?.length && !loading ? (
            <div className="rounded-3xl bg-white px-5 py-10 text-center text-sm text-[var(--ink-soft)] ring-1 ring-black/[0.05]">
              No bookings yet.
            </div>
          ) : (
            (bookingTab === "recent"
              ? groupBookingsByTime(data?.bookings || [], now)
              : groupUpcomingByTime(data?.upcoming_bookings || [], now)
            ).map((group) => (
              <div key={group.label} className="mb-6 last:mb-0">
                <div className="mb-3 pl-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                  {group.label}
                </div>
                <div className="space-y-3">
                  {group.items.map((b) => {
                    const patient = b.patients?.profiles?.full_name || "Patient";
                    return (
                      <div
                        key={b.id}
                        className="rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--sage)]/15 text-[10px] font-bold text-[var(--sage-deep)]">
                              {initials(patient)}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-extrabold text-[var(--ink)]">{patient}</div>
                              <div className="truncate text-xs text-[var(--ink-soft)]">
                                {b.clinics?.name || "—"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize",
                              statusBadgeClass(b.status),
                            )}
                          >
                            {b.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--ink-soft)]">
                          <span>{formatApptWhen(b)}</span>
                          <span>{b.physiotherapists?.profiles?.full_name || "Unassigned"}</span>
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

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-[28px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="px-4 py-3 sm:px-5">Patient</th>
                <th className="px-4 py-3">Clinic</th>
                <th className="hidden px-4 py-3 md:table-cell">Doctor</th>
                <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {!(bookingTab === "recent" ? data?.bookings : data?.upcoming_bookings)?.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--ink-soft)]">
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                (bookingTab === "recent"
                  ? groupBookingsByTime(data?.bookings || [], now)
                  : groupUpcomingByTime(data?.upcoming_bookings || [], now)
                ).map((group) => (
                  <Fragment key={group.label}>
                    <tr className="bg-[var(--ivory)]/40">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] sm:px-5"
                      >
                        {group.label}
                      </td>
                    </tr>
                    {group.items.map((b) => {
                      const patient = b.patients?.profiles?.full_name || "Patient";
                      return (
                        <tr
                          key={b.id}
                          className="border-b border-black/[0.04] transition hover:bg-[var(--ivory)]/70 last:border-none"
                        >
                          <td className="px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--sage)]/15 text-[10px] font-bold text-[var(--sage-deep)]">
                                {initials(patient)}
                              </span>
                              <span className="font-semibold text-[var(--ink)]">{patient}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{b.clinics?.name || "—"}</td>
                          <td className="hidden px-4 py-3 text-[var(--ink-soft)] md:table-cell">
                            {b.physiotherapists?.profiles?.full_name || "Unassigned"}
                          </td>
                          <td className="hidden px-4 py-3 text-[var(--ink-soft)] lg:table-cell">
                            {b.physiotherapy_categories?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{formatApptWhen(b)}</td>
                          <td className="px-4 py-3 sm:px-5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                                statusBadgeClass(b.status),
                              )}
                            >
                              {b.status.replace(/_/g, " ")}
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
      </section>
    </div>
  );
}
