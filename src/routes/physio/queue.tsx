import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ScanLine, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/portal/EmptyState";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatTimeLabel } from "@/lib/clinic-data";
import {
  ageFromDob,
  fetchTodayQueue,
  setConsultationStatus,
  type PhysioAppointment,
} from "@/lib/physio-data";

export const Route = createFileRoute("/physio/queue")({
  component: TodayQueuePage,
});

function TodayQueuePage() {
  const [items, setItems] = useState<PhysioAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    const { data, error } = await fetchTodayQueue();
    if (error) toast.error(error);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const groups = useMemo(() => {
    return {
      waiting: items.filter((a) => a.status === "checked_in"),
      accepted: items.filter((a) => a.status === "accepted"),
      completed: items.filter((a) => a.status === "completed"),
    };
  }, [items]);

  async function complete(id: string) {
    setBusy(true);
    const { error } = await setConsultationStatus(id, "completed");
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Visit completed");
      void reload();
    }
  }

  function QueueSection({
    title,
    list,
    empty,
    actions,
  }: {
    title: string;
    list: PhysioAppointment[];
    empty: string;
    actions?: (a: PhysioAppointment) => React.ReactNode;
  }) {
    return (
      <section className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
        <h2 className="text-lg font-extrabold text-[var(--ink)]">
          {title}{" "}
          <span className="text-sm font-semibold text-[var(--ink-soft)]">({list.length})</span>
        </h2>
        {list.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{empty}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {list.map((a) => (
              <li key={a.id} className="rounded-2xl bg-[var(--ivory)] px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[var(--ink)]">
                      {a.patients?.profiles?.full_name || a.appointment_code}
                      {ageFromDob(a.patients?.date_of_birth) != null
                        ? ` · ${ageFromDob(a.patients?.date_of_birth)} yrs`
                        : ""}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)]">
                      {formatTimeLabel(a.scheduled_time || a.preferred_time)} ·{" "}
                      {a.physiotherapy_categories?.name}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions(a)}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Floor"
        title="Today’s queue"
        description="Scan the patient QR on arrival, then continue to assessment from the waiting list."
        actions={
          <Link
            to="/physio/scan"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-soft)]"
          >
            <Camera className="h-4 w-4" /> Scan QR
          </Link>
        }
      />

      <Link
        to="/physio/scan"
        className="mb-6 flex items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[var(--sage-deep)] via-[var(--sage)] to-[#6F9E9C] p-5 text-white shadow-[var(--shadow-soft)]"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
          <ScanLine className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-extrabold">Patient arrived?</div>
          <div className="text-sm text-white/85">
            Tap to open camera and scan their QR ticket for check-in.
          </div>
        </div>
        <Camera className="h-6 w-6 text-white/80" />
      </Link>

      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl bg-white" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Queue is clear"
          description="Accepted appointments for today will appear here. Scan a QR ticket when patients arrive."
          action={
            <Link
              to="/physio/scan"
              className="rounded-full bg-[var(--sage)] px-5 py-2.5 text-sm font-bold text-white"
            >
              Open scanner
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <QueueSection
            title="Waiting"
            list={groups.waiting}
            empty="No checked-in patients yet."
            actions={(a) => (
              <>
                <Link
                  to="/physio/assessments/$appointmentId"
                  params={{ appointmentId: a.id }}
                  className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800"
                >
                  Open assessment
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void complete(a.id)}
                  className="rounded-full bg-[var(--sage)] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Complete
                </button>
              </>
            )}
          />
          <QueueSection
            title="Accepted (not checked in)"
            list={groups.accepted}
            empty="No accepted visits waiting for arrival."
            actions={() => (
              <Link
                to="/physio/scan"
                className="rounded-full bg-[var(--sage)]/10 px-3 py-1.5 text-xs font-bold text-[var(--sage-deep)]"
              >
                Scan to check in
              </Link>
            )}
          />
          <QueueSection
            title="Completed"
            list={groups.completed}
            empty="No completed visits yet today."
          />
        </div>
      )}
    </div>
  );
}
