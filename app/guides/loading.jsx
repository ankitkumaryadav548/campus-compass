// app/guides/loading.jsx
import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function GuidesLoading() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="mb-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
            >
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-24 h-5 rounded-full" />
              </div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-6" />
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-3 w-28 mb-2" />
                <Skeleton className="h-2 w-full rounded-full mb-4" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
