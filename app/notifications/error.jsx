"use client";
// app/notifications/error.jsx

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AppShell from "@/components/layout/AppShell";

export default function NotificationsError({ error, reset }) {
  useEffect(() => {
    console.error("Notifications page error:", error);
  }, [error]);

  return (
    <AppShell>
      <div className="max-w-md mx-auto py-12 px-4">
        <Card className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-danger-100 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 mx-auto flex items-center justify-center">
            <AlertCircle size={24} aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notifications unavailable
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We encountered an issue loading your notifications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => reset()}
            leftIcon={<RotateCcw size={14} />}
            className="w-full justify-center min-h-[40px]"
          >
            Try again
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
