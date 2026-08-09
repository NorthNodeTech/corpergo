import { cn } from "@/lib/core/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-black/[0.06]", className)} aria-hidden />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 rounded-lg", className)} />;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />;
}
