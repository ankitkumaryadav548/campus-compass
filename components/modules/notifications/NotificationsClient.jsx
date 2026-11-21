"use client";
// components/modules/notifications/NotificationsClient.jsx
// Client orchestrator for the full notifications page: handles tabs (All / Unread),
// cursor pagination, optimistic read states, and bulk actions.

import { useState, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import NotificationList from "./NotificationList";
import { cn } from "@/lib/utils";

export default function NotificationsClient({
  initialNotifications = [],
  initialNextCursor = null,
  initialUnreadCount = 0,
}) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
  const [notifications, setNotifications] = useState(initialNotifications);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Sync count to other components (Bell, Sidebar)
  const broadcastCount = useCallback((count) => {
    setUnreadCount(count);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("campus:unread-notifications", { detail: { count } })
      );
    }
  }, []);

  // Fetch when switching tabs
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsTabLoading(true);

    try {
      const url =
        tab === "unread"
          ? "/api/notifications?limit=20&unreadOnly=true"
          : "/api/notifications?limit=20";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error("Tab switch error:", err);
    } finally {
      setIsTabLoading(false);
    }
  };

  // Cursor-based pagination: Load more
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const unreadParam = activeTab === "unread" ? "&unreadOnly=true" : "";
      const url = `/api/notifications?limit=20&cursor=${encodeURIComponent(nextCursor)}${unreadParam}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Toggle single item read status
  const handleToggleRead = async (id, currentUnreadState) => {
    const newRead = currentUnreadState;

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, readAt: newRead ? new Date().toISOString() : null } : n
      )
    );

    const delta = newRead ? -1 : 1;
    broadcastCount(Math.max(0, unreadCount + delta));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: newRead }),
        keepalive: true,
      });
    } catch (err) {
      console.error("Failed to update notification read status:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || nowIso })));
    broadcastCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.readAt)
      : notifications;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Bell size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updates from your messages and direct campus chats.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckCheck size={14} />}
              className="self-start sm:self-auto min-h-[36px]"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => handleTabChange("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px]",
              activeTab === "all"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "unread"}
            onClick={() => handleTabChange("unread")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px]",
              activeTab === "unread"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-none",
                  activeTab === "unread"
                    ? "bg-white text-primary-600"
                    : "bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </Card>

      {/* Main List */}
      <Card className="p-2 sm:p-3 overflow-hidden">
        <NotificationList
          notifications={displayedNotifications}
          isLoading={isTabLoading}
          onToggleRead={handleToggleRead}
          emptyTitle={
            activeTab === "unread"
              ? "No unread notifications"
              : "You are all caught up"
          }
          emptyDescription={
            activeTab === "unread"
              ? "All caught up! Check the 'All' tab to see past notification activity."
              : "When international students message you, you'll see them here."
          }
        />

        {/* Load More Button */}
        {nextCursor && activeTab !== "unread" && (
          <div className="pt-4 pb-2 text-center border-t border-slate-100 dark:border-slate-800 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="min-h-[36px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading more...</span>
                </>
              ) : (
                "Load more notifications"
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
