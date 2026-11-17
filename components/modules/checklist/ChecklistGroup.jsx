"use client";
// components/modules/checklist/ChecklistGroup.jsx
// A collapsible group of checklist items (Overdue / Due this week / Later / etc.)

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import ChecklistItemCard from "./ChecklistItemCard";

export default function ChecklistGroup({ title, items, defaultCollapsed = false, onToggle, pendingId }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "w-full flex items-center justify-between px-1 py-2 mb-2",
          "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        )}
        aria-expanded={!collapsed}
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {title}
          <span className="ml-2 normal-case tracking-normal font-medium text-slate-500 dark:text-slate-400">
            ({items.length})
          </span>
        </span>
        {collapsed ? (
          <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronUp size={14} className="text-slate-400" aria-hidden="true" />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ChecklistItemCard
              key={item._id}
              item={item}
              onToggle={onToggle}
              isPending={pendingId === item._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
