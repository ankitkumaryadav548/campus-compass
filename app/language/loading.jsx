// app/language/loading.jsx
import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function LanguageLoading() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 sm:py-8 space-y-6">
        <div>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />

        <div className="flex gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
            >
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-72 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
