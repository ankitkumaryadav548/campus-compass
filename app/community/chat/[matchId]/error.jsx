"use client";
// app/community/chat/[matchId]/error.jsx
// Error boundary for the community chat page.

import { useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ChatError({ error, reset }) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 sm:px-0 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/30 mb-5">
          <AlertTriangle size={28} className="text-danger-600 dark:text-danger-400" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Could not load conversation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Something went wrong while retrieving your messages. Please check your connection or return to your chats.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/community?tab=matches"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to chats
          </Link>
          <Button
            onClick={reset}
            leftIcon={<RefreshCw size={14} />}
            variant="primary"
            size="sm"
          >
            Try again
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
