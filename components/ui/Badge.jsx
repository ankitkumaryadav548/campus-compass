// components/ui/Badge.jsx
// Small label chips used for tags, status and categories.

import { cn } from "@/lib/utils";

const variantMap = {
  info:    "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300",
  success: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-300",
  warning: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300",
  danger:  "bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-900/30 dark:text-danger-300",
  neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300",
};

/**
 * Badge – small label chip.
 * @param {string} variant  info | success | warning | danger | neutral
 * @param {boolean} dot     Show a coloured dot on the left
 */
export default function Badge({ children, variant = "info", dot = false, className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantMap[variant] || variantMap.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-success-500",
            variant === "warning" && "bg-warning-500",
            variant === "danger"  && "bg-danger-500",
            variant === "info"    && "bg-primary-500",
            variant === "neutral" && "bg-slate-400",
          )}
        />
      )}
      {children}
    </span>
  );
}

