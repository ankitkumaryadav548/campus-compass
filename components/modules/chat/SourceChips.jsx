// components/modules/chat/SourceChips.jsx
// Displays verified source guide badges and verification metadata.

import Link from "next/link";
import { ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";

export default function SourceChips({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        Verified Guides Referenced:
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <Link
            key={idx}
            href={src.href || "#"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <span>{src.title}</span>
            {src.isSample && (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Sample data
              </span>
            )}
            {src.lastVerified && (
              <span className="text-[10px] text-slate-400 dark:text-slate-400">
                (Verified {src.lastVerified})
              </span>
            )}
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        Rules may change. Confirm important procedures with your university&apos;s international office or the service provider.
      </p>
    </div>
  );
}
