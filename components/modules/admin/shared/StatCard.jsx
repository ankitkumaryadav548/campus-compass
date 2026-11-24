import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtext, icon: Icon, badge, className }) {
  return (
    <Card className={cn("p-5 flex items-start justify-between border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </p>
          {badge && <span>{badge}</span>}
        </div>
        {subtext && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
    </Card>
  );
}
