"use client";
// components/modules/community/chat/DateDivider.jsx
// Centered calendar day pill divider for chat conversations.

import { cn } from "@/lib/utils";

export default function DateDivider({ label, className }) {
  if (!label) return null;

  return (
    <div className={cn("flex justify-center my-3 select-none", className)}>
      <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700/60 shadow-xs">
        {label}
      </span>
    </div>
  );
}
