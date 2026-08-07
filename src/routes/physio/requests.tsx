import { createFileRoute } from "@tanstack/react-router";
import { Check, CalendarClock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Calendar } from "@/components/ui/calendar";
import {
  formatDateLabel,
  formatTimeLabel,
  uniqueSlotTimes,
} from "@/lib/clinic-data";
import { fetchMyProfile } from "@/lib/auth";
import {
  acceptAppointment,
  ageFromDob,
  fetchAvailableSlots,
  fetchClinicAppointments,
  fetchMyPhysioId,
  rejectAppointment,
  rescheduleAppointment,
  type PhysioAppointment,
} from "@/lib/physio-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/physio/requests")({
  component: AppointmentRequestsPage,
});

type ModalMode = "accept" | "reschedule" | null;
type InboxTab = "pending" | "cancelled" | "rejected";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
  { id: "rejected", label: "Rejected" },
];

function AppointmentRequestsPage() {
  const [tab, setTab] = useState<InboxTab>("pending");
  const [items, setItems] = useState<PhysioAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>("Clinic");
  const [active, setActive] = useState<PhysioAppointment | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<
    { start_time: string; end_time: string; available: boolean; remaining_slots: number }[]
  >([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload(activeTab: InboxTab = tab) {
    setLoading(true);
    const [listRes, me, profile] = await Promise.all([
      fetchClinicAppointments(activeTab),
      fetchMyPhysioId(),
      fetchMyProfile(),
    ]);
    const fetchedItems = listRes.data || [];
    setItems(fetchedItems);
    setPhysioId(me.data?.[0]?.id || null);

    const detectedClinic =
      fetchedItems[0]?.clinics?.name ||
      profile.data?.full_name?.replace(/^(dr\.?|physio)\s*/i, "").trim() ||
      "Clinic";
    setClinicName(detectedClinic.startsWith("CorpErgo") ? detectedClinic : `CorpErgo - ${detectedClinic}`);
    setLoading(false);
  }

  useEffect(() => {
    void reload(tab);
  }, [tab]);

  const dateIso = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;

  useEffect(() => {
    if (!active || !dateIso || mode !== "reschedule") {
      setSlots([]);
      return;
    }
    void fetchAvailableSlots(active.clinic_id, dateIso, {
      excludeAppointmentId: active.id,
    }).then((res) => {
      setSlots(uniqueSlotTimes(res.data || []));
    });
  }, [active, dateIso, mode]);

  function openAccept(a: PhysioAppointment) {
    setActive(a);
    setMode("accept");
    setReason("");
    setDate(undefined);
    setTime(null);
  }

  function openReschedule(a: PhysioAppointment) {
    setActive(a);
    setMode("reschedule");
    setReason("");
    setDate(undefined);
    setTime(null);
  }

  function closeModal() {
    setMode(null);
    setActive(null);
    setDate(undefined);
    setTime(null);
    setReason("");
  }

  async function onReject(a: PhysioAppointment) {
    const r = window.prompt("Rejection reason (required):");
    if (r === null) return;
    if (!r.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setBusy(true);
    const { error } = await rejectAppointment(
      a.id,
      a.patient_id,
      a.appointment_code,
      r,
    );
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Request rejected — patient notified");
      void reload();
    }
  }

  async function confirmAccept() {
    if (!active) return;

    let pId = physioId;
    if (!pId) {
      const me = await fetchMyPhysioId();
      pId = me.data?.[0]?.id || null;
    }
    if (!pId) {
      toast.error("Could not resolve physiotherapist profile.");
      return;
    }

    setBusy(true);
    const { error } = await acceptAppointment({
      appointmentId: active.id,
      physiotherapistId: pId,
      scheduledDate: active.preferred_date,
      scheduledTime: active.preferred_time.slice(0, 5),
      clinicId: active.clinic_id,
    });
    setBusy(false);

    if (error) toast.error(error);
    else {
      toast.success("Accepted — QR ticket generated");
      closeModal();
      void reload();
    }
  }

  async function confirmReschedule() {
    if (!active || !dateIso || !time) {
      toast.error("Choose a new date and time");
      return;
    }

    let pId = physioId;
    if (!pId) {
      const me = await fetchMyPhysioId();
      pId = me.data?.[0]?.id || null;
    }
    if (!pId) {
      toast.error("Could not resolve physiotherapist profile.");
      return;
    }

    setBusy(true);
    const { error } = await rescheduleAppointment({
      appointmentId: active.id,
      patientId: active.patient_id,
      appointmentCode: active.appointment_code,
      physiotherapistId: pId,
      scheduledDate: dateIso,
      scheduledTime: time,
      reason: reason.trim() || "Rescheduled by clinic",
      clinicId: active.clinic_id,
    });
    setBusy(false);

    if (error) toast.error(error);
    else {
      toast.success("Rescheduled — patient notified");
      closeModal();
      void reload();
    }
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow={`Inbox · ${clinicName}`}
        title="Appointment requests"
        description={`Review pending bookings and track cancelled or rejected visits for ${clinicName}.`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              tab === t.id
                ? "bg-[var(--sage)] text-white"
                : "bg-white text-[var(--ink-soft)] ring-1 ring-black/5 hover:bg-[var(--ivory)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={
            tab === "pending"
              ? "No pending requests"
              : tab === "cancelled"
                ? "No cancelled appointments"
                : "No rejected appointments"
          }
          description={
            tab === "pending"
              ? "New patient booking requests for your clinic will appear here."
              : tab === "cancelled"
                ? "When patients cancel visits, they will appear here so your team can follow up."
                : "Rejected booking requests will appear here."
          }
        />
      ) : (
        <div className="grid gap-4">
          {items.map((a) => {
            const name = a.patients?.profiles?.full_name || "Patient";
            const age = ageFromDob(a.patients?.date_of_birth);
            return (
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
                      {name}
                      {age != null ? (
                        <span className="ml-2 text-base font-semibold text-[var(--ink-soft)]">
                          · {age} yrs
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {a.physiotherapy_categories?.name} · {a.clinics?.name}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">{a.symptoms}</p>

                <div className="mt-3 text-sm font-semibold text-[var(--ink)]">
                  {tab === "cancelled" && a.cancelled_at
                    ? `Cancelled ${formatDateLabel(a.cancelled_at.slice(0, 10))}`
                    : `Requested ${formatDateLabel(a.preferred_date)}`}{" "}
                  · {formatTimeLabel(a.scheduled_time || a.preferred_time)}
                </div>

                {tab === "cancelled" && a.cancellation_reason ? (
                  <p className="mt-2 text-sm text-rose-700 bg-rose-50 rounded-xl px-3 py-2 ring-1 ring-rose-100">
                    Patient reason: {a.cancellation_reason}
                  </p>
                ) : null}

                {tab === "rejected" && a.rejection_reason ? (
                  <p className="mt-2 text-sm text-rose-700 bg-rose-50 rounded-xl px-3 py-2 ring-1 ring-rose-100">
                    Rejection reason: {a.rejection_reason}
                  </p>
                ) : null}

                {tab === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openAccept(a)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openReschedule(a)}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] ring-1 ring-black/5"
                  >
                    <CalendarClock className="h-4 w-4" /> Reschedule
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onReject(a)}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-800"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {mode === "accept" && active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">Accept appointment</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {active.patients?.profiles?.full_name} · {active.appointment_code}
            </p>

            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Patient requested time
              </p>
              <p className="mt-2 text-lg font-extrabold text-[var(--ink)]">
                {formatDateLabel(active.preferred_date)} ·{" "}
                {formatTimeLabel(active.preferred_time)}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Accepting confirms this slot and generates a QR ticket for the patient.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmAccept()}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Accepting…" : "Confirm accept"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "reschedule" && active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">Reschedule appointment</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {active.patients?.profiles?.full_name} · {active.appointment_code}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Originally requested {formatDateLabel(active.preferred_date)} ·{" "}
              {formatTimeLabel(active.preferred_time)}. Pick a new date and time below.
            </p>

            <div className="mt-4 flex justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setTime(null);
                }}
                disabled={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today || d.getDay() === 0;
                }}
                formatters={{
                  formatWeekdayName: (d) =>
                    d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
                }}
                className="std-calendar w-[300px]"
                classNames={{
                  root: "w-[300px]",
                  months: "flex w-full flex-col",
                  month: "flex w-full flex-col gap-3",
                  weekdays: "mb-1 grid w-full grid-cols-7",
                  weekday:
                    "flex h-8 w-full items-center justify-center text-[11px] font-semibold text-slate-500",
                  week: "mt-0 grid w-full grid-cols-7",
                  day: "h-9 w-full p-0 text-center",
                  today: "rounded-md bg-slate-100 font-semibold text-[var(--ink)]",
                  caption_label: "text-sm font-semibold text-[var(--ink)]",
                  button_previous: "rounded-md hover:bg-slate-100",
                  button_next: "rounded-md hover:bg-slate-100",
                }}
              />
            </div>

            {dateIso ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {slots.length === 0 ? (
                  <p className="col-span-3 text-center text-xs text-[var(--ink-soft)] py-2">
                    No available slots on this date.
                  </p>
                ) : (
                  slots.map((s) => (
                    <button
                      key={s.start_time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setTime(s.start_time)}
                      className={cn(
                        "rounded-2xl px-2 py-2.5 text-xs font-bold ring-1",
                        !s.available
                          ? "bg-slate-100 text-slate-400 line-through cursor-not-allowed"
                          : time === s.start_time
                            ? "bg-[var(--sage)] text-white ring-[var(--sage)]"
                            : "bg-[var(--ivory)] ring-black/5",
                      )}
                    >
                      {formatTimeLabel(s.start_time)}
                      {s.available && s.remaining_slots === 1 ? (
                        <span className="block text-[9px] font-normal opacity-80">1 left</span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-[var(--ink-soft)]">
                Select a date to see available times.
              </p>
            )}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reschedule note for the patient (optional)"
              className="mt-4 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-sm ring-1 ring-black/5"
              rows={3}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !time}
                onClick={() => void confirmReschedule()}
                className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Confirm reschedule"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
