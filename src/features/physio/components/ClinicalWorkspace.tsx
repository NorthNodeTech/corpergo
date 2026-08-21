import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  PhoneCall,
  ScanLine,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhoneAppIcon } from "@/shared/components/icons/BrandIcons";
import { useOpenInstantBooking } from "@/features/physio/components/instant-booking-context";
import { StatusBadge } from "@/shared/components/layout/StatusBadge";
import { ShowMoreButton, useShowMore } from "@/shared/components/layout/ShowMoreList";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateLabel, formatTimeLabel } from "@/lib/patient/clinic-data";
import { isVisitDocumented } from "@/lib/physio/assessment-data";
import type { DirectBookingRequest } from "@/lib/booking/direct-booking-data";
import { directBookingSourceLabel } from "@/lib/booking/direct-booking-data";
import {
  fetchPhysioWorkspace,
  patientName,
  visitTimeLabel,
  type PhysioWorkspaceBundle,
} from "@/lib/physio/physio-workspace-data";
import type { PhysioAppointment } from "@/lib/physio/physio-data";
import { resolveStaffClinicId } from "@/lib/physio/physio-data";
import { cn, formatClinicName, formatPhysioDisplayName } from "@/lib/core/utils";
import { ClinicPaymentsTracker } from "@/features/physio/components/ClinicPaymentsTracker";
import { ClinicSlotManager } from "@/features/physio/components/ClinicSlotManager";

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

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-white/60 px-5 py-10 text-center">
      <CheckCircle2 className="h-8 w-8 text-[var(--ink-soft)]/50" />
      <div className="mt-3 font-extrabold text-[var(--ink)]">{title}</div>
      <p className="mt-1 max-w-xs text-sm text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}

function formatDirectRequestedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function directStatusLabel(status: DirectBookingRequest["status"]) {
  if (status === "ready_for_session") return "Ready for session";
  if (status === "converted") return "Account created";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function SectionHeader({
  eyebrow,
  title,
  href,
  hash,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  hash?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--burnt-amber)]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">{title}</h2>
      </div>
      {href && linkLabel ? (
        <Link
          to={href}
          hash={hash}
          className="text-xs font-bold text-[var(--saffron-deep)] hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function PendingBookingCard({ appt }: { appt: PhysioAppointment }) {
  return (
    <div className="rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--saffron)]/15 text-xs font-bold text-[var(--saffron-deep)]">
            {initials(patientName(appt))}
          </div>
          <div className="min-w-0">
            <div className="truncate font-extrabold text-[var(--ink)]">{patientName(appt)}</div>
            <div className="truncate text-xs text-[var(--ink-soft)]">
              {appt.physiotherapy_categories?.name || "Category"}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--saffron-deep)] ring-1 ring-[var(--saffron)]/20">
          Login booking
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">
        {appt.symptoms || "No problem described"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
        <span>{appt.appointment_code}</span>
        <span>·</span>
        <Clock3 className="h-3.5 w-3.5" />
        <span>
          {formatDateLabel(appt.preferred_date)} · {formatTimeLabel(appt.preferred_time)}
        </span>
      </div>
      <Link
        to="/physio/requests"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--saffron)] py-2.5 text-xs font-bold text-white"
      >
        Review & accept
      </Link>
    </div>
  );
}

function DirectBookingCard({ request }: { request: DirectBookingRequest }) {
  const converted = request.status === "converted";
  return (
    <div className="rounded-[22px] border border-[var(--saffron)]/20 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-extrabold text-[var(--ink)]">{request.full_name}</div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
            converted
              ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/20"
              : "bg-amber-50 text-amber-800 ring-amber-100",
          )}
        >
          {directStatusLabel(request.status)}
        </span>
      </div>
      <div className="mt-2 inline-flex rounded-full bg-[var(--saffron-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--saffron-deep)]">
        {directBookingSourceLabel(request.booking_source)}
      </div>
      <a
        href={`tel:${request.phone}`}
        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--saffron-deep)] hover:underline"
      >
        <PhoneAppIcon className="h-4 w-4" />
        {request.phone}
      </a>
      <div className="mt-2 text-[11px] font-semibold text-[var(--ink-soft)]">
        {request.request_code} · {formatDirectRequestedAt(request.created_at)}
      </div>
      <Link
        to="/physio/requests"
        hash="direct"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--pink-main)] py-2.5 text-xs font-bold text-white hover:bg-[var(--pink-hover)]"
      >
        {converted ? "View in direct inbox" : "Manage request"}
      </Link>
    </div>
  );
}

