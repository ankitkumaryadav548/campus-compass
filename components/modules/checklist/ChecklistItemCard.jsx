"use client";
// components/modules/checklist/ChecklistItemCard.jsx
// Individual checklist item with checkbox, deadline badge, expand/collapse,
// optimistic tick updates, and country-specific badge.

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, BookOpen, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

function DeadlineBadge({ deadlineDate, deadlineText, deadlineBadgeVariant, isOverdue, daysLeft }) {
  if (!deadlineDate) return null;

  const date = new Date(deadlineDate);
  const formatted = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Human-readable relative text
  let relativeText;
  if (isOverdue) {
    const days = Math.abs(daysLeft);
    relativeText = `${days} ${days === 1 ? "day" : "days"} overdue`;
  } else if (daysLeft === 0) {
    relativeText = "Due today";
  } else if (daysLeft <= 7) {
    relativeText = `Due in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  } else {
    relativeText = `Due ${formatted}`;
  }

  return (
    <Badge variant={deadlineBadgeVariant} className="shrink-0">
      {relativeText}
    </Badge>
  );
}

export default function ChecklistItemCard({ item, onToggle, isPending: externalPending }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = item.status === "done";
  const displayTitle = item.title.replace(/^\[SAMPLE\]\s*/i, "");
  const displayDescription = item.description ? item.description.replace(/^\[SAMPLE\]\s*/i, "") : "";
  const hasLongDescription = displayDescription.length > 100;

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 rounded-xl border transition-all duration-200",
        isDone
          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-70"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        "hover:shadow-sm"
      )}
    >
      {/* Checkbox – 44px touch target */}
      <div className="flex items-start pt-0.5 shrink-0">
        <button
          onClick={() => onToggle(item._id, isDone ? "pending" : "done")}
          disabled={externalPending}
          className={cn(
            "relative w-6 h-6 rounded-lg border-2 flex items-center justify-center",
            "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed",
            // Make sure touch target is at least 44px
            "before:absolute before:inset-[-9px] before:content-['']",
            isDone
              ? "bg-gradient-primary border-transparent"
              : "border-slate-300 dark:border-slate-500 hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-slate-700"
          )}
          aria-label={isDone ? `Mark "${displayTitle}" as pending` : `Mark "${displayTitle}" as done`}
          aria-checked={isDone}
          role="checkbox"
        >
          {isDone && (
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 12 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 5l3.5 3.5L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {externalPending && !isDone && (
            <span className="w-3 h-3 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <span
            className={cn(
              "font-semibold text-sm leading-snug",
              isDone
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-800 dark:text-slate-100"
            )}
          >
            {displayTitle}
          </span>

          {item.isCountrySpecific && (
            <Badge variant="info" className="shrink-0 flex items-center gap-1">
              <MapPin size={10} aria-hidden="true" />
              For {item.countryLabel} students
            </Badge>
          )}
        </div>

        {/* Description with expand/collapse */}
        {displayDescription && (
          <div className="mb-2">
            <p
              className={cn(
                "text-xs text-slate-500 dark:text-slate-400 leading-relaxed",
                !expanded && hasLongDescription && "line-clamp-2"
              )}
            >
              {displayDescription}
            </p>
            {hasLongDescription && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
              >
                {expanded ? (
                  <>Show less <ChevronUp size={12} aria-hidden="true" /></>
                ) : (
                  <>Show more <ChevronDown size={12} aria-hidden="true" /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <DeadlineBadge
            deadlineDate={item.deadlineDate}
            deadlineText={item.deadlineText}
            deadlineBadgeVariant={item.deadlineBadgeVariant}
            isOverdue={item.isOverdue}
            daysLeft={item.daysLeft}
          />

          {item.guideCategory && (
            <Link
              href={`/guides/${item.guideCategory}`}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                "text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700",
                "hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              )}
            >
              <BookOpen size={10} aria-hidden="true" />
              Open guide
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
