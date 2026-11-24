"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X, Shield, LogOut } from "lucide-react";
import AdminNav from "./AdminNav";

export default function AdminShell({ user, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openReportsCount, setOpenReportsCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setOpenReportsCount(data.attention?.openReportsCount || 0);
        }
      } catch (err) {
        // Soft fail
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary-600 dark:text-primary-400" />
          <span className="font-bold text-base tracking-tight">Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login?role=admin" })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar & Mobile slide drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Admin Panel</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Campus Operations</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AdminNav
            openReportsCount={openReportsCount}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>

        {/* User bar at bottom of sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || "Admin Staff"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || "admin@campus.edu"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login?role=admin" })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
