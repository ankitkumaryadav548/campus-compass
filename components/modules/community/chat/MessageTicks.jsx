"use client";
// components/modules/community/chat/MessageTicks.jsx
// WhatsApp-style message delivery status indicators.
// pending -> Clock, sent -> grey CheckCheck, read -> emerald CheckCheck, failed -> AlertCircle with retry.

import { Clock, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessageTicks({ status, onRetry, className }) {
  if (status === "pending") {
    return (
      <span
        role="status"
        aria-label="Sending"
        className={cn("inline-flex items-center text-slate-400/90 dark:text-slate-400", className)}
        title="Sending..."
      >
        <Clock size={12} aria-hidden="true" />
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span
        role="status"
        aria-label="Sent"
        className={cn("inline-flex items-center text-slate-400/90 dark:text-slate-400", className)}
        title="Sent"
      >
        <CheckCheck size={14} aria-hidden="true" />
      </span>
    );
  }

  if (status === "read") {
    return (
      <span
        role="status"
        aria-label="Read"
        className={cn("inline-flex items-center text-emerald-400 dark:text-emerald-400 font-bold", className)}
        title="Read"
      >
        <CheckCheck size={14} aria-hidden="true" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span
        role="status"
        aria-label="Failed to send"
        className={cn("inline-flex items-center gap-1 text-rose-500", className)}
      >
        <AlertCircle size={13} aria-hidden="true" />
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[10px] underline hover:text-rose-600 font-semibold cursor-pointer"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  return null;
}
