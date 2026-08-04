import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  FileText,
  QrCode,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { fetchMyProfile } from "@/lib/auth";
import {
  fetchMyAppointments,
  fetchMyNotifications,
  fetchMyPatient,
  formatDateLabel,
  formatTimeLabel,
  type Appointment,
  type NotificationRow,
} from "@/lib/clinic-data";
import { isPatientIntakeComplete, normalizePatient } from "@/lib/patient-intake";

export const Route = createFileRoute("/patient/dashboard")({
  component: PatientDashboardPage,
});

function CareSnapshot({
  loading,
  upcoming,
  pending,
  confirmed,
  alerts,
}: {
  loading: boolean;
  upcoming: number;
  pending: number;
  confirmed: number;
  alerts: number;
}) {
  const metrics = [
    { label: "Upcoming", value: String(upcoming), icon: Calendar, text: "text-[#E11D48]", iconBg: "bg-[#FFE4E6]" },
    { label: "Pending", value: String(pending), icon: Clock, text: "text-[#E65100]", iconBg: "bg-[#FFE0B2]" },
    { label: "Confirmed", value: String(confirmed), icon: CheckCircle2, text: "text-[#6D28D9]", iconBg: "bg-[#F3E8FF]" },
    { label: "Alerts", value: String(alerts), icon: Bell, text: "text-[#C94B7C]", iconBg: "bg-[#FDE8EF]" },
  ];

  return (
    <div className="mb-6">
      <div className="mb-3.5 flex items-end justify-between gap-3 px-1">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--bronze)]">
            Care snapshot
          </div>
          <div className="mt-0.5 text-sm font-semibold text-[var(--ink-soft)]">
            Your visits at a glance
          </div>
        </div>
        <Link
          to="/patient/appointments"
          className="shrink-0 text-xs font-bold text-[var(--sage-deep)] hover:underline"
        >
          Details
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-4">
        {metrics.map(({ label, value, icon: Icon, text, iconBg }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className="flex flex-col items-center justify-center p-1 sm:p-4 text-center transition-transform hover:-translate-y-0.5"
          >
            <div className={`mb-2 sm:mb-3 grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl shadow-sm ${iconBg} ${text}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className={`text-xl sm:text-3xl font-extrabold tracking-tight ${text}`}>
              {loading ? "." : value}
            </div>
            <div className="mt-1 text-[8px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-[var(--ink-soft)] leading-tight break-words">
              {label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PatientDashboardPage() {
  const [name, setName] = useState("there");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [profileRes, apptRes, notifRes, patientRes] = await Promise.all([
        fetchMyProfile(),
        fetchMyAppointments(),
        fetchMyNotifications(6),
        fetchMyPatient(),
      ]);
      if (cancelled) return;
      if (profileRes.data?.full_name) setName(profileRes.data.full_name.split(" ")[0]);
      if (apptRes.error) setError(apptRes.error);
      else setAppointments(apptRes.data || []);
      setNotifications(notifRes.data || []);
      if (patientRes.data?.[0]) {
        setProfileIncomplete(!isPatientIntakeComplete(normalizePatient(patientRes.data[0])));
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => ["pending", "accepted", "checked_in"].includes(a.status))
        .sort((a, b) => {
          const da = a.scheduled_date || a.preferred_date;
          const db = b.scheduled_date || b.preferred_date;
          return da.localeCompare(db);
        }),
    [appointments],
  );

  const recentVisits = useMemo(
    () => appointments.filter((a) => a.status === "completed").slice(0, 4),
    [appointments],
  );

  const followUp = upcoming.find((a) => a.status === "accepted") || upcoming[0];
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const acceptedCount = appointments.filter((a) => a.status === "accepted").length;

  return (
    <div>
      <PortalPageHeader
        hideBack={true}
        eyebrow="Patient dashboard"
        title={`Welcome back, ${name}`}
        description="Here’s what’s next for your recovery — appointments, updates, and quick actions."
        actions={
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-orange)] px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all"
          >
            Book appointment <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {error ? (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
          {error}
        </div>
      ) : null}

      {profileIncomplete ? (
        <Link
          to="/patient/profile"
          className="mb-6 flex flex-col gap-2 rounded-3xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="font-extrabold text-amber-950">Complete your health profile</div>
            <div className="text-sm text-amber-900/80">
              Fill personal details, emergency contact, and medical history before your first visit.
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-950">
            Open profile <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : null}

      <CareSnapshot
        loading={loading}
        upcoming={upcoming.length}
        pending={pendingCount}
        confirmed={acceptedCount}
        alerts={notifications.length}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex h-8 items-center justify-between gap-3 px-1">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Upcoming appointment</h2>
            <Link
              to="/patient/appointments"
              className="text-sm font-semibold text-[var(--sage-deep)] hover:underline self-end"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="h-44 animate-pulse rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm" />
          ) : followUp ? (
            <div className="rounded-3xl bg-[var(--card)] p-5 sm:p-6 shadow-sm border border-[var(--border)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-extrabold text-[var(--ink)]">
                    {followUp.clinics?.name || "Clinic"}
                  </div>
                  <div className="mt-1 text-sm text-[var(--ink-soft)]">
                    {followUp.physiotherapy_categories?.name || "Physiotherapy"}
                  </div>
                </div>
                <StatusBadge status={followUp.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[var(--ink)]">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--accent-orange)]" />
                  {formatDateLabel(followUp.scheduled_date || followUp.preferred_date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent-orange)]" />
                  {formatTimeLabel(followUp.scheduled_time || followUp.preferred_time)}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">{followUp.symptoms}</p>
              {followUp.status === "accepted" ? (
                <Link
                  to="/patient/qr-ticket"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline"
                >
                  <QrCode className="h-4 w-4" /> Open QR ticket
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl bg-[var(--card)] p-6 flex flex-col items-center justify-center min-h-[12rem] shadow-sm border border-[var(--border)]">
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming visits"
                description="Book a session at any of our five Bengaluru clinics in under two minutes."
                className="bg-transparent border-0 ring-0 shadow-none py-4 px-0"
                action={
                  <Link
                    to="/patient/book"
                    className="rounded-full bg-[var(--accent-orange)] hover:brightness-110 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors"
                  >
                    Book now
                  </Link>
                }
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex h-8 items-center gap-2 px-1">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Quick actions</h2>
          </div>
          <div className="grid gap-3">
            {[
              {
                to: "/patient/book" as const,
                label: "Book appointment",
                desc: "Choose clinic & time",
                icon: CalendarPlus,
                iconBg: "bg-[#FFE4E6]",
                iconColor: "text-[#E11D48]",
              },
              {
                to: "/patient/appointments" as const,
                label: "My appointments",
                desc: "Track every visit",
                icon: Calendar,
                iconBg: "bg-[#FFE0B2]",
                iconColor: "text-[#E65100]",
              },
              {
                to: "/patient/qr-ticket" as const,
                label: "QR check-in",
                desc: "Show at reception",
                icon: QrCode,
                iconBg: "bg-[#FFFDE6]",
                iconColor: "text-[#B58900]",
              },
              {
                to: "/patient/reports" as const,
                label: "Medical reports",
                desc: "Assessments & notes",
                icon: FileText,
                iconBg: "bg-[#F3E8FF]",
                iconColor: "text-[#6D28D9]",
              },
            ].map(({ to, label, desc, icon: Icon, iconBg, iconColor }) => (
              <Link
                key={to}
                to={to}
                className="rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3.5 p-4 transition-transform hover:-translate-y-1 hover:shadow-md shadow-sm"
              >
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl shadow-sm", iconBg, iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[var(--ink)]">{label}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ink-soft)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex h-8 items-center gap-2 px-1">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Recent visits</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
              ))}
            </div>
          ) : recentVisits.length === 0 ? (
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] flex h-32 flex-col items-center justify-center text-center p-5 shadow-sm">
              <p className="text-sm font-bold text-[var(--ink)]">No recent visits</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                Completed visits will appear here after your sessions.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentVisits.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3 p-4 shadow-sm"
                >
                  <div>
                    <div className="font-bold text-[var(--ink)] text-sm sm:text-base">
                      {a.clinics?.name} · {a.physiotherapy_categories?.name}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)] mt-0.5">
                      {formatDateLabel(a.scheduled_date || a.preferred_date)}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex h-8 items-center gap-2 px-1">
            <Bell className="h-4 w-4 text-[var(--bronze)]" />
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] flex h-32 flex-col items-center justify-center text-center p-5 shadow-sm">
              <p className="text-sm font-semibold text-[var(--ink-soft)]">
                You’ll see appointment confirmations and reminders here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-sm"
                >
                  <div className="font-bold text-[var(--ink)] text-sm sm:text-base">{n.title}</div>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
