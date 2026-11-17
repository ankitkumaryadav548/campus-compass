// app/guides/[category]/loading.jsx
import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function GuideCategoryLoading() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 sm:py-8 space-y-6">
        {/* Category Tabs skeleton */}
        <div className="flex gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>

        {/* Header Card skeleton */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        {/* Steps skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-44 mb-2" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start gap-4"
            >
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
