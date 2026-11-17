import Link from "next/link";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { CheckSquare, BookOpen, Clock, ArrowRight } from "lucide-react";
import { calculateProgress } from "@/lib/dashboard";

export default function DashboardStats({
  checklistDone,
  checklistTotal,
  guideStepsDone,
  guideStepsTotal,
  arrivalInfo
}) {
  const checklistProgress = calculateProgress(checklistDone, checklistTotal);
  const guideProgress = calculateProgress(guideStepsDone, guideStepsTotal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. Checklist progress card */}
      <Link href="/checklist" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl">
        <Card hover className="h-full flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckSquare size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-0.5">
                Checklist <ArrowRight size={13} />
              </span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {checklistDone} / {checklistTotal}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tasks completed
              </p>
            </div>
          </div>
          <ProgressBar value={checklistProgress} color="success" size="sm" showLabel={false} />
        </Card>
      </Link>

      {/* 2. Guides progress card */}
      <Link href="/guides/sim" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl">
        <Card hover className="h-full flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-0.5">
                Guides <ArrowRight size={13} />
              </span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {guideStepsDone} / {guideStepsTotal}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setup steps completed
              </p>
            </div>
          </div>
          <ProgressBar value={guideProgress} color="primary" size="sm" showLabel={false} />
        </Card>
      </Link>

      {/* 3. Timeline card */}
      <Link href="/checklist" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl">
        <Card hover className="h-full flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-0.5">
                Schedule <ArrowRight size={13} />
              </span>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {arrivalInfo.isArrived ? `Day ${arrivalInfo.dayNumber}` : `${arrivalInfo.daysDiff} days`}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {arrivalInfo.isArrived ? "Since arrival in campus" : "Until your arrival"}
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Keep track of time-sensitive registration
          </div>
        </Card>
      </Link>
    </div>
  );
}

