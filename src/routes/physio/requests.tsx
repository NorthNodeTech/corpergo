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

function AppointmentRequestsPage() {
  const [items, setItems] = useState<PhysioAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [active, setActive] = useState<PhysioAppointment | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<
    { start_time: string; end_time: string; available: boolean; id?: string }[]
  >([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    const [pending, me] = await Promise.all([
      fetchClinicAppointments("pending"),
      fetchMyPhysioId(),
    ]);
    setItems(pending.data || []);
    setPhysioId(me.data?.[0]?.id || null);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const dateIso = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;

  useEffect(() => {
    if (!active || !dateIso || !mode) {
      setSlots([]);
      return;
    }
    void fetchAvailableSlots(active.clinic_id, dateIso).then((res) => {
      const raw = res.data || [];
      const times = uniqueSlotTimes(raw);
      setSlots(
        times.map((t) => {
          const match = raw.find(
            (s) => s.start_time.slice(0, 5) === t.start_time && s.is_available,
          );
          return { ...t, id: match?.id };
        }),
      );
    });
  }, [active, dateIso, mode]);

  function openAccept(a: PhysioAppointment) {
    setActive(a);
    setMode("accept");
    setReason("");
    const preferred = new Date(a.preferred_date + "T12:00:00");
    setDate(preferred);
    setTime(a.preferred_time.slice(0, 5));
    setSlotId(null);
  }

  function openReschedule(a: PhysioAppointment) {
    setActive(a);
    setMode("reschedule");
    setReason("");
    setDate(undefined);
    setTime(null);
    setSlotId(null);
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

  async function confirmModal() {
    if (!active || !physioId || !dateIso || !time) {
      toast.error("Choose date and time");
      return;
    }
    setBusy(true);
    if (mode === "accept") {
      const { error } = await acceptAppointment({
        appointmentId: active.id,
        physiotherapistId: physioId,
        scheduledDate: dateIso,
        scheduledTime: time,
        slotId: slotId || undefined,
      });
      setBusy(false);
      if (error) toast.error(error);
      else {
        toast.success("Accepted — QR ticket generated");
        setMode(null);
        setActive(null);
        void reload();
      }
      return;
    }

    if (mode === "reschedule") {
      const { error } = await rescheduleAppointment({
        appointmentId: active.id,
        patientId: active.patient_id,
        appointmentCode: active.appointment_code,
        physiotherapistId: physioId,
        scheduledDate: dateIso,
        scheduledTime: time,
        reason: reason || "Rescheduled by clinic",
        slotId: slotId || undefined,
      });
      setBusy(false);
      if (error) toast.error(error);
      else {
        toast.success("Rescheduled — patient notified");
        setMode(null);
        setActive(null);
        void reload();
      }
    }
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Inbox"
        title="Appointment requests"
        description="Review pending bookings for your clinic. Accept to generate a QR ticket, or reject with a reason."
      />

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No pending requests"
          description="New patient booking requests for your clinic will appear here."
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
                  Requested {formatDateLabel(a.preferred_date)} ·{" "}
                  {formatTimeLabel(a.preferred_time)}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !physioId}
                    onClick={() => openAccept(a)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
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
              </article>
            );
          })}
        </div>
      )}

      {mode && active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">
              {mode === "accept" ? "Accept & confirm slot" : "Reschedule appointment"}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {active.patients?.profiles?.full_name} · {active.appointment_code}
            </p>

            <div className="mt-4 flex justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setTime(null);
                  setSlotId(null);
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

            <div className="mt-4 grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s.start_time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => {
                    setTime(s.start_time);
                    setSlotId(s.id || null);
                  }}
                  className={cn(
                    "rounded-2xl px-2 py-2.5 text-xs font-bold ring-1",
                    !s.available
                      ? "bg-slate-100 text-slate-400 line-through"
                      : time === s.start_time
                        ? "bg-[var(--sage)] text-white ring-[var(--sage)]"
                        : "bg-[var(--ivory)] ring-black/5",
                  )}
                >
                  {formatTimeLabel(s.start_time)}
                </button>
              ))}
            </div>

            {mode === "reschedule" ? (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reschedule note for the patient"
                className="mt-4 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-sm ring-1 ring-black/5"
                rows={3}
              />
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setActive(null);
                }}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !time}
                onClick={() => void confirmModal()}
                className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
