"use client";

import Modal from "@/components/ui/Modal";
import StatusBadge from "../shared/StatusBadge";
import SampleBadge from "../shared/SampleBadge";
import Badge from "@/components/ui/Badge";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function GuidePreviewModal({ isOpen, onClose, guide }) {
  if (!guide) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guide Student Preview" size="xl">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header section */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={guide.status || "published"} />
            <Badge variant="info" className="capitalize">
              {guide.category}
            </Badge>
            <SampleBadge isSample={guide.isSample} />
            {guide.estimatedTime && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={13} /> {guide.estimatedTime}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {guide.title}
          </h2>
          {guide.summary && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
              {guide.summary}
            </p>
          )}
        </div>

        {/* Required Documents */}
        {guide.requiredDocuments?.length > 0 && (
          <div className="bg-primary-50/50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-900/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300 mb-2">
              Required Documents
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
              {guide.requiredDocuments.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Step-by-Step Instructions
          </h3>
          <div className="space-y-3">
            {guide.steps?.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                </div>
                {step.detail && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                    {step.detail}
                  </p>
                )}
                {step.tip && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/40 ml-7 flex items-start gap-1.5">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>Tip: {step.tip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Common Mistakes */}
        {guide.commonMistakes?.length > 0 && (
          <div className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
              Common Mistakes to Avoid
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
              {guide.commonMistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Providers */}
        {guide.providers?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Recommended Providers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guide.providers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                  {p.bestFor && <div className="text-slate-500 dark:text-slate-400">{p.bestFor}</div>}
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline block truncate"
                    >
                      {p.link}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