function InstantWalkInCard({ appt }: { appt: PhysioAppointment }) {
  return (
    <Link
      to="/physio/assessments/$appointmentId"
      params={{ appointmentId: appt.id }}
      className="block rounded-[22px] border border-black/10 bg-white p-4 shadow-sm transition hover:ring-2 hover:ring-[var(--saffron)]/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-extrabold text-[var(--ink)]">{patientName(appt)}</div>
          <div className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
            {appt.physiotherapy_categories?.name || "Visit"} · {visitTimeLabel(appt)}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          In session
        </span>
      </div>
      <div className="mt-2 inline-flex rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
        Instant booking
      </div>
      <div className="mt-3 text-[11px] font-semibold text-[var(--ink-soft)]">{appt.appointment_code}</div>
      <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-black py-2.5 text-xs font-bold text-white">
        Continue assessment
      </span>
    </Link>
  );
}

export function ClinicalWorkspace() {
  const openInstantBooking = useOpenInstantBooking();
  const [data, setData] = useState<PhysioWorkspaceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [staffClinicId, setStaffClinicId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace(silent = false) {
      if (!silent) setLoading(true);
      const [bundle, clinicId] = await Promise.all([
        fetchPhysioWorkspace(),
        resolveStaffClinicId(),
      ]);
      if (cancelled) return;
      setData(bundle);
      setStaffClinicId(clinicId);
      if (!silent) setLoading(false);
    }

    void loadWorkspace();
    const refresh = window.setInterval(() => void loadWorkspace(true), 30_000);
    const onRefresh = () => void loadWorkspace(true);
    window.addEventListener("physio-workspace-refresh", onRefresh);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      window.removeEventListener("physio-workspace-refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const assessedIds = useMemo(
    () => new Set(data?.assessedAppointmentIds || []),
    [data?.assessedAppointmentIds],
  );

  const walkInCount = (data?.directRequestsActive?.length || 0) + (data?.instantWalkIns?.length || 0);

  const pendingMore = useShowMore(data?.pending || []);
  const assessableMore = useShowMore(data?.assessable || []);
  const timelineMore = useShowMore(data?.todayQueue || []);
  const insightsMore = useShowMore(data?.insights || []);
  const categoriesMore = useShowMore(data?.categories || []);

  const walkInEntries = useMemo(
    () => [
      ...(data?.directRequestsActive || []).map((request) => ({ kind: "request" as const, request })),
      ...(data?.instantWalkIns || []).map((appt) => ({ kind: "legacy-instant" as const, appt })),
    ],
    [data?.directRequestsActive, data?.instantWalkIns],
  );
  const walkInMore = useShowMore(walkInEntries);

  const displayName = useMemo(
    () => formatPhysioDisplayName(data?.profileName || "", data?.clinicName),
    [data?.profileName, data?.clinicName],
  );

  const clinicLabel = useMemo(
    () => formatClinicName(data?.clinicName || "CorpErgo Clinic"),
    [data?.clinicName],
  );

  return (
    <div className="relative space-y-8 pb-8">
      {/* 1. Greeting */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="text-sm font-semibold text-[var(--ink-soft)]">
          {greeting(now.getHours())},
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-[2rem]">
          {loading ? <Skeleton className="h-9 w-48 max-w-full rounded-xl" /> : displayName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black ring-1 ring-black/10">
            <Stethoscope className="h-3.5 w-3.5" />
            {loading ? "Clinic" : clinicLabel}
          </span>
          <span className="text-sm text-[var(--ink-soft)]">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
          {[
            { label: "Patients today", value: data?.counts.today ?? 0 },
            { label: "Waiting / QR", value: data?.counts.waiting ?? 0 },
            { label: "Login requests", value: data?.counts.pending ?? 0 },
            { label: "Walk-in waiting", value: walkInCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-black/[0.06] bg-[var(--ivory)] px-3 py-3 text-center sm:text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                {item.label}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--ink)]">
                {loading ? <Skeleton className="mx-auto h-8 w-10 rounded-lg sm:mx-0" /> : item.value}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={openInstantBooking}
            className="col-span-2 rounded-2xl border border-[var(--saffron)]/40 bg-[var(--saffron-light)] px-3 py-3 text-left transition hover:bg-[var(--saffron)]/20 sm:col-span-1"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--saffron-deep)]">
              <PhoneCall className="h-3.5 w-3.5" />
              Instant booking
            </div>
            <div className="mt-1 text-sm font-extrabold text-[var(--ink)]">Phone walk-in</div>
            <div className="mt-0.5 text-[10px] font-semibold text-[var(--ink-soft)]">
              Create account & start
            </div>
          </button>
        </div>
      </motion.section>

      {/* 2. Pending (login) + Direct booking */}
      <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="min-w-0 rounded-[28px] border border-black/[0.06] bg-[var(--ivory)]/50 p-4 sm:p-5">
          <SectionHeader
            eyebrow="Patient portal"
            title="Pending bookings"
            href="/physio/requests"
            linkLabel="Open inbox"
          />
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
              </>
            ) : (data?.pending || []).length ? (
              <>
                {pendingMore.visible.map((appt) => (
                  <PendingBookingCard key={appt.id} appt={appt} />
                ))}
                <ShowMoreButton
                  hiddenCount={pendingMore.hiddenCount}
                  expanded={pendingMore.expanded}
                  onClick={pendingMore.toggle}
                />
              </>
            ) : (
              <EmptyPanel
                title="No login bookings pending"
                body="When patients book through the portal, their requests appear here."
              />
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-[28px] border border-[var(--saffron)]/25 bg-[var(--saffron-light)]/40 p-4 sm:p-5">
          <SectionHeader
            eyebrow="Walk-in"
            title="Walk-in patients"
            href="/physio/requests"
            hash="direct"
            linkLabel="Direct inbox"
          />
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
              </>
            ) : walkInEntries.length ? (
              <>
                {walkInMore.visible.map((entry) =>
                  entry.kind === "legacy-instant" ? (
                    <InstantWalkInCard key={entry.appt.id} appt={entry.appt} />
                  ) : (
                    <DirectBookingCard key={entry.request.id} request={entry.request} />
                  ),
                )}
                <ShowMoreButton
                  hiddenCount={walkInMore.hiddenCount}
                  expanded={walkInMore.expanded}
                  onClick={walkInMore.toggle}
                />
              </>
            ) : (
              <EmptyPanel
                title="No walk-in patients waiting"
                body="Phone and web walk-in leads appear here until the session is completed."
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. Ready to scan */}
      <section>
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
            Scan the patient QR on arrival to check them in and start the session.
          </p>
          <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-white/90">
            Open scanner <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* 4. Ready to document + Today's timeline */}
      <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="min-w-0 rounded-[28px] border border-black/[0.06] bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader
            eyebrow="Assessments"
            title="Ready to document"
            href="/physio/assessments"
            linkLabel="View all"
          />
          <ul className="space-y-2.5">
            {loading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : (data?.assessable || []).length ? (
              <>
                {assessableMore.visible.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/physio/assessments/$appointmentId"
                      params={{ appointmentId: a.id }}
                      className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-[var(--ivory)] px-3 py-3 transition hover:bg-white"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--pink-main)]/10 text-[10px] font-bold text-[var(--pink-main)]">
                        {initials(patientName(a))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-[var(--ink)]">{patientName(a)}</div>
                        <div className="truncate text-[11px] text-[var(--ink-soft)]">
                          {a.physiotherapy_categories?.name || "Visit"} · {visitTimeLabel(a)}
                        </div>
                      </div>
                      <StatusBadge status="checked_in" />
                    </Link>
                  </li>
                ))}
                <ShowMoreButton
                  hiddenCount={assessableMore.hiddenCount}
                  expanded={assessableMore.expanded}
                  onClick={assessableMore.toggle}
                />
              </>
            ) : (
              <EmptyPanel
                title="Nothing to document"
                body="Checked-in visits waiting for clinical notes will appear here."
              />
            )}
          </ul>
        </div>

        <div className="min-w-0 rounded-[28px] border border-black/[0.06] bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader eyebrow="Schedule" title="Today's timeline" />
          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </>
            ) : (data?.todayQueue || []).length ? (
              <>
                {timelineMore.visible.map((a) => {
                  const done = isVisitDocumented(a, assessedIds);
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                        done
                          ? "border-[var(--saffron)]/20 bg-[var(--saffron-light)]/40 text-[var(--ink-soft)]"
                          : "border-black/[0.05] bg-[var(--ivory)] text-[var(--ink)]",
                      )}
                    >
                      <div className="w-12 shrink-0 text-sm font-extrabold">{visitTimeLabel(a)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{patientName(a)}</div>
                        <div className="truncate text-[11px] text-[var(--ink-soft)]">
                          {a.physiotherapy_categories?.name || "Visit"}
                        </div>
                      </div>
                      <StatusBadge status={done ? "completed" : "checked_in"} />
                    </div>
                  );
                })}
                <ShowMoreButton
                  hiddenCount={timelineMore.hiddenCount}
                  expanded={timelineMore.expanded}
                  onClick={timelineMore.toggle}
                />
              </>
            ) : (
              <EmptyPanel
                title="No visits scheduled today"
                body="Accepted and checked-in appointments will line up here by time."
              />
            )}
          </div>
        </div>
      </section>

      {/* 5. Clinical insights */}
      <section className="rounded-[28px] border border-black/[0.06] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--saffron-deep)]" />
          <h2 className="text-xl font-extrabold text-[var(--ink)]">Clinical insights</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {insightsMore.visible.map((ins) => (
            <div
              key={ins.id}
              className={cn(
                "rounded-[20px] border p-4",
                ins.tone === "warn"
                  ? "border-[var(--saffron)]/40 bg-[var(--saffron-light)]"
                  : ins.tone === "good"
                    ? "border-black/10 bg-neutral-50"
                    : "border-black/10 bg-[var(--ivory)]",
              )}
            >
              <div className="text-sm font-extrabold text-[var(--ink)]">{ins.title}</div>
              <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{ins.detail}</div>
            </div>
          ))}
          {!loading && !(data?.insights || []).length ? (
            <EmptyPanel title="Quiet floor" body="Insights appear as today's list fills up." />
          ) : null}
        </div>
        <ShowMoreButton
          hiddenCount={insightsMore.hiddenCount}
          expanded={insightsMore.expanded}
          onClick={insightsMore.toggle}
        />
        {(data?.categories || []).length > 0 ? (
          <div className="mt-5 border-t border-black/[0.06] pt-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              Treatment mix today
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoriesMore.visible.map((c) => (
                <div
                  key={c.name}
                  className="rounded-2xl border border-black/[0.06] bg-[var(--ivory)] px-4 py-2"
                >
                  <div className="text-xs text-[var(--ink-soft)]">{c.name}</div>
                  <div className="text-lg font-extrabold text-[var(--ink)]">{c.count}</div>
                </div>
              ))}
            </div>
            <ShowMoreButton
              hiddenCount={categoriesMore.hiddenCount}
              expanded={categoriesMore.expanded}
              onClick={categoriesMore.toggle}
              className="mt-3"
            />
          </div>
        ) : null}
      </section>

      {/* 6. Block time */}
      {staffClinicId ? (
        <ClinicSlotManager clinicId={staffClinicId} clinicName={clinicLabel} />
      ) : null}

      {/* 7. Payments */}
      <ClinicPaymentsTracker
        clinicId={
          staffClinicId ||
          data?.todayQueue[0]?.clinic_id ||
          data?.pending[0]?.clinic_id ||
          data?.directRequests[0]?.clinic_id ||
          undefined
        }
        clinicName={clinicLabel}
      />
    </div>
  );
}
