import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
  hideBack = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  hideBack?: boolean;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col items-start justify-start">
        {!hideBack && (
          <button
            onClick={() => window.history.back()}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--bronze)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-1.5 text-[1.85rem] font-extrabold tracking-tight text-[var(--ink)] sm:mt-2 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className={cn("flex flex-wrap gap-2")}>{actions}</div> : null}
    </div>
  );
}
