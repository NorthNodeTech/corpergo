import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-black/[0.05]",
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-[var(--ink)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--ink-soft)] leading-relaxed">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
