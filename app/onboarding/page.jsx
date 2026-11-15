// app/onboarding/page.jsx
// Temporary Onboarding Page (Prompt 3). Full form arrives in Prompt 4.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Compass, Sparkles, ArrowRight, Construction } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleDevSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/skip-onboarding", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to skip onboarding");
      }

      toast({
        message: "Onboarding skipped for development!",
        type: "success",
      });

      // Refresh the client session token so onboardingDone is updated
      await update();
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      toast({
        message: err.message || "Failed to skip onboarding",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full text-center p-8 shadow-xl border-slate-200 dark:border-slate-800">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <Compass size={32} />
        </div>

        <Badge variant="warning" dot className="mb-3">
          Prompt 4 Preparation
        </Badge>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Onboarding Coming Next
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          The 5-step country and preferences onboarding form will be built in the next step.
          Your account is registered and authenticated.
        </p>

        {/* ── Dev-only Skip Button ── */}
        {process.env.NODE_ENV !== "production" && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 flex items-center justify-center gap-1">
              <Sparkles size={14} /> Developer bypass for testing module pages
            </p>
            <Button
              onClick={handleDevSkip}
              variant="secondary"
              size="md"
              loading={loading}
              rightIcon={ArrowRight}
              className="w-full justify-center"
            >
              Skip for now (dev only)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
