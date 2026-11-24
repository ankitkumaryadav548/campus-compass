"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  UtensilsCrossed,
  AlertTriangle,
  Users,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Guides", href: "/admin/guides", icon: BookOpen },
  { label: "Checklist", href: "/admin/checklist", icon: CheckSquare },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Food labels", href: "/admin/food-labels", icon: UtensilsCrossed },
  { label: "Reports", href: "/admin/reports", icon: AlertTriangle, hasBadge: true },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Activity log", href: "/admin/activity", icon: History },
];

export default function AdminNav({ openReportsCount = 0, onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-600 text-white dark:bg-primary-500 shadow-sm"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </div>

            {item.hasBadge && openReportsCount > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-white text-primary-700"
                    : "bg-danger-500 text-white animate-pulse"
                )}
              >
                {openReportsCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
