import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const SHOW_MORE_DEFAULT_LIMIT = 3;

export function useShowMore<T>(items: T[], limit = SHOW_MORE_DEFAULT_LIMIT) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, items.length - limit);
  const canExpand = hiddenCount > 0;

  const visible = useMemo(
    () => (expanded ? items : items.slice(0, limit)),
    [expanded, items, limit],
  );

  const expand = useCallback(() => setExpanded(true), []);
  const collapse = useCallback(() => setExpanded(false), []);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return {
    visible,
    expanded,
    hiddenCount,
    canExpand,
    expand,
    collapse,
    toggle,
  };
}

export function ShowMoreButton({
  hiddenCount,
  expanded,
  onClick,
  className,
}: {
  hiddenCount: number;
  expanded: boolean;
  onClick: () => void;
  className?: string;
}) {
  if (hiddenCount <= 0 && !expanded) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-black/[0.04] px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)] transition hover:bg-black/[0.07] hover:text-[var(--ink)]",
        className,
      )}
    >
      {expanded ? (
        <>
          Show less
          <ChevronUp className="h-4 w-4" />
        </>
      ) : (
        <>
          Show more ({hiddenCount})
          <ChevronDown className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export function ShowMoreList<T>({
  items,
  limit = SHOW_MORE_DEFAULT_LIMIT,
  renderItem,
  className,
  listClassName,
  emptyState,
  getKey,
}: {
  items: T[];
  limit?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  listClassName?: string;
  emptyState?: ReactNode;
  getKey?: (item: T, index: number) => string | number;
}) {
  const { visible, hiddenCount, expanded, toggle, canExpand } = useShowMore(items, limit);

  if (!items.length) {
    return emptyState ? <div className={className}>{emptyState}</div> : null;
  }

  return (
    <div className={className}>
      <div className={listClassName}>
        {visible.map((item, index) => (
          <div key={getKey ? getKey(item, index) : index}>{renderItem(item, index)}</div>
        ))}
      </div>
      {canExpand ? (
        <ShowMoreButton hiddenCount={hiddenCount} expanded={expanded} onClick={toggle} />
      ) : null}
    </div>
  );
}
