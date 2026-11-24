"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
      <div className="p-3 bg-danger-50 dark:bg-danger-900/30 text-danger-600 rounded-2xl">
        <AlertTriangle size={32} />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Module Error</h2>
        <p className="text-xs text-slate-500 max-w-md">
          {error?.message || "An unexpected error occurred while loading this section."}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => reset()} leftIcon={RotateCcw}>
        Try Again
      </Button>
    </div>
  );
}
