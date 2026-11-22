// app/chat/loading.jsx
// Skeleton loading state for Chat Page

import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-9.5rem)] min-h-[580px] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="w-48 h-5" />
              <Skeleton className="w-64 h-3.5" />
            </div>
          </div>
          <Skeleton className="w-24 h-8 rounded-lg" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="w-56 h-6" />
          <Skeleton className="w-72 h-4" />
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="w-16 h-11 rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
