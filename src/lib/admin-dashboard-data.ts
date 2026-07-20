import { supabaseRest } from "@/lib/auth";

export type AdminKpis = {
  todays_bookings: number;
  pending: number;
  accepted: number;
  checked_in: number;
  completed: number;
  cancelled: number;
  rejected: number;
  rescheduled: number;
  created_today: number;
};

export type ClinicOverview = {
  clinic_id: string;
  clinic_name: string;
  slug: string | null;
  is_active: boolean | null;
  todays_appointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  active_physiotherapists: number;
  total_patients_seen: number;
};

export type PhysioPerformance = {
  physiotherapist_id: string;
  full_name: string;
  clinic_name: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  completion_pct: number | null;
  follow_ups_scheduled: number;
};

export type TopCondition = {
  category_id: string;
  category_name: string;
  appointment_count: number;
};

export type HeatmapCell = {
  day_of_week: number;
  hour_of_day: number;
  booking_count: number;
};

export type RecentBooking = {
  id: string;
  appointment_code: string;
  status: string;
  preferred_date: string;
  preferred_time: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  clinics?: { name: string } | null;
  physiotherapy_categories?: { name: string } | null;
  patients?: {
    profiles?: { full_name: string | null } | null;
  } | null;
  physiotherapists?: {
    profiles?: { full_name: string | null } | null;
  } | null;
};

export type DayPoint = { day: string; label: string; count: number };

export type ClinicStatus = "normal" | "busy" | "attention";

export type Insight = {
  id: string;
  tone: "info" | "warn" | "good";
  title: string;
  detail: string;
};

export type ActivityItem = {
  id: string;
  at: string;
  label: string;
  meta: string;
  tone: ClinicStatus | "neutral";
};

export type AdminDashboardBundle = {
  kpis: AdminKpis | null;
  clinics: ClinicOverview[];
  physios: PhysioPerformance[];
  conditions: TopCondition[];
  heatmap: HeatmapCell[];
  bookings: RecentBooking[];
  series7d: DayPoint[];
  totals: { clinics: number; physios: number; patients: number };
  insights: Insight[];
  activity: ActivityItem[];
};

const BOOKING_SELECT =
  "id,appointment_code,status,preferred_date,preferred_time,scheduled_date,scheduled_time,created_at,clinics(name),physiotherapy_categories(name),patients(profiles(full_name)),physiotherapists(profiles(full_name))";

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function clinicLoadScore(c: ClinicOverview) {
  const today = c.todays_appointments || 0;
  const pending = c.pending || 0;
  const physios = Math.max(c.active_physiotherapists || 1, 1);
  return today / physios + pending * 0.65;
}

export function clinicStatus(c: ClinicOverview): ClinicStatus {
  const score = clinicLoadScore(c);
  if (c.pending >= 8 || score >= 8) return "attention";
  if (c.pending >= 3 || score >= 4) return "busy";
  return "normal";
}

export function utilizationPct(c: ClinicOverview) {
  const denom = Math.max(c.todays_appointments + c.completed, 1);
  if (c.todays_appointments <= 0 && c.completed <= 0) return 0;
  return Math.min(100, Math.round((c.completed / denom) * 100));
}

function buildInsights(
  clinics: ClinicOverview[],
  physios: PhysioPerformance[],
  kpis: AdminKpis | null,
): Insight[] {
  const items: Insight[] = [];
  if (!clinics.length) return items;

  const sorted = [...clinics].sort((a, b) => clinicLoadScore(b) - clinicLoadScore(a));
  const busiest = sorted[0];
  const quietest = sorted[sorted.length - 1];
  if (busiest) {
    items.push({
      id: "busiest",
      tone: clinicStatus(busiest) === "attention" ? "warn" : "info",
      title: `${busiest.clinic_name} is leading today's volume`,
      detail: `${busiest.todays_appointments} appointments · ${busiest.pending} pending · ${busiest.active_physiotherapists} physios on duty`,
    });
  }

  const attention = clinics.filter((c) => clinicStatus(c) === "attention");
  if (attention.length) {
    items.push({
      id: "attention",
      tone: "warn",
      title: `${attention.length} clinic${attention.length > 1 ? "s" : ""} need attention`,
      detail: attention.map((c) => c.clinic_name).join(", "),
    });
  } else if (quietest && busiest && quietest.clinic_id !== busiest.clinic_id) {
    items.push({
      id: "balance",
      tone: "good",
      title: `${quietest.clinic_name} has spare capacity`,
      detail: `Only ${quietest.todays_appointments} bookings today — good overflow option from ${busiest.clinic_name}.`,
    });
  }

  const topPhysio = physios[0];
  if (topPhysio) {
    items.push({
      id: "top-physio",
      tone: "good",
      title: `${topPhysio.full_name} leads completions`,
      detail: `${topPhysio.completed} completed · ${topPhysio.completion_pct ?? 0}% completion · ${topPhysio.clinic_name}`,
    });
  }

  if (kpis && kpis.pending > 0) {
    items.push({
      id: "pending",
      tone: kpis.pending > 12 ? "warn" : "info",
      title: `${kpis.pending} appointments awaiting action`,
      detail: `${kpis.checked_in} checked in · ${kpis.accepted} accepted · ${kpis.created_today} created today`,
    });
  }

  return items.slice(0, 5);
}

