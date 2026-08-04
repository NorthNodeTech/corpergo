import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  ScanLine,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatTimeLabel } from "@/lib/clinic-data";
import {
  fetchPhysioWorkspace,
  patientAge,
  patientName,
  visitTimeLabel,
  type PhysioWorkspaceBundle,
} from "@/lib/physio-workspace-data";
import type { PhysioAppointment } from "@/lib/physio-data";
import { cn } from "@/lib/utils";
import { ClinicPaymentsTracker } from "@/components/physio/ClinicPaymentsTracker";

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0] ?? ""}${p[p.length - 1]![0] ?? ""}`.toUpperCase();
}

function clinicalTone(status: string) {
  switch (status) {
    case "checked_in":
      return "bg-orange-50 text-orange-800 ring-orange-200";
    case "accepted":
      return "bg-violet-50 text-violet-800 ring-violet-200";
    case "pending":
      return "bg-sky-50 text-sky-900 ring-sky-200";
    case "completed":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "cancelled":
    case "rejected":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function clinicalLabel(status: string) {
  if (status === "checked_in") return "Waiting";
  if (status === "accepted") return "Confirmed";
  if (status === "pending") return "Pending";
  return status.replaceAll("_", " ");
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-black/[0.06]", className)} />;
}

function EmptyCalm({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/40 bg-white/45 backdrop-blur-md px-6 py-12 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--pink-main)] text-white shadow-md">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div className="mt-4 text-lg font-extrabold text-[var(--ink)]">{title}</div>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}

function QueueCard({
  appt,
  active,
  onSelect,
}: {
  appt: PhysioAppointment;
  active?: boolean;
  onSelect: () => void;
}) {
  const name = patientName(appt);
  const time = visitTimeLabel(appt);
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      style={{ borderRadius: 22 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex w-full min-w-0 gap-3 rounded-[22px] border bg-white p-3.5 text-left transition outline-none shadow-sm",
        active
          ? "border-black bg-black/5 ring-2 ring-black/20"
          : "border-black/[0.06] bg-white hover:border-black hover:bg-black/5 hover:-translate-y-0.5",
      )}
    >
      <div className="w-12 shrink-0 pt-0.5 text-center">
        <div className="text-sm font-extrabold text-[var(--ink)]">{time}</div>
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--sage)] text-xs font-bold text-white">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate font-extrabold text-[var(--ink)]">{name}</div>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
              clinicalTone(appt.status),
            )}
          >
            {clinicalLabel(appt.status)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
          {appt.physiotherapy_categories?.name || "Consultation"}
          {appt.symptoms ? ` · ${appt.symptoms}` : ""}
        </div>
        <div className="mt-1 text-[11px] font-semibold text-[var(--ink-soft)]">
          {appt.clinics?.name || "Clinic"} · ~30–45 min
        </div>
      </div>
    </motion.button>
  );
}

export function ClinicalWorkspace() {
  const [data, setData] = useState<PhysioWorkspaceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPhysioWorkspace().then((bundle) => {
      if (cancelled) return;
      setData(bundle);
      setSelectedId(bundle.current?.id ?? bundle.todayQueue[0]?.id ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const selected = useMemo(() => {
    if (!data) return null;
    return (
      data.todayQueue.find((a) => a.id === selectedId) ||
      data.current ||
      data.todayQueue[0] ||
      null
    );
  }, [data, selectedId]);

  const rawName = data?.profileName || "";
  const displayName = (() => {
    if (!rawName) return "CorpErgo Clinic";
    if (rawName.startsWith("CorpErgo")) return rawName;
    const lower = rawName.toLowerCase();
    if (lower.includes("chansandra")) return "CorpErgo - Chansandra";
    if (lower.includes("balagere")) return "CorpErgo - Balagere";
    if (lower.includes("muthsandra")) return "CorpErgo - Muthsandra";
    if (lower.includes("kannamangala")) return "CorpErgo - Kannamangala";
    if (lower.includes("manduru")) return "CorpErgo - Manduru";
    
    // Clean up "Physio " or "Dr. " prefix
    const clean = rawName.replace(/^(dr\.?|physio)\s*/i, "").trim();
    if (!clean) return data?.clinicName ? `CorpErgo - ${data.clinicName.replace(" Clinic", "")}` : "CorpErgo Clinic";
    if (clean.toLowerCase().includes("chansandra")) return "CorpErgo - Chansandra";
    if (clean.toLowerCase().includes("balagere")) return "CorpErgo - Balagere";
    if (clean.toLowerCase().includes("muthsandra")) return "CorpErgo - Muthsandra";
    if (clean.toLowerCase().includes("kannamangala")) return "CorpErgo - Kannamangala";
    if (clean.toLowerCase().includes("manduru")) return "CorpErgo - Manduru";

    return clean;
  })();

  return (
    <div className="relative pb-8">
      {/* Welcome */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-1 sm:p-2 mb-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--ink-soft)]">
              {greeting(now.getHours())},
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-[2.1rem]">
              {loading ? "…" : displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 border border-black/10 px-3.5 py-1 text-xs font-bold text-black">
                <Stethoscope className="h-3.5 w-3.5 text-black" />
                {loading ? "Clinic" : data?.clinicName}
              </span>
              <span className="text-sm font-medium text-[var(--ink-soft)]">
                {now.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="mt-2 text-xs font-semibold text-[var(--ink-soft)]">
              Shift · Mon–Sat · 8:00 AM – 8:00 PM
            </div>
          </div>
          <Link
            to="/physio/scan"
            className="group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-full bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-5 text-sm font-bold text-white shadow-md border border-[#06261E]/15 transition-all hover:-translate-y-0.5"
          >
            <ScanLine className="relative h-4 w-4" />
            <span className="relative">Ready to Scan</span>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-1.5 sm:gap-3 sm:overflow-visible">
          {[
            { label: "Patients today", value: data?.counts.today ?? 0, bg: "bg-black/5", border: "border-black/10", text: "text-black" },
            { label: "Waiting / QR", value: data?.counts.waiting ?? 0, bg: "bg-sky-50", border: "border-sky-600/20", text: "text-sky-700" },
            { label: "Follow-ups", value: data?.counts.followUps ?? 0, bg: "bg-black/5", border: "border-black/20", text: "text-black" },
            { label: "Pending requests", value: data?.counts.pending ?? 0, bg: "bg-[#FDE8EF]", border: "border-[#E05A8D]/20", text: "text-[#C94B7C]" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl sm:rounded-2xl ${item.bg} border ${item.border} px-1.5 py-2 sm:px-4 sm:py-3 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col items-center sm:items-start text-center sm:text-left`}
            >
              <div className="text-[8px] sm:text-[11px] leading-[1.1] sm:leading-normal font-bold uppercase tracking-normal sm:tracking-wider text-[var(--ink-soft)] break-words w-full">{item.label.replace(" requests", "").replace(" today", "")}</div>
              <div className={`mt-0.5 sm:mt-1 text-lg sm:text-2xl font-extrabold ${item.text}`}>
                {loading ? "-" : item.value}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Hero workspace */}
      <section className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.95fr]">
        <div className="min-w-0 p-1 sm:p-2">
          <div className="flex h-14 items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pink-main)]">
                Today&apos;s queue
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Who&apos;s next</h2>
            </div>
            <Link
              to="/physio/queue"
              className="text-xs font-bold text-black hover:underline self-end pb-1"
            >
              Full queue
            </Link>
          </div>

          <div className="mt-4 max-h-[32rem] space-y-2.5 overflow-y-auto pr-1">
            {loading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : (data?.todayQueue || []).length ? (
              <AnimatePresence initial={false}>
                {(data?.todayQueue || []).map((a) => (
                  <QueueCard
                    key={a.id}
                    appt={a}
                    active={selected?.id === a.id}
                    onSelect={() => setSelectedId(a.id)}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <EmptyCalm
                title="You're all caught up"
                body="No patients are on today's floor list yet. Enjoy your free time until the next appointment."
              />
            )}
          </div>
        </div>

        {/* Current patient */}
        <div className="flex min-w-0 flex-col p-1 sm:p-2 lg:self-start">
          <div className="flex h-14 items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pink-main)]">
                Current focus
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                {selected ? "Active session" : "No active session"}
              </h2>
            </div>
          </div>

          <div className="mt-4 flex-1 flex flex-col">
            {loading ? (
              <Skeleton className="h-64" />
            ) : selected ? (
              <>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--sage)] text-sm font-bold text-white">
                    {initials(patientName(selected))}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-extrabold text-[var(--ink)]">
                      {patientName(selected)}
                    </h3>
                    <div className="mt-1 text-sm text-[var(--ink-soft)]">
                      {patientAge(selected) != null ? `${patientAge(selected)} yrs` : "Age —"} ·{" "}
                      {visitTimeLabel(selected)}
                    </div>
                    <div className="mt-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1",
                          clinicalTone(selected.status),
                        )}
                      >
                        {clinicalLabel(selected.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 portal-glass-card rounded-2xl p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                    Presenting problem
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--ink)]">
                    {selected.symptoms || selected.physiotherapy_categories?.name || "Not specified"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ink-soft)]">Category</div>
                      <div className="font-bold text-[var(--ink)]">
                        {selected.physiotherapy_categories?.name || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--ink-soft)]">Code</div>
                      <div className="font-bold text-[var(--ink)]">{selected.appointment_code}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to="/physio/assessments/$appointmentId"
                    params={{ appointmentId: selected.id }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--sage)] px-3 text-sm font-bold text-white"
                  >
                    Start assessment
                  </Link>
                  <Link
                    to="/physio/scan"
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--ivory)] px-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    Scan / chart
                  </Link>
                  <Link
                    to="/physio/assessments/$appointmentId"
                    params={{ appointmentId: selected.id }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    <FileText className="h-4 w-4" /> Timeline
                  </Link>
                  <Link
                    to="/physio/assessments/$appointmentId"
                    params={{ appointmentId: selected.id }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    <CalendarPlus className="h-4 w-4" /> Follow-up
                  </Link>
                </div>
              </>
            ) : (
              <EmptyCalm
                title="No patient in focus"
                body="When someone checks in or your next confirmed visit arrives, they’ll appear here."
              />
            )}
          </div>
        </div>
      </section>

      {/* Primary scan band */}
      <section className="mt-6">
        <Link
          to="/physio/scan"
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-black bg-black px-6 py-8 text-center text-white shadow-lg sm:py-10"
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative grid h-20 w-20 place-items-center rounded-full bg-white/15 ring-4 ring-white/20"
          >
            <ScanLine className="h-9 w-9" />
          </motion.span>
          <div className="relative mt-4 text-2xl font-extrabold">Ready to Scan</div>
          <p className="relative mt-1 max-w-md text-sm text-white/75">
            Primary action for check-in. Scan the patient QR to open their chart and start care.
          </p>
          <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-white/90">
            Open scanner <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* Pending requests kanban-lite */}
      <section className="mt-8 min-w-0">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
              Requests
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Pending bookings</h2>
          </div>
          <Link to="/physio/requests" className="text-xs font-bold text-[var(--sage-deep)] hover:underline">
            Open inbox
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(loading ? [] : data?.pending || []).slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="min-w-[15.5rem] shrink-0 rounded-[22px] border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pink-main)]/10 text-[10px] font-bold text-[var(--pink-main)]">
                  {initials(patientName(a))}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-extrabold text-[var(--ink)]">{patientName(a)}</div>
                  <div className="truncate text-[11px] text-[var(--ink-soft)]">
                    {a.physiotherapy_categories?.name || "Category"}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-[var(--ink-soft)]">
                {a.symptoms || "No problem described"}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-soft)]">
                <Clock3 className="h-3.5 w-3.5" />
                Prefers {a.preferred_date} · {formatTimeLabel(a.preferred_time)}
              </div>
              <Link
                to="/physio/requests"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] py-2.5 text-xs font-bold text-white transition-colors shadow-sm"
              >
                Review & accept
              </Link>
            </div>
          ))}
          {!loading && !(data?.pending || []).length ? (
            <div className="w-full">
              <EmptyCalm
                title="Inbox is clear"
                body="No pending appointment requests right now."
              />
            </div>
          ) : null}
          {loading ? (
            <>
              <Skeleton className="h-44 min-w-[15.5rem]" />
              <Skeleton className="h-44 min-w-[15.5rem]" />
            </>
          ) : null}
        </div>
      </section>

      {/* Insights + categories */}
      <section className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--bronze)]" />
            <h2 className="text-xl font-extrabold text-[var(--ink)]">Clinical insights</h2>
          </div>
          <div className="space-y-2.5">
            {(data?.insights || []).map((ins, i) => (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "rounded-[20px] border p-4 transition-all duration-200",
                  ins.tone === "warn"
                    ? "bg-[#FFF9F2] border-[#FFA726]/40"
                    : ins.tone === "good"
                      ? "bg-[#F3FAF7] border-[#00A896]/30"
                      : "bg-white/60 border-black/10 shadow-sm",
                )}
              >
                <div className="text-sm font-extrabold text-[var(--ink)]">{ins.title}</div>
                <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{ins.detail}</div>
              </motion.div>
            ))}
            {!loading && !(data?.insights || []).length ? (
              <EmptyCalm title="Quiet floor" body="Insights will appear as today's list fills." />
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[var(--ink)]">Treatment mix today</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {(data?.categories || []).map((c) => (
              <div
                key={c.name}
                className="min-w-[9.5rem] shrink-0 rounded-[20px] border border-white/40 bg-white/60 px-4 py-3 shadow-sm sm:min-w-0"
              >
                <div className="text-xs font-semibold text-[var(--ink-soft)]">{c.name}</div>
                <div className="mt-1 text-2xl font-extrabold text-black">{c.count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                  patients
                </div>
              </div>
            ))}
            {!loading && !(data?.categories || []).length ? (
              <div className="text-sm text-[var(--ink-soft)]">No category data yet.</div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Assessments + calendar strip */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 p-1 sm:p-2">
          <div className="flex h-14 items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
                Assessments
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Ready to document</h3>
            </div>
            <Link to="/physio/assessments" className="text-xs font-bold text-[var(--sage-deep)] self-end pb-1 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 flex-1">
            <ul className="mt-0 space-y-2.5">
              {(data?.assessable || []).slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    to="/physio/assessments/$appointmentId"
                    params={{ appointmentId: a.id }}
                    className="flex items-center gap-3 rounded-2xl bg-white/80 border border-black/[0.04] shadow-sm px-3 py-3 transition hover:bg-white"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pink-main)]/10 text-[10px] font-bold text-[var(--pink-main)]">
                      {initials(patientName(a))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-[var(--ink)]">{patientName(a)}</div>
                      <div className="truncate text-[11px] text-[var(--ink-soft)]">
                        {a.physiotherapy_categories?.name || "Visit"} · {clinicalLabel(a.status)}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
              {!loading && !(data?.assessable || []).length ? (
                <EmptyCalm
                  title="No assessments pending"
                  body="Checked-in and accepted visits will show here for notes."
                />
              ) : null}
            </ul>
          </div>
        </div>

        <div className="min-w-0 p-1 sm:p-2">
          <div className="flex h-14 items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--bronze)]">
                Today&apos;s timeline
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-[var(--ink)]">Schedule strip</h3>
            </div>
          </div>
          <div className="mt-4 flex-1">
            <div className="space-y-2">
              {(data?.todayQueue || []).map((a) => {
                const past = a.status === "completed";
                const current = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left border transition shadow-sm",
                      current
                        ? "bg-[var(--sage)] text-white border-[var(--sage)]"
                        : past
                          ? "bg-white/45 text-[var(--ink-soft)] border-black/[0.03]"
                          : "bg-white/80 text-[var(--ink)] border-black/[0.04] hover:bg-white",
                    )}
                  >
                    <div className="w-12 text-sm font-extrabold">{visitTimeLabel(a)}</div>
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {patientName(a)}
                    </div>
                    <UserRound className="h-4 w-4 shrink-0 opacity-70" />
                  </button>
                );
              })}
              {!loading && !(data?.todayQueue || []).length ? (
                <EmptyCalm
                  title="Open calendar"
                  body="Accepted and checked-in visits will line up here by time."
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { 
            to: "/physio/requests" as const, 
            label: "Requests inbox", 
            icon: ClipboardList, 
            hint: "Accept & schedule",
            bg: "bg-gradient-to-br from-[#FFFBF7] to-[#FFF3E6]",
            border: "border-[#FFB74D]/40",
            hoverBorder: "hover:border-[#FF9800]/60",
            iconBg: "bg-[#FFE0B2]",
            iconColor: "text-[#E65100]"
          },
          { 
            to: "/physio/queue" as const, 
            label: "Floor queue", 
            icon: Clock3, 
            hint: "Waiting patients",
            bg: "bg-gradient-to-br from-[#FFF5F7] to-[#FFE4E6]",
            border: "border-[#FDA4AF]/40",
            hoverBorder: "hover:border-[#F43F5E]/60",
            iconBg: "bg-[#FFE4E6]",
            iconColor: "text-[#E11D48]"
          },
          { 
            to: "/physio/assessments" as const, 
            label: "Assessments", 
            icon: FileText, 
            hint: "Clinical notes",
            bg: "bg-gradient-to-br from-[#FDFBFF] to-[#F3E8FF]",
            border: "border-[#D8B4FE]/40",
            hoverBorder: "hover:border-[#8B5CF6]/60",
            iconBg: "bg-[#F3E8FF]",
            iconColor: "text-[#6D28D9]"
          },
        ].map(({ to, label, icon: Icon, hint, bg, border, hoverBorder, iconBg, iconColor }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-3 rounded-[22px] border p-4 transition-all hover:-translate-y-0.5 duration-200 shadow-sm",
              bg,
              border,
              hoverBorder,
            )}
          >
            <span className={cn("grid h-11 w-11 place-items-center rounded-2xl shadow-sm", iconBg, iconColor)}>
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-extrabold text-[var(--ink)]">{label}</span>
              <span className="text-xs text-[var(--ink-soft)]">{hint}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Manual Clinic Payments & Collections Tracker */}
      <ClinicPaymentsTracker
        clinicId={
          data?.todayQueue[0]?.clinic_id ||
          data?.pending[0]?.clinic_id ||
          (displayName.toLowerCase().includes("chansandra")
            ? "clinic-1"
            : displayName.toLowerCase().includes("balagere")
              ? "clinic-2"
              : displayName.toLowerCase().includes("muthsandra")
                ? "clinic-3"
                : displayName.toLowerCase().includes("kannamangala")
                  ? "clinic-4"
                  : displayName.toLowerCase().includes("manduru")
                    ? "clinic-5"
                    : "clinic-1")
        }
        clinicName={data?.clinicName || displayName}
      />
    </div>
  );
}
