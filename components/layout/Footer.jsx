// components/layout/Footer.jsx
import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Footer – simple, with disclaimer text.
 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary-600 dark:text-primary-400 mb-2">
              <Compass size={22} aria-hidden="true" />
              <span>Campus Compass</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Personalized support for international students — SIM, banking,
              food, documentation and community in one place.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              { label: "Home",        href: "/"        },
              { label: "Features",    href: "/#features" },
              { label: "How it works",href: "/#how-it-works" },
              { label: "Register",    href: "/register" },
              { label: "Log in",      href: "/login"   },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Disclaimer + copyright */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>
            ⚠️ All guides and information on this platform are for reference only.
            Rules, requirements and providers change frequently. Always confirm
            with the official provider or your university&apos;s international office.
          </p>
          <p>© {new Date().getFullYear()} Campus Compass — College Project · Sample data only.</p>
        </div>
      </div>
    </footer>
  );
}

