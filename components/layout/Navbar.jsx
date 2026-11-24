// components/layout/Navbar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  Compass,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useTheme } from "@/components/layout/ThemeProvider";
import NotificationBell from "@/components/layout/NotificationBell";

const NAV_LINKS = [
  { label: "Home",         href: "/" },
  { label: "Features",     href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
];

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Navbar – sticky, glass/blur effect, authenticated user dropdown, mobile drawer.
 */
export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click and ESC key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    await signOut({ callbackUrl: user?.role === "admin" ? "/login?role=admin" : "/" });
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          "bg-white/85 dark:bg-slate-900/85 backdrop-blur-md",
          scrolled && "shadow-sm border-b border-slate-200/60 dark:border-slate-700/60"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href={user?.role === "admin" ? "/admin" : "/"}
              className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400 hover:opacity-85 transition-opacity"
              aria-label="Campus Compass home"
            >
              <Compass size={28} className="text-primary-600" aria-hidden="true" />
              <span>Campus Compass</span>
            </Link>

            {/* Desktop nav links */}
            {user?.role !== "admin" ? (
              <ul className="hidden md:flex items-center gap-1" role="list">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400"
                          : "text-slate-600 hover:text-primary-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Staff Administrator Portal
                </span>
              </div>
            )}

            {/* Right side: theme toggle + auth menu */}
            <div className="flex items-center gap-2.5">
              {/* Notifications (Students only) */}
              {isAuthenticated && user?.role !== "admin" && <NotificationBell />}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* ── Logged In User Menu ── */}
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="Open user menu"
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-scale-in"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {user.country && (
                            <Badge variant="info" dot className="text-[10px]">
                              {user.country}
                            </Badge>
                          )}
                          <Badge variant={user.role === "admin" ? "warning" : "neutral"} className="text-[10px]">
                            {user.role}
                          </Badge>
                        </div>
                      </div>

                      <div className="py-1">
                        {user.role === "admin" ? (
                          <Link
                            href="/admin"
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <ShieldAlert size={16} className="text-amber-500" />
                            <span>Admin Panel</span>
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard"
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <LayoutDashboard size={16} className="text-slate-400" />
                            <span>Dashboard</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Logged Out Buttons (Desktop) ── */
                <div className="hidden md:flex items-center gap-2">
                  <Button as={Link} href="/login" variant="ghost" size="sm">
                    Log in
                  </Button>
                  <Button as={Link} href="/register" variant="primary" size="sm">
                    Get Started
                  </Button>
                </div>
              )}

              {/* Hamburger – mobile */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300",
          menuOpen ? "visible" : "invisible"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-white dark:bg-slate-900",
            "shadow-2xl transition-transform duration-300 ease-out border-l border-slate-200 dark:border-slate-800",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-16 pb-8 px-6 justify-between">
            <div className="space-y-4">
              {/* Authenticated user mobile card */}
              {isAuthenticated && user && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {user.country && (
                      <Badge variant="info" dot className="text-[10px]">
                        {user.country}
                      </Badge>
                    )}
                    <Badge variant={user.role === "admin" ? "warning" : "neutral"} className="text-[10px]">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Navigation links */}
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    {user?.role === "admin" ? (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2"
                      >
                        <ShieldAlert size={18} />
                        Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <LayoutDashboard size={18} />
                        Dashboard
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom auth actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  variant="danger"
                  size="md"
                  leftIcon={LogOut}
                  className="w-full justify-center"
                >
                  Sign Out
                </Button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Button as={Link} href="/login" variant="secondary" size="md" className="w-full justify-center">
                    Log in
                  </Button>
                  <Button as={Link} href="/register" variant="primary" size="md" className="w-full justify-center">
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
