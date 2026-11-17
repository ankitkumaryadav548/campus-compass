"use client";
// app/guides/error.jsx
// Error boundary for the guides module.

import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GuidesError({ error, reset }) {
  useEffect(() => {
    console.error("Guides error:", error);
  }, [error]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-0 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/30 mb-5">
          <AlertTriangle size={28} className="text-danger-600 dark:text-danger-400" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Could not load arrival guides
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Something went wrong while loading this guide. Please try again.
        </p>
        <Button
          onClick={reset}
          leftIcon={<RefreshCw size={16} />}
          variant="primary"
        >
          Try again
        </Button>
      </div>
    </AppShell>
  );
}
