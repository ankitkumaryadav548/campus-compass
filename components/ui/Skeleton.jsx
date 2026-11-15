// components/ui/Skeleton.jsx
// Shimmer loading placeholder – use where real data is loading.

import { cn } from "@/lib/utils";

/**
 * Skeleton – animated shimmer box.
 * Compose multiple Skeleton components to match the loading layout.
 */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-slate-200 dark:bg-slate-700",
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-shimmer before:translate-x-[-100%]",
        className
      )}
      {...props}
    />
  );
}

/** Pre-composed card skeleton */
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card">
      <Skeleton className="h-6 w-2/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 mb-2 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}

