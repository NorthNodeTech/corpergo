import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  ensureSlotsGenerated,
  fetchBlockedTimes,
  fetchSlotsForClinicDate,
  formatTimeLabel,
  uniqueSlotTimes,
} from "@/lib/clinic-data";
import { blockClinicTimeSlot, unblockClinicTimeSlot } from "@/lib/physio-data";
import { cn } from "@/lib/utils";

interface ClinicSlotManagerProps {
  clinicId: string;
  clinicName?: string;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ClinicSlotManager({ clinicId, clinicName = "Clinic" }: ClinicSlotManagerProps) {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [slots, setSlots] = useState<
    { start_time: string; available: boolean; remaining_slots: number }[]
  >([]);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyTime, setBusyTime] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    await ensureSlotsGenerated();
    const [slotsRes, blockedRes] = await Promise.all([
      fetchSlotsForClinicDate(clinicId, selectedDate),
      fetchBlockedTimes(clinicId, selectedDate),
    ]);
    setSlots(uniqueSlotTimes(slotsRes.data || []));
    setBlockedSet(
      new Set((blockedRes.data || []).map((b) => b.start_time.slice(0, 5))),
    );
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, [clinicId, selectedDate]);

  const frozenCount = useMemo(() => blockedSet.size, [blockedSet]);

  async function toggleBlock(time: string, currentlyBlocked: boolean) {
    setBusyTime(time);
    const { error } = currentlyBlocked
      ? await unblockClinicTimeSlot(clinicId, selectedDate, time)
      : await blockClinicTimeSlot(clinicId, selectedDate, time);
    setBusyTime(null);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(currentlyBlocked ? "Time slot unblocked" : "Time slot blocked");
    void reload();
  }

  return (
    <div className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--saffron)]/10 text-[var(--saffron-deep)]">
              <Lock className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-extrabold text-[var(--ink)]">Block unavailable times</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Freeze slots at {clinicName} when staff are unavailable. Blocked times cannot be booked by
            patients or used for rescheduling.
          </p>
        </div>
        <div className="text-xs font-semibold text-[var(--ink-soft)]">
          {frozenCount} blocked on selected date
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
          Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            min={todayIso()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)] pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--ivory)]" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          No slots generated for this date yet. Try another day or check back shortly.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((s) => {
            const isBlocked = blockedSet.has(s.start_time);
            const isFull = !s.available && !isBlocked;
            const disabled = isFull || busyTime === s.start_time;

            return (
              <button
                key={s.start_time}
                type="button"
                disabled={disabled}
                onClick={() => void toggleBlock(s.start_time, isBlocked)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-xs font-bold ring-1 transition-colors",
                  isBlocked
                    ? "bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100 cursor-pointer"
                    : isFull
                      ? "bg-slate-100 text-slate-400 ring-transparent line-through cursor-not-allowed"
                      : "bg-[var(--ivory)] text-[var(--ink)] ring-black/5 hover:ring-[var(--saffron)] cursor-pointer",
                )}
                title={
                  isBlocked
                    ? "Click to unblock"
                    : isFull
                      ? "Fully booked — cannot block"
                      : "Click to block this time"
                }
              >
                {isBlocked ? (
                  <Lock className="h-3.5 w-3.5 mb-0.5" />
                ) : (
                  <Unlock className="h-3 w-3 mb-0.5 opacity-40" />
                )}
                {formatTimeLabel(s.start_time)}
                <span className="mt-0.5 text-[9px] font-normal opacity-80">
                  {isBlocked ? "Blocked" : isFull ? "Full" : `${s.remaining_slots} left`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-[var(--ink-soft)]">
        Tap a time to block or unblock it. Fully booked slots (2 patients already) cannot be manually
        blocked.
      </p>
    </div>
  );
}
