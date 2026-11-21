"use client";
// components/modules/notifications/NotificationItem.jsx
// Single notification row displaying type-colored icon, title, body, relative time,
// unread status, and quick read/unread toggles with accessible navigation.

import Link from "next/link";
import {
  MessageCircle,
  Bell,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/notificationText";

function getNotificationIcon(iconName) {
  switch (iconName) {
    case "message-circle":
      return <MessageCircle size={16} aria-hidden="true" />;
    default:
      return <Bell size={16} aria-hidden="true" />;
  }
}

function getIconContainerStyles(type) {
  switch (type) {
    case "new_message":
      return "bg-violet-100 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
}

export default function NotificationItem({
  notification,
  onItemClick,
  onToggleRead,
  compact = false,
}) {
  const isUnread = !notification.readAt;
  const timeText = formatRelativeTime(notification.createdAt);

  const handleClick = () => {
    if (isUnread && onToggleRead) {
      onToggleRead(notification._id, true);
    }
    if (onItemClick) {
      onItemClick(notification);
    }
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleRead) {
      onToggleRead(notification._id, isUnread);
    }
  };

  return (
    <Link
      href={notification.href || "/notifications"}
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-3 p-3.5 rounded-xl transition-all duration-150 text-left min-h-[44px]",
        isUnread
          ? "bg-primary-50/50 dark:bg-primary-950/20 hover:bg-primary-50/80 dark:hover:bg-primary-950/35"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      )}
    >
      {/* Icon badge */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs",
          getIconContainerStyles(notification.type)
        )}
      >
        {getNotificationIcon(notification.iconName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p
            className={cn(
              "text-xs leading-snug truncate",
              isUnread
                ? "font-bold text-slate-900 dark:text-white"
                : "font-medium text-slate-700 dark:text-slate-300"
            )}
          >
            {notification.title}
          </p>
        </div>

        {notification.body && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
            {notification.body}
          </p>
        )}

        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
          {timeText}
        </span>
      </div>

      {/* Trailing actions: Unread dot + read toggle button */}
      <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
        {isUnread && (
          <span
            className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 shrink-0"
            aria-label="Unread notification"
          />
        )}

        <button
          type="button"
          onClick={handleToggle}
          title={isUnread ? "Mark as read" : "Mark as unread"}
          aria-label={isUnread ? "Mark notification as read" : "Mark notification as unread"}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all min-w-[28px] min-h-[28px] flex items-center justify-center"
        >
          {isUnread ? (
            <Check size={13} aria-hidden="true" />
          ) : (
            <RotateCcw size={12} aria-hidden="true" />
          )}
        </button>
      </div>
    </Link>
  );
}
