import { Loader2 } from "lucide-react";
import { cn } from "@/lib/core/utils";

const spinnerSizes = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

export type LoadingSpinnerSize = keyof typeof spinnerSizes;

export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: LoadingSpinnerSize;
  className?: string;
}) {
  return (
    <Loader2
      className={cn(spinnerSizes[size], "animate-spin text-[var(--saffron)]", className)}
      aria-hidden
    />
  );
}

export function LoadingSpinnerLabel({
  label = "Loading…",
  size = "md",
  className,
  labelClassName,
}: {
  label?: string;
  size?: LoadingSpinnerSize;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center justify-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      {label ? (
        <span className={cn("text-sm font-semibold text-[var(--ink-soft)]", labelClassName)}>
          {label}
        </span>
      ) : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
  minHeight = "min-h-[12rem]",
  size = "lg",
  variant = "card",
}: {
  label?: string;
  className?: string;
  minHeight?: string;
  size?: LoadingSpinnerSize;
  variant?: "card" | "plain";
}) {
  const content = (
    <>
      <LoadingSpinner size={size} />
      {label ? <p className="text-sm font-semibold text-[var(--ink-soft)]">{label}</p> : null}
      <span className="sr-only">{label}</span>
    </>
  );

  if (variant === "plain") {
    return (
      <div
        className={cn("flex flex-col items-center justify-center gap-3", minHeight, className)}
        role="status"
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm",
        minHeight,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {content}
    </div>
  );
}
