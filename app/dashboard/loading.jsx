import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Banner Skeleton */}
        <div className="rounded-3xl bg-slate-200 dark:bg-slate-800 h-44 w-full p-8 flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-9 w-72" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

