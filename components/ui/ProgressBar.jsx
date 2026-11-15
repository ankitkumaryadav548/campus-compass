// components/ui/ProgressBar.jsx
"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const colorMap = {
  primary: "bg-gradient-primary",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger:  "bg-danger-500",
};

/**
 * ProgressBar – animated horizontal progress indicator.
 *
 * @param {number} value        0–100
 * @param {string} color        primary | success | warning | danger
 * @param {boolean} showLabel   Show percentage on the right
 * @param {string} label        Custom label instead of percentage
 * @param {string} size         sm | md | lg (bar height)
 */
export default function ProgressBar({
  value = 0,
  color = "primary",
  showLabel = true,
  label,
  size = "md",
  className,
}) {
  const [width, setWidth] = useState(0);

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {label || "Progress"}
          </span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden",
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorMap[color] || colorMap.primary
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