function buildActivity(bookings: RecentBooking[]): ActivityItem[] {
  return bookings.slice(0, 12).map((b) => {
    const clinic = b.clinics?.name || "Clinic";
    const patient = b.patients?.profiles?.full_name || "Patient";
    const doctor = b.physiotherapists?.profiles?.full_name;
    const status = b.status;
    let label = `Update at ${clinic}`;
    let tone: ActivityItem["tone"] = "neutral";
    if (status === "checked_in") {
      label = `${patient} checked in at ${clinic}`;
      tone = "busy";
    } else if (status === "completed") {
      label = doctor
        ? `${doctor} completed a session at ${clinic}`
        : `Session completed at ${clinic}`;
      tone = "normal";
    } else if (status === "pending") {
      label = `New booking from ${patient}`;
      tone = "attention";
    } else if (status === "accepted") {
      label = `Appointment accepted for ${patient}`;
      tone = "normal";
    } else if (status === "cancelled" || status === "rejected") {
      label = `Appointment ${status} · ${patient}`;
      tone = "attention";
    }
    return {
      id: b.id,
      at: b.created_at,
      label,
      meta: b.physiotherapy_categories?.name || b.appointment_code,
      tone,
    };
  });
}

function buildSeries7d(
  rows: { preferred_date: string; scheduled_date: string | null }[],
): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const key = isoDate(d);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const count = rows.filter((r) => (r.scheduled_date || r.preferred_date) === key).length;
    points.push({ day: key, label, count });
  }
  return points;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardBundle> {
  const since = isoDate(daysAgo(6));
  const [
    kpisRes,
    clinicsRes,
    physiosRes,
    conditionsRes,
    heatmapRes,
    bookingsRes,
    seriesRes,
    clinicCount,
    physioCount,
    patientCount,
  ] = await Promise.all([
    supabaseRest<AdminKpis[]>("v_admin_dashboard_kpis?select=*"),
    supabaseRest<ClinicOverview[]>(
      "v_admin_clinic_summary?select=clinic_id,clinic_name,slug,is_active,todays_appointments,completed,pending,cancelled,active_physiotherapists,total_patients_seen&order=clinic_name.asc",
    ),
    supabaseRest<PhysioPerformance[]>(
      "v_admin_physio_performance?select=physiotherapist_id,full_name,clinic_name,total_appointments,completed,cancelled,completion_pct,follow_ups_scheduled&order=completed.desc.nullslast&limit=12",
    ),
    supabaseRest<TopCondition[]>(
      "v_admin_top_conditions?select=category_id,category_name,appointment_count&order=appointment_count.desc&limit=8",
    ),
    supabaseRest<HeatmapCell[]>(
      "v_admin_appointment_heatmap?select=day_of_week,hour_of_day,booking_count",
    ),
    supabaseRest<RecentBooking[]>(
      `appointments?deleted_at=is.null&select=${BOOKING_SELECT}&order=created_at.desc&limit=18`,
    ),
    supabaseRest<{ preferred_date: string; scheduled_date: string | null }[]>(
      `appointments?deleted_at=is.null&or=(scheduled_date.gte.${since},and(scheduled_date.is.null,preferred_date.gte.${since}))&select=preferred_date,scheduled_date&limit=2000`,
    ),
    supabaseRest<{ id: string }[]>("clinics?deleted_at=is.null&select=id"),
    supabaseRest<{ id: string }[]>("physiotherapists?deleted_at=is.null&select=id"),
    supabaseRest<{ id: string }[]>("patients?deleted_at=is.null&select=id"),
  ]);

  const kpis = kpisRes.data?.[0] ?? null;
  const clinics = clinicsRes.data || [];
  const physios = physiosRes.data || [];
  const bookings = bookingsRes.data || [];

  return {
    kpis,
    clinics,
    physios,
    conditions: conditionsRes.data || [],
    heatmap: heatmapRes.data || [],
    bookings,
    series7d: buildSeries7d(seriesRes.data || []),
    totals: {
      clinics: clinicCount.data?.length || clinics.length,
      physios: physioCount.data?.length || 0,
      patients: patientCount.data?.length || 0,
    },
    insights: buildInsights(clinics, physios, kpis),
    activity: buildActivity(bookings),
  };
}
