import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/core/utils";

const arrowBtn =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[var(--ink)] ring-1 ring-black/[0.08] shadow-sm transition hover:bg-[var(--saffron-light)] hover:ring-[var(--saffron)]/30 disabled:opacity-40";

type AdminCardCarouselProps = {
  itemCount: number;
  renderItem: (index: number) => ReactNode;
  desktop: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function AdminCardCarousel({
  itemCount,
  renderItem,
  desktop,
  className,
  ariaLabel = "card",
}: AdminCardCarouselProps) {
  const [index, setIndex] = useState(0);
  const go = (dir: -1 | 1) =>
    setIndex((current) => (current + dir + itemCount) % itemCount);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-stretch gap-2 md:hidden">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={itemCount <= 1}
          aria-label={`Previous ${ariaLabel}`}
          className={arrowBtn}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">{renderItem(index)}</div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={itemCount <= 1}
          aria-label={`Next ${ariaLabel}`}
          className={arrowBtn}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="hidden md:contents">{desktop}</div>
      {itemCount > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5 md:hidden">
          {Array.from({ length: itemCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-[var(--saffron)]" : "w-1.5 bg-black/15",
              )}
              aria-hidden
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
