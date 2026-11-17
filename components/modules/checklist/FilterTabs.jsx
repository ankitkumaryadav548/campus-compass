"use client";
// components/modules/checklist/FilterTabs.jsx
// All / Pending / Done / Overdue filter tabs with counts.

import { cn } from "@/lib/utils";

const TABS = [
  { id: "all",     label: "All" },
  { id: "pending", label: "Pending" },
  { id: "done",    label: "Done" },
  { id: "overdue", label: "Overdue" },
];

export default function FilterTabs({ activeTab, counts, onTabChange }) {
  return (
    <div
      role="tablist"
      aria-label="Filter checklist items"
      className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto"
    >
      {TABS.map((tab) => {
        const count = counts[tab.id] ?? 0;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none",
                  isActive
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
