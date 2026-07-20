import { cn } from "@/lib/utils";

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--bronze)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-[var(--ink-soft)] leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className={cn("flex flex-wrap gap-2")}>{actions}</div> : null}
    </div>
  );
}
