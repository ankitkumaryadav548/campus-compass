"use client";
// components/modules/notifications/NotificationList.jsx
// Reusable notification list renderer with loading skeletons and empty state.

import { BellOff } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import NotificationItem from "./NotificationItem";

function NotificationSkeletonRow({ compact = false }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
        {!compact && <Skeleton className="h-3 w-5/6 rounded-md" />}
        <Skeleton className="h-2.5 w-1/4 rounded-md" />
      </div>
    </div>
  );
}

export default function NotificationList({
  notifications = [],
  isLoading = false,
  onItemClick,
  onToggleRead,
  compact = false,
  emptyTitle = "You are all caught up",
  emptyDescription = "No notifications right now. Activity from buddy requests and messages will appear here.",
}) {
  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-1 p-1">
        <NotificationSkeletonRow compact={compact} />
        <NotificationSkeletonRow compact={compact} />
        <NotificationSkeletonRow compact={compact} />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-8 px-4 text-center">
        <EmptyState
          icon={<BellOff size={28} className="text-slate-400" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onItemClick={onItemClick}
          onToggleRead={onToggleRead}
          compact={compact}
        />
      ))}
    </div>
  );
}
