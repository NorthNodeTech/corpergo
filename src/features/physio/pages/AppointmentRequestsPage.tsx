import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Check, PhoneCall, UserPlus, X } from "lucide-react";
import { PhoneAppIcon } from "@/shared/components/icons/BrandIcons";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { PortalPageHeader } from "@/shared/components/layout/PortalPageHeader";
import { ShowMoreButton, useShowMore } from "@/shared/components/layout/ShowMoreList";
import { StatusBadge } from "@/shared/components/layout/StatusBadge";
import { LoadingSpinner, LoadingState } from "@/shared/components/ui/loading-spinner";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  fetchCategories,
  formatDateLabel,
  formatTimeLabel,
  uniqueSlotTimes,
  type Category,
} from "@/lib/patient/clinic-data";
import {
  convertDirectBookingRequest,
  defaultDirectBookingCategory,
  defaultDirectBookingEmail,
  defaultDirectBookingPassword,
  directBookingSourceLabel,
  fetchDirectBookingRequests,
  filterActiveDirectRequests,
  updateDirectBookingRequest,
  type DirectBookingRequest,
  type DirectBookingStatus,
} from "@/lib/booking/direct-booking-data";
import { fetchMyProfile } from "@/lib/auth";
import {
  fetchLatestCompletedAppointmentId,
  fetchPatientCompletedVisitCount,
} from "@/lib/physio/assessment-data";
import { type VisitType } from "@/lib/patient/clinic-data";
import {
  acceptAppointment,
  fetchAvailableSlots,
  fetchClinicAppointments,
  fetchMyPhysioId,
  rejectAppointment,
  rescheduleAppointment,
  resolveStaffClinicId,
  type PhysioAppointment,
} from "@/lib/physio/physio-data";
import { cn, formatClinicName } from "@/lib/core/utils";

type ModalMode = "accept" | "reschedule" | null;
type InboxTab = "pending" | "direct" | "cancelled" | "rejected";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "direct", label: "Direct" },
  { id: "cancelled", label: "Cancelled" },
  { id: "rejected", label: "Rejected" },
];

