"use client";
// components/modules/community/chat/ChatListItem.jsx
// List row for connections showing online status, last message preview, ticks, timestamp, and unread badge.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { listTimeLabel } from "@/lib/chatDates";
import MessageTicks from "./MessageTicks";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ChatListItem({
  match,
  isSelected,
  currentUserId,
}) {
  const partner = match.partner;
  const partnerName = partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";
  const unreadCount = match.unreadCount || 0;
  const hasUnread = unreadCount > 0;
  const isOnline = Boolean(partner?.online);

  const lastMsg = match.lastMessage;
  const lastTime = lastMsg?.createdAt ? listTimeLabel(lastMsg.createdAt) : "";
  const isMine = lastMsg ? (lastMsg.isMine ?? (lastMsg.senderId === currentUserId)) : false;

  return (
    <Link
      href={`/community/chat/${match._id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 min-h-[64px]",
        isSelected
          ? "bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 shadow-xs"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
      )}
    >
      {/* Avatar with small green online dot */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-xs">
          {getInitials(partnerName)}
        </div>
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
            title="Online"
            aria-label="Online"
          />
        )}
      </div>

      {/* Center & right details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h3
            className={cn(
              "text-xs truncate text-slate-900 dark:text-white",
              hasUnread ? "font-bold" : "font-semibold"
            )}
          >
            {partnerName}
          </h3>
          {lastTime && (
            <span
              className={cn(
                "text-[10px] shrink-0",
                hasUnread
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {lastTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {lastMsg ? (
            <div className="flex items-center gap-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {isMine && (
                <span className="shrink-0 inline-flex">
                  <MessageTicks status={lastMsg.status || "sent"} className="text-slate-400" />
                </span>
              )}
              <span className={cn("truncate", hasUnread && "font-semibold text-slate-800 dark:text-slate-200")}>
                {lastMsg.text}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No messages yet</span>
          )}

          {hasUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
