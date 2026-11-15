// components/ui/StepCard.jsx
// Used in Guides module to show individual steps with completion tracking.

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

/**
 * StepCard – numbered step with checkbox, title, description, done state.
 *
 * @param {number} stepNumber   Display number (1, 2, 3…)
 * @param {string} title
 * @param {string} description
 * @param {boolean} done        Whether the step is marked complete
 * @param {Function} onToggle   Called when checkbox is clicked
 */
export default function StepCard({ stepNumber, title, description, done = false, onToggle, className }) {
  return (
    <div
      className={cn(
        "flex gap-4 p-5 rounded-2xl border transition-all duration-200",
        done
          ? "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-700"
          : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700",
        className
      )}
    >
      {/* Step number badge */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold",
          done
            ? "bg-success-500 text-white"
            : "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        )}
        aria-hidden="true"
      >
        {done ? <span className="text-xs">✓</span> : stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "text-sm font-semibold mb-0.5",
            done ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"
          )}
        >
          {title}
        </h4>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      {/* Checkbox toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          aria-label={done ? `Mark step ${stepNumber} incomplete` : `Mark step ${stepNumber} complete`}
          className="flex-shrink-0 text-slate-300 hover:text-success-500 transition-colors"
        >
          {done ? (
            <CheckCircle2 size={22} className="text-success-500" />
          ) : (
            <Circle size={22} />
          )}
        </button>
      )}
    </div>
  );
}