function initialInboxTab(): InboxTab {
  if (typeof window === "undefined") return "pending";
  const requested =
    new URLSearchParams(window.location.search).get("tab") ||
    window.location.hash.replace(/^#/, "");
  return TABS.some((tab) => tab.id === requested) ? (requested as InboxTab) : "pending";
}

type InboxCounts = Record<InboxTab, number>;

function emptyInboxCounts(): InboxCounts {
  return { pending: 0, direct: 0, cancelled: 0, rejected: 0 };
}

export function AppointmentRequestsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InboxTab>(() => initialInboxTab());
  const [items, setItems] = useState<PhysioAppointment[]>([]);
  const [directItems, setDirectItems] = useState<DirectBookingRequest[]>([]);
  const [inboxCounts, setInboxCounts] = useState<InboxCounts>(() => emptyInboxCounts());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>("Clinic");
  const [active, setActive] = useState<PhysioAppointment | null>(null);
  const [activeDirect, setActiveDirect] = useState<DirectBookingRequest | null>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<
    { start_time: string; end_time: string; available: boolean; remaining_slots: number }[]
  >([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [convertEmail, setConvertEmail] = useState("");
  const [convertPassword, setConvertPassword] = useState("");
  const [convertDate, setConvertDate] = useState(todayIsoDate());
  const [convertTime, setConvertTime] = useState(currentTimeValue());
  const [convertCategoryId, setConvertCategoryId] = useState<string | null>(null);
  const [acceptVisitType, setAcceptVisitType] = useState<VisitType>("initial");
  const [priorVisitCount, setPriorVisitCount] = useState(0);
  const [priorAppointmentId, setPriorAppointmentId] = useState<string | null>(null);
  const [acceptPriorLoading, setAcceptPriorLoading] = useState(false);
  const itemsMore = useShowMore(items);

  useEffect(() => {
    itemsMore.collapse();
  }, [tab, itemsMore.collapse]);

  const reload = useCallback(
    async (activeTab: InboxTab = tab, options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);

      const [clinicId, me, profile, categoryRes, directRes] = await Promise.all([
        resolveStaffClinicId(),
        fetchMyPhysioId(),
        fetchMyProfile(),
        fetchCategories(),
        fetchDirectBookingRequests(),
      ]);

      const allRes = clinicId ? await fetchClinicAppointments(undefined, clinicId) : { data: [] };
      const all = allRes.data || [];
      const pending = all.filter((a) => a.status === "pending");
      const cancelled = all.filter((a) => a.status === "cancelled");
      const rejected = all.filter((a) => a.status === "rejected");
      const fetchedDirect = (directRes.data || []).filter(
        (req) => !clinicId || !req.clinic_id || req.clinic_id === clinicId,
      );
      const fetchedCategories = categoryRes.data || [];
      const activeDirect = filterActiveDirectRequests(fetchedDirect);

      setInboxCounts({
        pending: pending.length,
        cancelled: cancelled.length,
        rejected: rejected.length,
        direct: activeDirect.length,
      });
      setPhysioId(me.data?.[0]?.id || null);
      setCategories(fetchedCategories);
      setConvertCategoryId(
        (current) => current || defaultDirectBookingCategory(fetchedCategories),
      );

      if (activeTab === "direct") {
        setDirectItems(activeDirect);
        setItems([]);
      } else {
        const listByTab: Record<Exclude<InboxTab, "direct">, PhysioAppointment[]> = {
          pending,
          cancelled,
          rejected,
        };
        setItems(listByTab[activeTab]);
        setDirectItems(activeDirect);
      }

      const detectedClinic =
        pending[0]?.clinics?.name ||
        activeDirect[0]?.clinics?.name ||
        cancelled[0]?.clinics?.name ||
        rejected[0]?.clinics?.name ||
        profile.data?.full_name?.replace(/^(dr\.?|physio)\s*/i, "").trim() ||
        "Clinic";
      setClinicName(formatClinicName(detectedClinic));
      if (!options?.silent) setLoading(false);
    },
    [tab],
  );

  useEffect(() => {
    void reload(tab);
    const refresh = window.setInterval(() => {
      void reload(tab, { silent: true });
    }, 30_000);
    return () => window.clearInterval(refresh);
  }, [reload, tab]);

  useEffect(() => {
    const onHashChange = () => {
      const next = initialInboxTab();
      setTab(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectTab(next: InboxTab) {
    setTab(next);
    if (typeof window === "undefined") return;
    if (next === "direct") {
      window.history.replaceState(null, "", `${window.location.pathname}#direct`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

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
    setAcceptVisitType("initial");
    setPriorVisitCount(0);
    setPriorAppointmentId(null);
    setAcceptPriorLoading(true);
    void (async () => {
      const [countRes, latestRes] = await Promise.all([
        fetchPatientCompletedVisitCount(a.patient_id, a.id),
        fetchLatestCompletedAppointmentId(a.patient_id, a.id),
      ]);
      const count = countRes.data || 0;
      setPriorVisitCount(count);
      setPriorAppointmentId(latestRes.data);
      setAcceptVisitType(count > 0 ? "follow_up" : "initial");
      setAcceptPriorLoading(false);
    })();
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

  function openConvert(request: DirectBookingRequest) {
    setActiveDirect(request);
    setConvertEmail(defaultDirectBookingEmail(request));
    setConvertPassword(defaultDirectBookingPassword(request));
    setConvertDate(todayIsoDate());
    setConvertTime(currentTimeValue());
    setConvertCategoryId(defaultDirectBookingCategory(categories));
  }

  function closeConvert() {
    setActiveDirect(null);
    setConvertEmail("");
    setConvertPassword("");
    setConvertDate(todayIsoDate());
    setConvertTime(currentTimeValue());
  }

  async function onReject(a: PhysioAppointment) {
    const r = window.prompt("Rejection reason (required):");
    if (r === null) return;
    if (!r.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setBusy(true);
    const { error } = await rejectAppointment(a.id, a.patient_id, a.appointment_code, r);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Request rejected - patient notified");
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
      visitType: acceptVisitType,
      parentAppointmentId:
        acceptVisitType === "follow_up" ? priorAppointmentId : null,
    });
    setBusy(false);

    if (error) toast.error(error);
    else {
      toast.success("Accepted - QR ticket generated");
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
      toast.success("Rescheduled - patient notified");
      closeModal();
      void reload();
    }
  }

  async function updateDirectStatus(
    request: DirectBookingRequest,
    status: Extract<DirectBookingStatus, "called" | "ready_for_session">,
  ) {
    const now = new Date().toISOString();
    setBusy(true);
    const { error } = await updateDirectBookingRequest(request.id, {
      status,
      contacted_at: status === "called" ? now : request.contacted_at || now,
      ready_at: status === "ready_for_session" ? now : request.ready_at,
    });
    setBusy(false);

    if (error) toast.error(error);
    else {
      toast.success(status === "called" ? "Marked as called" : "Marked ready for session");
      void reload("direct");
    }
  }

  async function confirmConvertDirect() {
    if (!activeDirect) return;
    if (!convertDate || !convertTime) {
      toast.error("Choose session date and time.");
      return;
    }

    setBusy(true);
    const { data, error } = await convertDirectBookingRequest({
      requestId: activeDirect.id,
      email: convertEmail,
      password: convertPassword,
      categoryId: convertCategoryId,
      scheduledDate: convertDate,
      scheduledTime: convertTime,
    });
    setBusy(false);

    if (error || !data) {
      toast.error(error || "Could not create patient account.");
      return;
    }

    toast.success("Account created - opening assessment");
    closeConvert();
    await reload("direct");
    void navigate({
      to: "/physio/assessments/$appointmentId",
      params: { appointmentId: data.appointment_id },
    });
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow={`Inbox - ${clinicName}`}
        title="Appointment requests"
        description={
          tab === "direct"
            ? `Call walk-in patients (phone or web) and create an account only when the session starts.`
            : `Review pending bookings and track cancelled or rejected visits for ${clinicName}.`
        }
      />

      <div className="mb-6 portal-filter-row">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              tab === t.id
                ? "bg-[var(--saffron)] text-white"
                : "bg-white text-[var(--ink-soft)] ring-1 ring-black/5 hover:bg-[var(--ivory)]",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                tab === t.id ? "bg-white/20 text-white" : "bg-black/5 text-[var(--ink-soft)]",
              )}
            >
              {inboxCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading requests…" minHeight="min-h-[14rem]" />
      ) : tab === "direct" ? (
        <DirectRequestsList
          items={directItems}
          busy={busy}
          onMarkCalled={(request) => void updateDirectStatus(request, "called")}
          onMarkReady={(request) => void updateDirectStatus(request, "ready_for_session")}
          onCreateAccount={openConvert}
        />
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
        <>
          <div className="grid gap-4">
            {itemsMore.visible.map((a) => {
            const name = a.patients?.profiles?.full_name || "Patient";
            return (
              <article
                key={a.id}
                className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
                      {a.appointment_code}
                    </div>
                    <h3 className="mt-1 text-xl font-extrabold text-[var(--ink)]">{name}</h3>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {a.physiotherapy_categories?.name} - {formatClinicName(a.clinics?.name || "Clinic")}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">{a.symptoms}</p>

                <div className="mt-3 text-sm font-semibold text-[var(--ink)]">
                  {tab === "cancelled" && a.cancelled_at
                    ? `Cancelled ${formatDateLabel(a.cancelled_at.slice(0, 10))}`
                    : `Requested ${formatDateLabel(a.preferred_date)}`}{" "}
                  - {formatTimeLabel(a.scheduled_time || a.preferred_time)}
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
                  <div className="mt-5 portal-card-actions portal-card-actions--stack">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openAccept(a)}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--saffron-deep)] transition-colors disabled:opacity-50 cursor-pointer"
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
          <ShowMoreButton
            hiddenCount={itemsMore.hiddenCount}
            expanded={itemsMore.expanded}
            onClick={itemsMore.toggle}
          />
        </>
      )}

      {mode === "accept" && active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">Accept appointment</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {active.patients?.profiles?.full_name} - {active.appointment_code}
            </p>

            <div className="mt-5 rounded-2xl bg-[var(--saffron-light)] px-4 py-4 ring-1 ring-[var(--saffron)]/20">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
                Patient requested time
              </p>
              <p className="mt-2 text-lg font-extrabold text-[var(--ink)]">
                {formatDateLabel(active.preferred_date)} - {formatTimeLabel(active.preferred_time)}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                Accepting confirms this slot and generates a QR ticket for the patient.
              </p>
            </div>

            {acceptPriorLoading ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <LoadingSpinner size="sm" />
                Checking patient history…
              </div>
            ) : priorVisitCount > 0 ? (
              <div className="mt-5 space-y-3 rounded-2xl bg-[var(--ivory)] px-4 py-4 ring-1 ring-black/5">
                <p className="text-sm font-bold text-[var(--ink)]">
                  Returning patient ({priorVisitCount} prior visit{priorVisitCount === 1 ? "" : "s"})
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  Same profile — choose whether this booking is a follow-up or a fresh assessment
                  session.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAcceptVisitType("follow_up")}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-left text-sm ring-1 transition-colors",
                      acceptVisitType === "follow_up"
                        ? "bg-[var(--saffron-light)] font-bold text-[var(--ink)] ring-[var(--saffron)]"
                        : "bg-white text-[var(--ink-soft)] ring-black/5 hover:ring-black/10",
                    )}
                  >
                    <span className="block font-extrabold text-[var(--ink)]">Follow-up session</span>
                    <span className="mt-1 block text-xs">
                      Continue care on the same profile. Previous assessments stay read-only.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcceptVisitType("initial")}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-left text-sm ring-1 transition-colors",
                      acceptVisitType === "initial"
                        ? "bg-[var(--saffron-light)] font-bold text-[var(--ink)] ring-[var(--saffron)]"
                        : "bg-white text-[var(--ink-soft)] ring-black/5 hover:ring-black/10",
                    )}
                  >
                    <span className="block font-extrabold text-[var(--ink)]">New assessment</span>
                    <span className="mt-1 block text-xs">
                      Treat as a new evaluation while keeping all history on this account.
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

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
                disabled={busy || acceptPriorLoading}
                onClick={() => void confirmAccept()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Accepting…
                  </>
                ) : (
                  "Confirm accept"
                )}
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
              {active.patients?.profiles?.full_name} - {active.appointment_code}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Originally requested {formatDateLabel(active.preferred_date)} -{" "}
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
                            ? "bg-[var(--saffron)] text-white ring-[var(--saffron)]"
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Saving…
                  </>
                ) : (
                  "Confirm reschedule"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeDirect ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-extrabold text-[var(--ink)]">Create patient account</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {activeDirect.full_name} - {activeDirect.request_code}
            </p>

            <div className="mt-4 rounded-2xl bg-[var(--ivory)] px-4 py-3 text-xs text-[var(--ink-soft)] ring-1 ring-black/5">
              Give these credentials to the patient after creation. They can use them next time to
              view assessments and reports.
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold">
                Email / login id
                <input
                  type="email"
                  value={convertEmail}
                  onChange={(e) => setConvertEmail(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-semibold">
                Temporary password
                <input
                  type="text"
                  value={convertPassword}
                  onChange={(e) => setConvertPassword(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-semibold">
                Category
                <select
                  value={convertCategoryId || ""}
                  onChange={(e) => setConvertCategoryId(e.target.value || null)}
                  className={fieldClass}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Session date
                  <input
                    type="date"
                    value={convertDate}
                    onChange={(e) => setConvertDate(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Session time
                  <input
                    type="time"
                    value={convertTime}
                    onChange={(e) => setConvertTime(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConvert}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmConvertDirect()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {busy ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Creating…
                  </>
                ) : (
                  "Create account & start"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DirectRequestsList({
  items,
  busy,
  onMarkCalled,
  onMarkReady,
  onCreateAccount,
}: {
  items: DirectBookingRequest[];
  busy: boolean;
  onMarkCalled: (request: DirectBookingRequest) => void;
  onMarkReady: (request: DirectBookingRequest) => void;
  onCreateAccount: (request: DirectBookingRequest) => void;
}) {
  const listMore = useShowMore(items);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={PhoneCall}
        title="No direct requests waiting"
        description="Active walk-in leads appear here. Completed sessions move to the workspace completed section."
      />
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {listMore.visible.map((request) => (
        <article
          key={request.id}
          className="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
                {request.request_code}
              </div>
              <h3 className="mt-1 text-xl font-extrabold text-[var(--ink)]">{request.full_name}</h3>
              <p className="text-sm text-[var(--ink-soft)]">{formatClinicName(request.clinics?.name || "Clinic")}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--saffron-deep)]">
                {directBookingSourceLabel(request.booking_source)}
              </p>
            </div>
            <DirectStatusBadge status={request.status} />
          </div>

          <div className="mt-4 grid gap-2 text-sm text-[var(--ink)] sm:grid-cols-2">
            <div className="flex items-center gap-2 font-semibold">
              <PhoneAppIcon className="h-4 w-4" />
              <a href={`tel:${request.phone}`} className="hover:underline">
                {request.phone}
              </a>
            </div>
            <div className="font-semibold">Requested {formatDateTimeLabel(request.created_at)}</div>
          </div>

          <div className="mt-5 portal-card-actions portal-card-actions--stack">
            {request.status === "new" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onMarkCalled(request)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <PhoneCall className="h-4 w-4" /> Mark called
              </button>
            ) : null}

            {request.status === "called" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onMarkReady(request)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Ready for session
              </button>
            ) : null}

            {request.status === "ready_for_session" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCreateAccount(request)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--pink-main)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" /> Create account & start
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
  );
}

function DirectStatusBadge({ status }: { status: DirectBookingStatus }) {
  const styles: Record<DirectBookingStatus, string> = {
    new: "bg-amber-50 text-amber-800 ring-amber-100",
    called: "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/20",
    ready_for_session: "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/20",
    converted: "bg-[var(--saffron)]/10 text-[var(--saffron-deep)] ring-[var(--saffron)]/20",
    closed: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const labels: Record<DirectBookingStatus, string> = {
    new: "New",
    called: "Called",
    ready_for_session: "Ready",
    converted: "Account created",
    closed: "Closed",
  };

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", styles[status])}>
      {labels[status]}
    </span>
  );
}

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const fieldClass =
  "mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]";
