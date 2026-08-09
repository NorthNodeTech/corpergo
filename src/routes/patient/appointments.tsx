import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { ShowMoreButton, useShowMore } from "@/components/portal/ShowMoreList";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { LoadingState } from "@/components/ui/loading-spinner";
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

const FILTERS = ["all", "pending", "accepted", "completed"] as const;
const QR_TICKET_STATUSES = new Set(["accepted", "checked_in"]);

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

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.status === filter)),
    [items, filter],
  );
  const listMore = useShowMore(filtered);

  useEffect(() => {
    listMore.collapse();
  }, [filter, listMore.collapse]);

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
        description="Track pending, confirmed, and completed visits. Cancelled and rejected appointments appear under All."
        actions={
          <Link
            to="/patient/book"
            className="rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white"
          >
            Book new
          </Link>
        }
      />

      <div className="mb-6 portal-filter-row">
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
        <LoadingState label="Loading appointments…" minHeight="min-h-[14rem]" />
      ) : filtered.length === 0 ? (
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
        <>
          <div className="grid gap-4">
            {listMore.visible.map((a) => (
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

              {a.status === "cancelled" ? (
                <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700">
                  This appointment was cancelled.
                </p>
              ) : null}
              {a.status === "rejected" ? (
                <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {a.rejection_reason ? `Reason: ${a.rejection_reason}` : "This appointment was rejected."}
                </p>
              ) : null}

              <div className="mt-4 portal-card-actions">
                {QR_TICKET_STATUSES.has(a.status) ? (
                  <Link
                    to="/patient/qr-ticket"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--sage)] px-4 py-2 text-sm font-bold text-white"
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
          <ShowMoreButton
            hiddenCount={listMore.hiddenCount}
            expanded={listMore.expanded}
            onClick={listMore.toggle}
          />
        </>
      )}
    </div>
  );
}
