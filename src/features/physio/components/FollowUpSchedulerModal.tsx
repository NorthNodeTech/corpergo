import { CalendarDays, Clock3 } from "lucide-react";
import { Calendar } from "@/shared/components/ui/calendar";
import { LoadingSpinnerLabel } from "@/shared/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatDateLabel, formatTimeLabel } from "@/lib/patient/clinic-data";
import { cn } from "@/lib/core/utils";

export type FollowUpSlot = {
  start_time: string;
  available: boolean;
  remaining_slots?: number;
};

type FollowUpSchedulerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  clinicName?: string;
  followDate: Date | undefined;
  onFollowDateChange: (date: Date | undefined) => void;
  followTime: string | null;
  onFollowTimeChange: (time: string | null) => void;
  slots: FollowUpSlot[];
  slotsLoading: boolean;
  saving: boolean;
  onConfirm: () => void;
  onSkip: () => void;
};

export function nextBookableDate(from = new Date()) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

export function FollowUpSchedulerModal({
  open,
  onOpenChange,
  patientName,
  clinicName,
  followDate,
  onFollowDateChange,
  followTime,
  onFollowTimeChange,
  slots,
  slotsLoading,
  saving,
  onConfirm,
  onSkip,
}: FollowUpSchedulerModalProps) {
  const followIso = followDate
    ? `${followDate.getFullYear()}-${String(followDate.getMonth() + 1).padStart(2, "0")}-${String(followDate.getDate()).padStart(2, "0")}`
    : null;

  const availableSlots = slots.filter((s) => s.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,720px)] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-[1.75rem] border-0 p-0 shadow-2xl",
          "fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 sm:bottom-auto sm:top-[50%] sm:translate-y-[-50%]",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-black/[0.06] px-5 py-4 text-left">
          <DialogTitle className="text-lg font-extrabold text-[var(--ink)]">
            Schedule follow-up
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--ink-soft)]">
            {patientName}
            {clinicName ? ` · ${clinicName}` : ""}. Pick a date, then a time slot.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] lg:items-start">
            <div className="rounded-2xl bg-[var(--ivory)] p-3 ring-1 ring-black/[0.05]">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                <CalendarDays className="h-3.5 w-3.5" />
                Date
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={followDate}
                  onSelect={(d) => {
                    onFollowDateChange(d);
                    onFollowTimeChange(null);
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
                  className="std-calendar w-full max-w-[15rem]"
                  classNames={{
                    root: "w-full max-w-[15rem]",
                    months: "flex w-full flex-col",
                    month: "flex w-full flex-col gap-2",
                    weekdays: "mb-1 grid w-full grid-cols-7",
                    weekday:
                      "flex h-7 w-full items-center justify-center text-[10px] font-semibold text-slate-500",
                    week: "mt-0 grid w-full grid-cols-7",
                    day: "h-8 w-full p-0 text-center",
                    today: "rounded-md bg-slate-100 font-semibold text-[var(--ink)]",
                    caption_label: "text-sm font-semibold text-[var(--ink)]",
                    button_previous: "rounded-md hover:bg-slate-100",
                    button_next: "rounded-md hover:bg-slate-100",
                  }}
                />
              </div>
            </div>

            <div className="min-w-0 rounded-2xl bg-[var(--ivory)] p-3 ring-1 ring-black/[0.05]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Time
                </div>
                {followIso ? (
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    {formatDateLabel(followIso)}
                  </span>
                ) : null}
              </div>

              {!followIso ? (
                <p className="mt-4 rounded-xl bg-white px-3 py-6 text-center text-sm text-[var(--ink-soft)]">
                  Select a date first.
                </p>
              ) : slotsLoading ? (
                <LoadingSpinnerLabel
                  label="Loading slots…"
                  size="sm"
                  className="mt-4 w-full py-8"
                />
              ) : availableSlots.length === 0 ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-4 text-center text-sm text-amber-900">
                  No open slots on this day. Try another date.
                </p>
              ) : (
                <div className="mt-3 max-h-[11rem] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {availableSlots.map((s) => {
                      const selected = followTime === s.start_time;
                      const rem = s.remaining_slots ?? 1;
                      return (
                        <button
                          key={s.start_time}
                          type="button"
                          onClick={() => onFollowTimeChange(s.start_time)}
                          className={cn(
                            "rounded-xl px-2 py-2.5 text-left ring-1 transition",
                            selected
                              ? "bg-[var(--saffron)] text-white ring-[var(--saffron)]"
                              : "bg-white text-[var(--ink)] ring-black/5 hover:ring-[var(--saffron)]/40",
                          )}
                        >
                          <div className="text-sm font-extrabold">{formatTimeLabel(s.start_time)}</div>
                          <div
                            className={cn(
                              "mt-0.5 text-[10px] font-semibold",
                              selected ? "text-white/85" : "text-[var(--saffron-deep)]",
                            )}
                          >
                            {rem} left
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {followIso && followTime ? (
            <div className="mt-4 rounded-2xl border border-[var(--saffron)]/25 bg-[var(--saffron-light)] px-4 py-3 text-sm">
              <span className="font-semibold text-[var(--ink)]">Follow-up:</span>{" "}
              <span className="font-bold text-[var(--saffron-deep)]">
                {formatDateLabel(followIso)} · {formatTimeLabel(followTime)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-black/[0.06] bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)] hover:bg-black/[0.04]"
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={saving || !followTime || !followIso}
            onClick={onConfirm}
            className="rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Booking…" : "Confirm follow-up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
