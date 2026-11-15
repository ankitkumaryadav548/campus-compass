// components/layout/Sidebar.jsx
"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const BASE_NAV_ITEMS = [
  { label: "Dashboard",   href: "/dashboard",  icon: LayoutDashboard },
  { label: "Checklist",   href: "/checklist",  icon: CheckSquare },
  { label: "Guides",      href: "/guides/sim", icon: BookOpen },
  { label: "Food Finder", href: "/food",       icon: Utensils },
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

/** Desktop sidebar nav item */
function NavItem({ href, icon: Icon, label, alert = false }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
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
      <span>{label}</span>
    </Link>
  );
}

/**
 * Sidebar – connected to NextAuth session.
 * Displays user profile at bottom and Admin Panel link if role is admin.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: ShieldAlert, alert: true }] : []),
  ];

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-20 pb-5 px-4 justify-between"
        aria-label="Application navigation"
      >
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {/* Logo link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 pb-5 mb-2 border-b border-slate-100 dark:border-slate-800"
          >
            <Compass size={22} className="text-primary-600" aria-hidden="true" />
            <span className="font-bold text-slate-900 dark:text-white">Campus Compass</span>
          </Link>

          <nav aria-label="Sidebar navigation" className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
        </div>

        {/* ── Bottom: User profile & Logout ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {user ? (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user.country ? (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.country}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        Profile incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center",
                "text-xs transition-colors",
                active
                  ? "text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
