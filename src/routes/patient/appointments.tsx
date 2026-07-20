import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import {
  cancelAppointment,
  fetchMyAppointments,
  formatDateLabel,
  formatTimeLabel,
  type Appointment,
} from "@/lib/clinic-data";

export const Route = createFileRoute("/patient/appointments")({
  component: MyAppointmentsPage,
});

const FILTERS = ["all", "pending", "accepted", "completed", "cancelled", "rejected"] as const;

function MyAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const { data, error } = await fetchMyAppointments();
    if (error) toast.error(error);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.status === filter)),
    [items, filter],
  );

  async function onCancel(id: string) {
    const reason = window.prompt("Optional: why are you cancelling?");
    if (reason === null) return;
    const { error } = await cancelAppointment(id, reason || "Cancelled by patient");
    if (error) toast.error(error);
    else {
      toast.success("Appointment cancelled");
      void reload();
    }
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Appointments"
        title="My appointments"
        description="Track pending, confirmed, completed, and cancelled visits in one place."
        actions={
          <Link
            to="/patient/book"
            className="rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white"
          >
            Book new
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              filter === f
                ? "bg-[var(--sage)] text-white"
                : "bg-white text-[var(--ink-soft)] ring-1 ring-black/5"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-white ring-1 ring-black/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments here"
          description="When you book a visit, it will show up with a clear status badge."
          action={
            <Link
              to="/patient/book"
              className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Book appointment
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {visible.map((a) => (
            <article
              key={a.id}
              className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--bronze)]">
                    {a.appointment_code}
                  </div>
                  <h3 className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                    {a.clinics?.name || "Clinic"}
                  </h3>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {a.physiotherapy_categories?.name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[var(--ink)]">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--bronze)]" />
                  {formatDateLabel(a.scheduled_date || a.preferred_date)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--bronze)]" />
                  {formatTimeLabel(a.scheduled_time || a.preferred_time)}
                </span>
                {a.clinics?.address ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--bronze)]" />
                    {a.clinics.address}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">{a.symptoms}</p>

              {a.status === "rejected" && a.rejection_reason ? (
                <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  Reason: {a.rejection_reason}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {a.status === "accepted" ? (
                  <Link
                    to="/patient/qr-ticket"
                    className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm font-bold text-white"
                  >
                    Open QR ticket
                  </Link>
                ) : null}
                {["pending", "accepted"].includes(a.status) ? (
                  <button
                    type="button"
                    onClick={() => void onCancel(a.id)}
                    className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-800"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
