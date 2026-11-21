"use client";
// components/modules/community/chat/MessageBubble.jsx
// WhatsApp-style message bubble with grouping, tails, timestamps, and status ticks.

import { cn } from "@/lib/utils";
import { timeOfDay } from "@/lib/chatDates";
import MessageTicks from "./MessageTicks";

export default function MessageBubble({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  onRetry,
}) {
  const formattedTime = timeOfDay(message.createdAt);

  return (
    <div
      className={cn(
        "flex flex-col select-text",
        isMine ? "items-end" : "items-start",
        isLastInGroup ? "mb-2" : "mb-0.5"
      )}
    >
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[75%] px-3.5 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap shadow-xs transition-colors",
          // Bubble colors
          isMine
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-slate-900 dark:text-slate-100 border border-emerald-200 dark:border-emerald-800/60"
            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
          // Border radii & WhatsApp tail styling
          "rounded-2xl",
          isMine && isFirstInGroup && "rounded-tr-xs",
          !isMine && isFirstInGroup && "rounded-tl-xs"
        )}
      >
        {/* Message body text */}
        <p className="inline">{message.text}</p>

        {/* Time and ticks floating inline/bottom-right */}
        <span
          className={cn(
            "float-right flex items-center gap-1 pl-2.5 pt-1 text-[10px] select-none leading-none",
            isMine
              ? "text-slate-500 dark:text-slate-400"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          <span>{formattedTime}</span>
          {isMine && (
            <MessageTicks
              status={message.status}
              onRetry={() => onRetry?.(message)}
            />
          )}
        </span>
      </div>
    </div>
  );
}
