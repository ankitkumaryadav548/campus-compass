// components/modules/chat/StarterChips.jsx
// Clickable starter question pills displayed on empty chat state.

import { Sparkles } from "lucide-react";

export default function StarterChips({ questions = [], onSelectQuestion }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary-500" />
        Frequently asked questions
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {questions.map((question, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuestion(question)}
            className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] flex flex-col justify-between"
          >
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {question}
            </span>
            <span className="mt-2 text-[11px] text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
              Ask this &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
