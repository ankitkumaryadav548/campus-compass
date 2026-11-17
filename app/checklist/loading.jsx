// app/checklist/loading.jsx
import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function ChecklistLoading() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Progress bar skeleton */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-3 w-64 mt-2" />
        </div>

        {/* Tab skeleton */}
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl mb-5" />

        {/* Item skeletons */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-2"
          >
            <Skeleton className="w-6 h-6 rounded-lg shrink-0 mt-0.5" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
