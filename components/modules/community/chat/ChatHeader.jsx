"use client";
// components/modules/community/chat/ChatHeader.jsx
// Header component showing partner identity, country/languages, presence (online / last seen),
// mobile back navigation, and keyboard-accessible safety tools (Block and Report).

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, MoreVertical, ShieldAlert, Flag } from "lucide-react";
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
  backHref = "/community?tab=chats",
  isBlocked = false,
  canUnblock = false,
  onOpenBlockDialog,
  onOpenReportDialog,
  onUnblock,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const partnerName =
    partner?.name?.replace(/^\[SAMPLE\]\s*/i, "").replace(" (Sample)", "") || "Connection";
  const isUserOnline = Boolean(presence?.online);
  const statusText = isUserOnline
    ? "online"
    : presence?.lastSeenAt
    ? lastSeenLabel(presence.lastSeenAt)
    : "";

  // Close menu on outside click or Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 relative">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Link
          href={backHref}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to chats"
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

      {/* Three-dots Safety Menu (Block & Report) */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Chat options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Chat options menu"
            className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-card py-1 z-30 animate-in fade-in-50 zoom-in-95"
          >
            {isBlocked && canUnblock ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onUnblock?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-h-[40px] text-left"
              >
                <ShieldAlert size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Unblock {partnerName.split(" ")[0]}</span>
              </button>
            ) : !isBlocked ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenBlockDialog?.();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors min-h-[40px] text-left"
              >
                <ShieldAlert size={14} />
                <span>Block {partnerName.split(" ")[0]}</span>
              </button>
            ) : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenReportDialog?.();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors min-h-[40px] text-left"
            >
              <Flag size={14} className="text-amber-500" />
              <span>Report {partnerName.split(" ")[0]}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
