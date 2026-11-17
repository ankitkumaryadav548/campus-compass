"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error("Dashboard error occurred:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-50 dark:bg-danger-950/40 text-danger-500 flex items-center justify-center">
          <AlertCircle size={28} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Could not load your dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            We encountered a problem loading your personalized content. Please try again.
          </p>
        </div>

        <Button
          onClick={() => reset()}
          variant="primary"
          size="md"
          leftIcon={RotateCcw}
          className="mx-auto"
        >
          Retry
        </Button>
      </Card>
    </div>
  );
}

