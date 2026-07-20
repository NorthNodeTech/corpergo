import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { StatCard } from "@/components/portal/PortalShell";
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
        eyebrow="Patient dashboard"
        title={`Welcome back, ${name}`}
        description="Here’s what’s next for your recovery — appointments, updates, and quick actions."
        actions={
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-soft)] hover:bg-[var(--sage-deep)] transition-colors"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Upcoming"
          value={loading ? "…" : String(upcoming.length)}
          hint="Scheduled visits"
          icon={Calendar}
        />
        <StatCard
          label="Pending"
          value={loading ? "…" : String(pendingCount)}
          hint="Awaiting confirmation"
          icon={Clock}
        />
        <StatCard
          label="Confirmed"
          value={loading ? "…" : String(acceptedCount)}
          hint="Ready to visit"
          icon={CheckCircle2}
        />
        <StatCard
          label="Alerts"
          value={loading ? "…" : String(notifications.length)}
          hint="Recent updates"
          icon={Bell}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 rounded-3xl bg-white p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Upcoming appointment</h2>
            <Link
              to="/patient/appointments"
              className="text-sm font-semibold text-[var(--sage-deep)] hover:underline"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 h-36 animate-pulse rounded-2xl bg-[var(--ivory)]" />
          ) : followUp ? (
            <div className="mt-5 rounded-2xl bg-[var(--ivory)] p-5">
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
                  <Calendar className="h-4 w-4 text-[var(--bronze)]" />
                  {formatDateLabel(followUp.scheduled_date || followUp.preferred_date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--bronze)]" />
                  {formatTimeLabel(followUp.scheduled_time || followUp.preferred_time)}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-[var(--ink-soft)]">{followUp.symptoms}</p>
              {followUp.status === "accepted" ? (
                <Link
                  to="/patient/qr-ticket"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--sage-deep)]"
                >
                  <QrCode className="h-4 w-4" /> Open QR ticket
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming visits"
                description="Book a session at any of our five Bengaluru clinics in under two minutes."
                action={
                  <Link
                    to="/patient/book"
                    className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
                  >
                    Book now
                  </Link>
                }
              />
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-3xl bg-white p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
        >
          <h2 className="text-lg font-extrabold text-[var(--ink)]">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            {[
              {
                to: "/patient/book" as const,
                label: "Book appointment",
                desc: "Choose clinic & time",
                icon: CalendarPlus,
              },
              {
                to: "/patient/appointments" as const,
                label: "My appointments",
                desc: "Track every visit",
                icon: Calendar,
              },
              {
                to: "/patient/qr-ticket" as const,
                label: "QR check-in",
                desc: "Show at reception",
                icon: QrCode,
              },
              {
                to: "/patient/reports" as const,
                label: "Medical reports",
                desc: "Assessments & notes",
                icon: FileText,
              },
            ].map(({ to, label, desc, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-2xl bg-[var(--ivory)] px-4 py-3.5 transition-colors hover:bg-[var(--sage)]/10"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--sage-deep)] ring-1 ring-black/5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[var(--ink)]">{label}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ink-soft)]" />
              </Link>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <h2 className="text-lg font-extrabold text-[var(--ink)]">Recent visits</h2>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--ivory)]" />
              ))}
            </div>
          ) : recentVisits.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Completed visits will appear here after your sessions.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentVisits.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--ivory)] px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-[var(--ink)]">
                      {a.clinics?.name} · {a.physiotherapy_categories?.name}
                    </div>
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

        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--bronze)]" />
            <h2 className="text-lg font-extrabold text-[var(--ink)]">Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              You’ll see appointment confirmations and reminders here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-2xl bg-[var(--ivory)] px-4 py-3">
                  <div className="font-semibold text-[var(--ink)]">{n.title}</div>
                  <p className="mt-0.5 text-sm text-[var(--ink-soft)] line-clamp-2">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
