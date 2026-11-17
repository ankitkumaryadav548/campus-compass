"use client";
// components/modules/checklist/ChecklistClient.jsx
// Main interactive wrapper: handles filtering, grouping, optimistic updates,
// toasts, and the celebration card.

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, AlertCircle, CheckSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import ProgressBar from "@/components/ui/ProgressBar";
import FilterTabs from "./FilterTabs";
import ChecklistGroup from "./ChecklistGroup";
import ChecklistItemCard from "./ChecklistItemCard";
import EmptyState from "@/components/ui/EmptyState";

function motivatingLine(done, total) {
  if (total === 0) return "";
  if (done === 0) return "Every journey starts with the first step. Tick your first item when you're ready!";
  if (done === total) return "You're fully set up! Welcome to campus life — you've got this.";
  if (done / total >= 0.75) return "Almost there! Just a few more tasks to complete your setup.";
  if (done / total >= 0.5) return "Great progress! You're more than halfway through your arrival checklist.";
  return "Good start! Keep going — completing these early makes everything easier.";
}

function groupItems(items) {
  const overdue = [];
  const dueThisWeek = [];
  const later = [];
  const noDeadline = [];
  const done = [];

  for (const item of items) {
    if (item.status === "done") {
      done.push(item);
    } else if (item.isOverdue) {
      overdue.push(item);
    } else if (item.deadlineDate && item.daysLeft <= 7) {
      dueThisWeek.push(item);
    } else if (item.deadlineDate) {
      later.push(item);
    } else {
      noDeadline.push(item);
    }
  }

  return { overdue, dueThisWeek, later, noDeadline, done };
}

export default function ChecklistClient({ initialItems, hasArrivalDate }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState("all");
  const [pendingId, setPendingId] = useState(null);

  const doneCount = useMemo(() => items.filter((i) => i.status === "done").length, [items]);
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const counts = useMemo(() => {
    return {
      all: totalCount,
      pending: items.filter((i) => i.status === "pending").length,
      done: doneCount,
      overdue: items.filter((i) => i.status !== "done" && i.isOverdue).length,
    };
  }, [items, doneCount, totalCount]);

  const visibleItems = useMemo(() => {
    if (activeTab === "pending") return items.filter((i) => i.status === "pending");
    if (activeTab === "done") return items.filter((i) => i.status === "done");
    if (activeTab === "overdue") return items.filter((i) => i.status !== "done" && i.isOverdue);
    return items;
  }, [items, activeTab]);

  const handleToggle = useCallback(
    async (itemId, newStatus) => {
      if (pendingId) return;

      setPendingId(itemId);
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, status: newStatus } : item))
      );

      try {
        const res = await fetch("/api/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, status: newStatus }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Could not save your change.");
        }

        if (newStatus === "done") {
          toast({ message: "Great work! Item marked as complete.", type: "success" });
        }

        // Keep dashboard counts fresh
        router.refresh();
      } catch (err) {
        // Roll back on failure
        const rollbackStatus = newStatus === "done" ? "pending" : "done";
        setItems((prev) =>
          prev.map((item) =>
            item._id === itemId ? { ...item, status: rollbackStatus } : item
          )
        );
        toast({ message: err.message || "Could not save your change. Please try again.", type: "error" });
      } finally {
        setPendingId(null);
      }
    },
    [pendingId, toast, router]
  );

  const groups = useMemo(() => groupItems(visibleItems), [visibleItems]);
  const showGrouped = activeTab === "all" || activeTab === "pending";
  const isAllDone = totalCount > 0 && doneCount === totalCount;

  return (
    <div>
      {/* No arrival date banner */}
      {!hasArrivalDate && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-warning-200 bg-warning-50 dark:bg-warning-900/10 dark:border-warning-700">
          <AlertCircle
            size={18}
            className="text-warning-600 dark:text-warning-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-800 dark:text-warning-300 mb-0.5">
              Deadlines need your arrival date
            </p>
            <p className="text-xs text-warning-700 dark:text-warning-400">
              Your checklist works fine now, but deadline badges won&apos;t show until you add your
              arrival date.{" "}
              <Link
                href="/onboarding"
                className="underline underline-offset-2 hover:no-underline font-medium"
              >
                Update your profile
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {doneCount} of {totalCount} done
          </p>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
        </div>
        <ProgressBar value={progress} size="lg" showLabel={false} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {motivatingLine(doneCount, totalCount)}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5">
        <FilterTabs activeTab={activeTab} counts={counts} onTabChange={setActiveTab} />
      </div>

      {/* Celebration card */}
      {isAllDone && activeTab === "all" && (
        <div
          className={cn(
            "mb-6 flex items-center gap-4 p-5 rounded-2xl border",
            "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200",
            "dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-700"
          )}
        >
          <PartyPopper
            size={32}
            className="text-emerald-600 dark:text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm mb-0.5">
              You&apos;re fully set up!
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Every item on your arrival checklist is complete. Welcome to campus — you&apos;re ready
              to go!
            </p>
          </div>
        </div>
      )}

      {/* Item list */}
      {totalCount === 0 ? (
        <EmptyState
          icon={<CheckSquare size={32} />}
          title="No checklist items yet"
          description="Checklist items for your region haven't been added yet. Check back soon or contact your international office."
        />
      ) : visibleItems.length === 0 ? (
        <p className="text-sm text-center text-slate-400 dark:text-slate-500 py-8">
          No items match this filter right now.
        </p>
      ) : showGrouped ? (
        <>
          <ChecklistGroup
            title="Overdue"
            items={groups.overdue}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
          <ChecklistGroup
            title="Due this week"
            items={groups.dueThisWeek}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
          <ChecklistGroup
            title="Later"
            items={groups.later}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
          <ChecklistGroup
            title="No deadline"
            items={groups.noDeadline}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
          {activeTab === "all" && (
            <ChecklistGroup
              title="Completed"
              items={groups.done}
              defaultCollapsed
              onToggle={handleToggle}
              pendingId={pendingId}
            />
          )}
        </>
      ) : (
        // Done and Overdue tabs – flat list
        <div className="flex flex-col gap-2">
          {visibleItems.map((item) => (
            <ChecklistItemCard
              key={item._id}
              item={item}
              onToggle={handleToggle}
              isPending={pendingId === item._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
