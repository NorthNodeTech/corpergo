import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  checked_in: "bg-sky-50 text-sky-800 ring-sky-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  rescheduled: "bg-violet-50 text-violet-800 ring-violet-200",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-gray-50 text-gray-700 ring-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1",
        style,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
