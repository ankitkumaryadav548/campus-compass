// components/ui/StepCard.jsx
// Used in Guides module to show individual steps with completion tracking.

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

/**
 * StepCard – numbered step with accessible checkbox, title, description, done state.
 *
 * @param {number} stepNumber   Display number (1, 2, 3…)
 * @param {string} title
 * @param {string} description
 * @param {boolean} done        Whether the step is marked complete
 * @param {boolean} disabled    Whether checkbox interaction is disabled (e.g. while saving)
 * @param {Function} onToggle   Called when checkbox is clicked
 */
export default function StepCard({
  stepNumber,
  title,
  description,
  done = false,
  disabled = false,
  onToggle,
  className,
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200",
        done
          ? "bg-success-50/60 border-success-200 dark:bg-success-950/20 dark:border-success-800/60"
          : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700",
        className
      )}
    >
      {/* Step number badge */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold mt-0.5",
          done
            ? "bg-success-500 text-white shadow-sm"
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
            "text-sm font-semibold mb-1 leading-snug",
            done
              ? "line-through text-slate-400 dark:text-slate-500"
              : "text-slate-800 dark:text-slate-100"
          )}
        >
          {title}
        </h4>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Checkbox toggle – minimum 44px touch target */}
      {onToggle && (
        <button
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            done
              ? `Mark step ${stepNumber} as incomplete`
              : `Mark step ${stepNumber} as complete`
          }
          className={cn(
            "flex-shrink-0 min-w-[44px] min-h-[44px] -mr-2 -my-2 flex items-center justify-center rounded-xl",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {disabled ? (
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          ) : done ? (
            <CheckCircle2
              size={22}
              className="text-success-500 dark:text-success-400"
              aria-hidden="true"
            />
          ) : (
            <Circle
              size={22}
              className="text-slate-300 dark:text-slate-600 hover:text-primary-500 transition-colors"
              aria-hidden="true"
            />
          )}
        </button>
      )}
    </div>
  );
}
