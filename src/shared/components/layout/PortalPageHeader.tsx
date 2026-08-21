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
    <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="section-header flex flex-col items-start justify-start">
        {!hideBack && (
          <button
            onClick={() => window.history.back()}
            className="type-body-sm mb-2 flex items-center gap-1.5 font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {eyebrow ? <div className="type-eyebrow text-[var(--burnt-amber)]">{eyebrow}</div> : null}
        <h1 className="type-h1 mt-1 font-extrabold tracking-tight text-[var(--ink)] sm:mt-2">
          {title}
        </h1>
        {description ? (
          <p className="type-lead mt-1.5 max-w-2xl text-[var(--ink-soft)] sm:mt-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="portal-page-header-actions">{actions}</div> : null}
    </div>
  );
}
