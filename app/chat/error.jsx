// app/chat/error.jsx
// Error boundary for Chat Page

"use client";

import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ChatError({ error, reset }) {
  useEffect(() => {
    console.error("Chat page error:", error);
  }, [error]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-card text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Could not load the Campus Assistant
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          We encountered an issue preparing the chat assistant. Please try refreshing or
          check back in a moment.
        </p>
        <div className="pt-2">
          <Button variant="primary" onClick={() => reset()} className="inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
