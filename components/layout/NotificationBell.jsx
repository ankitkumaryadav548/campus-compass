"use client";
// components/layout/NotificationBell.jsx
// Accessible notification bell trigger with badge, desktop dropdown, mobile bottom sheet,
// and visibility-aware 20-second polling for unread counts.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationList from "@/components/modules/notifications/NotificationList";

export default function NotificationBell() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const bellButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const pollTimerRef = useRef(null);

  const unreadMessagesRef = useRef(0);

  // Broadcasts count change to Sidebar / mobile bottom navigation without a secondary loop
  const broadcastCount = useCallback((count, unreadMessages) => {
    setUnreadCount(count);
    if (typeof unreadMessages === "number") {
      unreadMessagesRef.current = unreadMessages;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("campus:unread-notifications", {
          detail: {
            count,
            unreadMessages: unreadMessagesRef.current,
          },
        })
      );
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.count === "number" ? data.count : 0;
        const unreadMessages =
          typeof data.unreadMessages === "number" ? data.unreadMessages : 0;
        broadcastCount(count, unreadMessages);
      }
    } catch {
      // Silently ignore polling network failures
    }
  }, [broadcastCount]);

  // Fetch recent notifications for dropdown
  const fetchRecentList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notification list:", err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // 20-second visibility-aware polling
  useEffect(() => {
    fetchUnreadCount();

    const startPolling = () => {
      stopPolling();
      pollTimerRef.current = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchUnreadCount();
        }
      }, 20000);
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  // When dropdown opens, fetch list and refresh count
  useEffect(() => {
    if (isOpen) {
      fetchRecentList();
      fetchUnreadCount();
    }
  }, [isOpen, fetchRecentList, fetchUnreadCount]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Outside click & ESC handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(e.target)
      ) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeDropdown = () => {
    setIsOpen(false);
    // Return focus to bell button
    if (bellButtonRef.current) {
      bellButtonRef.current.focus();
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Toggle single item read status
  const handleToggleRead = async (id, currentUnreadState) => {
    const newRead = currentUnreadState;

    // Optimistic state update
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
      // Re-sync on failure
      fetchUnreadCount();
      fetchRecentList();
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
      console.error("Failed to mark all notifications read:", err);
      fetchUnreadCount();
      fetchRecentList();
    }
  };

  const badgeText = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : "";

  return (
    <div className="relative">
      {/* Screen reader live notification announcements */}
      <span className="sr-only" aria-live="polite">
        {unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
          : "No unread notifications"}
      </span>

      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications, ${unreadCount} unread`}
        className={cn(
          "relative p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          isOpen && "bg-slate-100 text-primary-600 dark:bg-slate-800 dark:text-primary-400"
        )}
      >
        <Bell size={19} aria-hidden="true" />

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white dark:border-slate-900 animate-scale-in shadow-xs"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* ── Desktop Floating Dropdown ── */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="dialog"
          aria-label="Notifications overview"
          className="hidden sm:block absolute right-0 mt-2 w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline min-h-[32px] px-1"
              >
                <CheckCheck size={14} aria-hidden="true" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            <NotificationList
              notifications={notifications}
              isLoading={isLoadingList}
              onItemClick={closeDropdown}
              onToggleRead={handleToggleRead}
              compact
            />
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-center">
            <Link
              href="/notifications"
              onClick={closeDropdown}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 py-1.5 px-3 rounded-lg hover:bg-white dark:hover:bg-slate-850 transition-colors"
            >
              <span>See all notifications</span>
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Sheet Drawer (< 640px) ── */}
      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeDropdown}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div
            ref={dropdownRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="relative w-full max-h-[80vh] rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-slide-up"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 py-1 px-2"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDropdown}
                  aria-label="Close notifications"
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-1 max-h-[60vh]">
              <NotificationList
                notifications={notifications}
                isLoading={isLoadingList}
                onItemClick={closeDropdown}
                onToggleRead={handleToggleRead}
                compact
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-center safe-area-pb">
              <Link
                href="/notifications"
                onClick={closeDropdown}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-850 transition-colors"
              >
                <span>View full notification history</span>
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
