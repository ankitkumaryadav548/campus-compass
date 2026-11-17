import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { CheckSquare, ArrowRight, CheckCircle2 } from "lucide-react";

export default function PendingTasks({ items }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <CheckSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Do this next
            </h2>
            <p className="text-xs text-slate-500">
              Priority arrival tasks sorted by nearest deadline
            </p>
          </div>
        </div>

        <Link
          href="/checklist"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px]"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {items && items.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <Link
              key={item._id.toString()}
              href="/checklist"
              className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 -mx-2 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 group-hover:bg-primary-500 transition-colors" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.title.replace("[SAMPLE] ", "")}
                </span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Badge variant={item.deadlineInfo.badgeVariant} className="text-[11px]">
                  {item.deadlineInfo.text}
                </Badge>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title="You are all caught up"
          description="Great job! All your pending arrival documentation tasks are marked complete."
          className="py-8"
        />
      )}
    </Card>
  );
}

