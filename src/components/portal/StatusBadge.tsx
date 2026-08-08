import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[var(--saffron-light)] text-[var(--saffron-deep)] ring-[var(--saffron)]/30",
  progress: "bg-neutral-100 text-black ring-neutral-300",
  completed: "bg-black text-white ring-black",
  cancelled: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  rejected: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  rescheduled: "bg-[var(--saffron-light)] text-black ring-[var(--saffron)]/25",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "pending",
  progress: "progress",
  completed: "completed",
  cancelled: "cancelled",
  rejected: "rejected",
  rescheduled: "rescheduled",
};

export function resolveVisitStatus(status: string) {
  if (status === "accepted" || status === "checked_in") return "progress";
  return status;
}

export function visitStatusLabel(status: string) {
  const key = resolveVisitStatus(status);
  return STATUS_LABELS[key] || key.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: string }) {
  const key = resolveVisitStatus(status);
  const style = STATUS_STYLES[key] || "bg-gray-50 text-gray-700 ring-gray-200";
  const label = visitStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1",
        style,
      )}
    >
      {label}
    </span>
  );
}
