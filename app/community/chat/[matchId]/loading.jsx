// app/community/chat/[matchId]/loading.jsx
import AppShell from "@/components/layout/AppShell";
import Skeleton from "@/components/ui/Skeleton";

export default function ChatLoading() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="h-[80vh] min-h-[500px] max-h-[750px] rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {/* Header skeleton */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Messages area skeleton */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex justify-start">
              <Skeleton className="h-14 w-60 rounded-2xl rounded-bl-none" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-48 rounded-2xl rounded-br-none" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-16 w-72 rounded-2xl rounded-bl-none" />
            </div>
          </div>

          {/* Input skeleton */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
