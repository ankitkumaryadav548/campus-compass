"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Utensils,
  Users,
  Languages,
  MessageSquare,
  ShieldAlert,
  Compass,
  LogOut,
  MoreHorizontal,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV_ITEMS = [
  { label: "Dashboard",   href: "/dashboard",  icon: LayoutDashboard },
  { label: "Checklist",   href: "/checklist",  icon: CheckSquare },
  { label: "Guides",      href: "/guides/sim", icon: BookOpen },
  { label: "Food Finder", href: "/food",       icon: Utensils },
];

const SECONDARY_NAV_ITEMS = [
  { label: "Community",   href: "/community",  icon: Users },
  { label: "Language",    href: "/language",   icon: Languages },
  { label: "AI Chat",     href: "/chat",       icon: MessageSquare },
];

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function checkIsActive(pathname, href) {
  if (href.startsWith("/guides")) {
    return pathname.startsWith("/guides");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({ href, icon: Icon, label, alert = false, hasBadge = false }) {
  const pathname = usePathname();
  const active = checkIsActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative",
        active
          ? alert
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            : "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          : alert
          ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400"
      )}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className={
          active
            ? alert
              ? "text-amber-600 dark:text-amber-400"
              : "text-primary-600 dark:text-primary-400"
            : ""
        }
      />
      <span className="flex-1">{label}</span>
      {hasBadge && (
        <span
          className="w-2 h-2 rounded-full bg-danger-500 shrink-0"
          aria-label="Unread notifications"
        />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for broadcasted notification unread count updates
  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      if (typeof e.detail?.count === "number") {
        setUnreadCount(e.detail.count);
      }
    };

    window.addEventListener("campus:unread-notifications", handleUnreadUpdate);
    return () => {
      window.removeEventListener("campus:unread-notifications", handleUnreadUpdate);
    };
  }, []);

  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const allNavItems = [
    ...PRIMARY_NAV_ITEMS,
    ...SECONDARY_NAV_ITEMS,
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: ShieldAlert, alert: true }] : []),
  ];

  const moreItems = [
    ...SECONDARY_NAV_ITEMS,
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: ShieldAlert, alert: true }] : []),
  ];

  const isMoreActive = moreItems.some((item) => checkIsActive(pathname, item.href));

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-20 pb-5 px-4 justify-between"
        aria-label="Application navigation"
      >
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 pb-5 mb-2 border-b border-slate-100 dark:border-slate-800"
          >
            <Compass size={22} className="text-primary-600" aria-hidden="true" />
            <span className="font-bold text-slate-900 dark:text-white">Campus Compass</span>
          </Link>

          <nav aria-label="Sidebar navigation" className="space-y-1">
            {allNavItems.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                hasBadge={item.label === "Community" && unreadCount > 0}
              />
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {user && (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.country || "International"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation bar ─────────────────────────── */}
      <nav
        aria-label="Bottom navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 safe-area-pb"
      >
        {PRIMARY_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = checkIsActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center text-xs transition-colors",
                active
                  ? "text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}

        {/* "More" button to toggle the secondary sheet */}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          aria-label="More navigation options"
          className={cn(
            "relative flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center text-xs transition-colors",
            isMoreActive
              ? "text-primary-600 dark:text-primary-400 font-semibold"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <MoreHorizontal size={19} aria-hidden="true" />
          <span className="text-[10px]">More</span>
          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-500"
              aria-label="New notifications"
            />
          )}
        </button>
      </nav>

      {/* ── Mobile "More" Sheet ──────────────────────────────────── */}
      {mobileMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMoreOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 z-10 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                More Campus Compass
              </span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreItems.map(({ href, icon: Icon, label, alert }) => {
                const active = checkIsActive(pathname, href);
                const hasDot = label === "Community" && unreadCount > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
                      active
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold"
                        : alert
                        ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {hasDot && (
                      <span className="w-2 h-2 rounded-full bg-danger-500 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMoreOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/20 text-danger-600 dark:text-danger-400 text-sm font-semibold min-h-[44px]"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
