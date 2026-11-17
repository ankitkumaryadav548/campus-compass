"use client";
// components/modules/guides/GuideDetailClient.jsx
// Interactive guide viewer with country/general switcher, step checklist,
// optimistic progress saving, and toast notifications.

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Landmark,
  Check,
  Building2,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import StepCard from "@/components/ui/StepCard";

export default function GuideDetailClient({
  category,
  guides,
  userCountry,
  noContentBannerText,
}) {
  const router = useRouter();
  const toast = useToast();

  // Find country guide and general guide if present
  const countryGuide = useMemo(
    () => guides.find((g) => g.specificityLabel === "country"),
    [guides]
  );
  const generalGuide = useMemo(
    () => guides.find((g) => g.specificityLabel === "all" || g.region.includes("ALL")),
    [guides]
  );

  const hasBothGuides = Boolean(countryGuide && generalGuide && countryGuide._id !== generalGuide._id);

  // Active guide selection (defaults to country guide if available, else first guide)
  const defaultGuideId = countryGuide ? countryGuide._id : guides[0]?._id;
  const [selectedGuideId, setSelectedGuideId] = useState(defaultGuideId);

  // Map of completedSteps per guideId for client-side state & optimistic updates
  const [progressState, setProgressState] = useState(() => {
    const initialMap = {};
    for (const g of guides) {
      initialMap[g._id] = g.completedSteps || [];
    }
    return initialMap;
  });

  // Track which step is currently saving
  const [savingStepKey, setSavingStepKey] = useState(null);

  const activeGuide = useMemo(() => {
    return guides.find((g) => g._id === selectedGuideId) || guides[0];
  }, [guides, selectedGuideId]);

  const completedSteps = useMemo(() => {
    return progressState[activeGuide?._id] || [];
  }, [progressState, activeGuide]);

  const totalSteps = activeGuide?.steps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
  const isAllStepsDone = totalSteps > 0 && completedSteps.length === totalSteps;

  const handleToggleStep = useCallback(
    async (stepNumber) => {
      if (!activeGuide) return;
      const guideId = activeGuide._id;
      const isCurrentlyDone = completedSteps.includes(stepNumber);
      const newDone = !isCurrentlyDone;
      const stepKey = `${guideId}-${stepNumber}`;

      if (savingStepKey) return; // prevent duplicate clicks while pending

      setSavingStepKey(stepKey);

      // Optimistic update
      setProgressState((prev) => {
        const current = prev[guideId] || [];
        const next = newDone
          ? [...current, stepNumber]
          : current.filter((s) => s !== stepNumber);
        return { ...prev, [guideId]: next };
      });

      try {
        const res = await fetch("/api/guides/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guideId,
            step: stepNumber,
            done: newDone,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Could not save step progress.");
        }

        const data = await res.json();
        // Check if this was the last step completed
        if (newDone && data.completedSteps?.length === data.totalSteps) {
          toast({
            message: "Congratulations! You have completed all steps in this guide.",
            type: "success",
          });
        }

        router.refresh();
      } catch (err) {
        // Rollback
        setProgressState((prev) => {
          const current = prev[guideId] || [];
          const next = isCurrentlyDone
            ? [...current, stepNumber]
            : current.filter((s) => s !== stepNumber);
          return { ...prev, [guideId]: next };
        });
        toast({
          message: err.message || "Failed to update step. Please try again.",
          type: "error",
        });
      } finally {
        setSavingStepKey(null);
      }
    },
    [activeGuide, completedSteps, savingStepKey, toast, router]
  );

  const cleanTitle = activeGuide?.title?.replace(/^\[SAMPLE\]\s*/i, "") || "";
  const isCountrySpecific = activeGuide?.specificityLabel === "country";
  const formattedLastVerified = activeGuide?.lastVerified
    ? new Date(activeGuide.lastVerified).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Category Tabs: Switch between SIM and Bank */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1 gap-2">
        <Link
          href="/guides/sim"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]",
            category === "sim"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Smartphone size={16} aria-hidden="true" />
          SIM Card Guide
        </Link>
        <Link
          href="/guides/bank"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]",
            category === "bank"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Landmark size={16} aria-hidden="true" />
          Bank Account Guide
        </Link>
      </div>

      {/* Info Banner when only generic content exists */}
      {!countryGuide && noContentBannerText && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50/70 dark:bg-primary-950/20 dark:border-primary-800">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            {noContentBannerText}
          </p>
        </div>
      )}

      {/* Header & Progress Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {cleanTitle}
              </h1>
              {isCountrySpecific ? (
                <Badge variant="info">
                  For {userCountry} students
                </Badge>
              ) : (
                <Badge variant="neutral">
                  General guide
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Follow these steps in order to get verified and set up quickly.
            </p>
          </div>

          {/* Toggle between Country Guide and General Guide if both exist */}
          {hasBothGuides && (
            <div
              role="radiogroup"
              aria-label="Select guide version"
              className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto"
            >
              <button
                type="button"
                role="radio"
                aria-checked={selectedGuideId === countryGuide._id}
                onClick={() => setSelectedGuideId(countryGuide._id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[36px]",
                  selectedGuideId === countryGuide._id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                For {userCountry}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedGuideId === generalGuide._id}
                onClick={() => setSelectedGuideId(generalGuide._id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[36px]",
                  selectedGuideId === generalGuide._id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                General
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {completedSteps.length} of {totalSteps} steps completed
            </span>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
              {progressPercent}%
            </span>
          </div>
          <ProgressBar value={progressPercent} size="md" showLabel={false} />
          {isAllStepsDone && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success-700 dark:text-success-300 bg-success-50 dark:bg-success-950/30 p-2 rounded-lg">
              <CheckCircle2 size={15} className="text-success-600 shrink-0" aria-hidden="true" />
              <span>All steps completed! You are fully set up.</span>
            </div>
          )}
        </div>
      </Card>

      {/* Required Documents Card */}
      {activeGuide?.requiredDocs && activeGuide.requiredDocs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            What you need to bring
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeGuide.requiredDocs.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="leading-relaxed">{doc}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Providers Cards */}
      {activeGuide?.providers && activeGuide.providers.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Recommended providers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeGuide.providers.map((p, idx) => (
              <Card key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 size={16} className="text-primary-600 dark:text-primary-400 shrink-0" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {p.name.replace(/^\[SAMPLE\]\s*/i, "")}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {p.notes}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step by step checklist */}
      {activeGuide?.steps && activeGuide.steps.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Step-by-step checklist
          </h2>
          <div className="space-y-3">
            {activeGuide.steps.map((step) => {
              const isDone = completedSteps.includes(step.order);
              const isSaving = savingStepKey === `${activeGuide._id}-${step.order}`;

              return (
                <StepCard
                  key={step.order}
                  stepNumber={step.order}
                  title={step.title}
                  description={step.description.replace(/^\[SAMPLE\]\s*/i, "")}
                  done={isDone}
                  disabled={isSaving}
                  onToggle={() => handleToggleStep(step.order)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tips Card */}
      {activeGuide?.tips && activeGuide.tips.length > 0 && (
        <Card className="p-6 bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/70 dark:border-amber-800/60">
          <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300">
            <Lightbulb size={18} aria-hidden="true" />
            <h2 className="text-sm font-bold">Helpful tips from senior students</h2>
          </div>
          <ul className="space-y-2">
            {activeGuide.tips.map((tip, idx) => (
              <li
                key={idx}
                className="text-xs text-amber-900/90 dark:text-amber-200/90 flex items-start gap-2 leading-relaxed"
              >
                <span className="text-amber-500 mt-1 shrink-0">•</span>
                <span>{tip.replace(/^\[SAMPLE\]\s*/i, "")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Checklist shortcut reminder */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Finished setting this up?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Update your arrival checklist to keep track of your overall onboarding progress.
          </p>
        </div>
        <Link
          href="/checklist"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline min-h-[36px]"
        >
          Mark checklist item as done <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {/* Footer Info Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {formattedLastVerified && (
              <span>Last verified: {formattedLastVerified}</span>
            )}
            {activeGuide?.sourceUrl && (
              <>
                <span>•</span>
                <a
                  href={activeGuide.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  Official source <ExternalLink size={11} aria-hidden="true" />
                </a>
              </>
            )}
          </div>
          {activeGuide?.isSample && (
            <Badge variant="neutral" className="text-[10px]">
              Sample data
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          Rules may change. Please confirm with the provider or your university&apos;s international office.
        </p>
      </div>
    </div>
  );
}
