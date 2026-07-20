import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseIsoDate(iso?: string | null) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplay(date?: Date) {
  if (!date) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type DatePickerFieldProps = {
  value?: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDays?: (date: Date) => boolean;
  /** Show year jump control (for date of birth). */
  yearDropdown?: boolean;
  className?: string;
  allowClear?: boolean;
};

/** @deprecated Use DatePickerField */
export function GlassDatePicker(props: DatePickerFieldProps) {
  return <DatePickerField {...props} />;
}

const calendarLayoutClassNames = {
  root: "w-[300px]",
  months: "flex flex-col w-full",
  month: "flex w-full flex-col gap-2",
  month_caption: "hidden",
  nav: "hidden",
  table: "w-full border-collapse",
  weekdays: "grid grid-cols-7 w-full mb-1",
  weekday:
    "h-8 w-full flex items-center justify-center text-[11px] font-semibold text-slate-500 select-none",
  week: "grid grid-cols-7 w-full mt-0",
  day: "h-9 w-full p-0 text-center",
  today: "bg-slate-100 text-[var(--ink)] font-semibold rounded-md",
  outside: "text-slate-300",
  disabled: "text-slate-300 opacity-40",
} as const;

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select a date",
  disabled,
  minDate,
  maxDate,
  disabledDays,
  yearDropdown = false,
  className,
  allowClear = true,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIsoDate(value), [value]);
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(selected || maxDate || minDate || new Date()),
  );

  useEffect(() => {
    if (selected) setMonth(startOfMonth(selected));
  }, [selected]);

  const minYear = yearDropdown ? 1925 : (minDate?.getFullYear() ?? new Date().getFullYear() - 5);
  const maxYear = yearDropdown
    ? (maxDate?.getFullYear() ?? new Date().getFullYear())
    : (maxDate?.getFullYear() ?? new Date().getFullYear() + 2);
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) list.push(y);
    return list;
  }, [minYear, maxYear]);

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  const selectClass =
    "h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage)]/20";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "mt-1.5 flex w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-black/15 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]/30 disabled:opacity-70",
            open && "border-[var(--sage)] ring-2 ring-[var(--sage)]/25",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" />
          <span className="min-w-0 flex-1">
            {selected ? (
              <span className="block truncate text-sm font-medium text-[var(--ink)]">
                {formatDisplay(selected)}
              </span>
            ) : (
              <span className="block truncate text-sm text-[var(--ink-soft)]">{placeholder}</span>
            )}
          </span>
          {allowClear && selected && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-soft)] hover:bg-slate-100 hover:text-[var(--ink)]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        <div className="p-3">
          {/* Industry-standard month / year toolbar */}
          <div className="mb-3 flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--ink)] hover:bg-slate-100"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <select
              aria-label="Month"
              className={cn(selectClass, "min-w-0 flex-1")}
              value={month.getMonth()}
              onChange={(e) =>
                setMonth(new Date(month.getFullYear(), Number(e.target.value), 1))
              }
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>

            <select
              aria-label="Year"
              className={cn(selectClass, yearDropdown ? "w-[5.5rem]" : "w-[4.75rem]")}
              value={month.getFullYear()}
              onChange={(e) =>
                setMonth(new Date(Number(e.target.value), month.getMonth(), 1))
              }
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="Next month"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--ink)] hover:bg-slate-100"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(d) => {
              onChange(d ? toIsoDate(d) : null);
              if (d) setOpen(false);
            }}
            captionLayout="label"
            hideNavigation
            startMonth={yearDropdown ? new Date(1925, 0) : minDate}
            endMonth={yearDropdown ? maxDate || new Date() : maxDate}
            formatters={{
              formatWeekdayName: (date) =>
                date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
            }}
            disabled={(d) => {
              const day = new Date(d);
              day.setHours(0, 0, 0, 0);
              if (minDate) {
                const min = new Date(minDate);
                min.setHours(0, 0, 0, 0);
                if (day < min) return true;
              }
              if (maxDate) {
                const max = new Date(maxDate);
                max.setHours(0, 0, 0, 0);
                if (day > max) return true;
              }
              return disabledDays?.(d) ?? false;
            }}
            className="std-calendar p-0"
            classNames={calendarLayoutClassNames}
          />

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button
              type="button"
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-[var(--ink)]"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear
            </button>
            {!yearDropdown ? (
              <button
                type="button"
                className="rounded-md bg-[var(--sage)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--sage-deep)]"
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (maxDate) {
                    const max = new Date(maxDate);
                    max.setHours(0, 0, 0, 0);
                    if (today > max) return;
                  }
                  if (minDate) {
                    const min = new Date(minDate);
                    min.setHours(0, 0, 0, 0);
                    if (today < min) return;
                  }
                  onChange(toIsoDate(today));
                  setMonth(startOfMonth(today));
                  setOpen(false);
                }}
              >
                Today
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md bg-[var(--sage)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--sage-deep)]"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
