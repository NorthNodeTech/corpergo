import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingSpinnerLabel } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchClinicCompletedComparison,
  type ClinicComparisonRange,
  type ClinicComparisonSeries,
  type ClinicOverview,
} from "@/lib/admin-dashboard-data";
import { cn, formatClinicName } from "@/lib/utils";

const RANGES: { id: ClinicComparisonRange; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "28d", label: "28 days" },
  { id: "90d", label: "3 months" },
];

type AdminClinicComparisonProps = {
  clinics: ClinicOverview[];
  loading?: boolean;
};

export function AdminClinicComparison({ clinics, loading }: AdminClinicComparisonProps) {
  const [range, setRange] = useState<ClinicComparisonRange>("7d");
  const [series, setSeries] = useState<ClinicComparisonSeries | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (loading || !clinics.length) return;
    let cancelled = false;
    setSeriesLoading(true);
    void fetchClinicCompletedComparison(clinics, range).then((result) => {
      if (cancelled) return;
      setSeries(result);
      setEnabledIds((prev) => {
        if (prev.size === 0) return new Set(result.clinics.map((c) => c.id));
        const next = new Set<string>();
        for (const id of prev) {
          if (result.clinics.some((c) => c.id === id)) next.add(id);
        }
        if (next.size === 0) return new Set(result.clinics.map((c) => c.id));
        return next;
      });
      setSeriesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clinics, range, loading]);

  const activeClinics = useMemo(
    () => (series?.clinics || []).filter((c) => enabledIds.has(c.id)),
    [series?.clinics, enabledIds],
  );

  function toggleClinic(id: string) {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function resetFilters() {
    setRange("7d");
    if (series?.clinics.length) {
      setEnabledIds(new Set(series.clinics.map((c) => c.id)));
    }
  }

  const chartBusy = loading || seriesLoading;

  return (
    <div className="rounded-[28px] bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[var(--ink)]">Clinic comparison</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Completed sessions by location — toggle clinics to compare on the chart
          </p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm font-semibold text-[var(--saffron-deep)] hover:underline"
        >
          Reset filters
        </button>
      </div>

      {/* Time range chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-4">
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRange(item.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              range === item.id
                ? "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-1 ring-[var(--saffron)]/25"
                : "bg-[var(--ivory)] text-[var(--ink-soft)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs font-semibold text-[var(--ink-soft)] sm:inline">
          Metric: Completed only
        </span>
      </div>

      {/* Clinic metric cards — Search Console style toggles */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {chartBusy
          ? Array.from({ length: Math.max(clinics.length, 5) }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))
          : (series?.clinics || []).map((clinic) => {
              const active = enabledIds.has(clinic.id);
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => toggleClinic(clinic.id)}
                  className={cn(
                    "rounded-xl border bg-white p-3 text-left transition",
                    active
                      ? "border-black/[0.08] shadow-sm"
                      : "border-transparent bg-slate-50/80 opacity-55 hover:opacity-80",
                  )}
                  style={active ? { borderTopColor: clinic.color, borderTopWidth: 3 } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded border text-[10px] font-bold",
                        active ? "border-current text-white" : "border-slate-300 bg-white",
                      )}
                      style={active ? { backgroundColor: clinic.color, borderColor: clinic.color } : undefined}
                      aria-hidden
                    >
                      {active ? "✓" : ""}
                    </span>
                    <span className="truncate text-xs font-semibold text-[var(--ink-soft)]">
                      {clinic.shortName}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 text-2xl font-normal leading-none tabular-nums"
                    style={{ color: active ? clinic.color : "#94a3b8" }}
                  >
                    {clinic.total}
                  </div>
                  <div className="mt-1 truncate text-[10px] font-medium text-[var(--ink-soft)]">
                    {formatClinicName(clinic.name)}
                  </div>
                </button>
              );
            })}
      </div>

      {/* Line chart */}
      <div className="relative mt-4 h-64 w-full min-w-0 sm:h-72">
        {chartBusy ? (
          <div className="grid h-full place-items-center">
            <LoadingSpinnerLabel label="Loading completed sessions…" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart
              data={series?.points || []}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5E6A6A", fontSize: 10 }}
                interval={range === "90d" ? 6 : range === "28d" ? 2 : 0}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
                tick={{ fill: "#5E6A6A", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 8px 24px rgba(38,50,56,0.08)",
                  fontSize: 13,
                }}
                formatter={(value, name) => {
                  const clinic = series?.clinics.find((c) => c.id === name);
                  return [value as number, clinic ? formatClinicName(clinic.name) : String(name)];
                }}
                labelFormatter={(label) => String(label)}
              />
              {activeClinics.map((clinic) => (
                <Line
                  key={clinic.id}
                  type="monotone"
                  dataKey={clinic.id}
                  name={clinic.id}
                  stroke={clinic.color}
                  strokeWidth={2}
                  dot={range === "7d"}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
