"use client";
// components/modules/community/chat/ChatHeader.jsx
// Header component showing partner identity, country/languages, presence (online / last seen),
// and mobile back navigation.

import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { lastSeenLabel } from "@/lib/chatDates";

function getInitials(name) {
  if (!name) return "CC";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ChatHeader({
  partner,
  presence,
  backHref = "/community?tab=matches",
}) {
  const partnerName = partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";
  const isUserOnline = Boolean(presence?.online);
  const statusText = isUserOnline
    ? "online"
    : presence?.lastSeenAt
    ? lastSeenLabel(presence.lastSeenAt)
    : "";

  return (
    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Link
          href={backHref}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to connections"
        >
          <ArrowLeft size={20} />
        </Link>

        {/* Avatar with small green online dot */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {getInitials(partnerName)}
          </div>
          {isUserOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
              title="Online"
              aria-label="Online"
            />
          )}
        </div>

        {/* Name and Presence */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {partnerName}
            </h2>
            {partner?.isSenior && (
              <Badge variant="neutral" className="text-[10px]">
                Senior
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs">
            {statusText ? (
              <span
                className={
                  isUserOnline
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]"
                    : "text-slate-500 dark:text-slate-400 text-[11px]"
                }
              >
                {statusText}
              </span>
            ) : null}

            {partner?.country && (
              <span className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center gap-1 truncate">
                <Globe size={11} aria-hidden="true" />
                {partner.country}
                {partner?.languages?.length > 0 && ` • Speaks ${partner.languages.join(", ")}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
