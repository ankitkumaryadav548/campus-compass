"use client";

import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function StepsEditor({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([
      ...value,
      { title: "", detail: "", tip: "" },
    ]);
  };

  const handleRemove = (index) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  const handleUpdate = (index, field, val) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Guide Steps ({value.length})
        </label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} leftIcon={Plus}>
          Add Step
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          No steps added yet. A guide must have at least one step with a title to be published.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Step {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-slate-400 hover:text-danger-600 p-1"
                  title="Remove step"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Step title (e.g. Gather documents)"
                  value={step.title || ""}
                  onChange={(e) => handleUpdate(idx, "title", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Step detail / instructions..."
                  value={step.detail || ""}
                  onChange={(e) => handleUpdate(idx, "detail", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional tip (e.g. Keep 2 photocopies)"
                  value={step.tip || ""}
                  onChange={(e) => handleUpdate(idx, "tip", e.target.value)}
                  className="w-full px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs italic text-slate-600 dark:text-slate-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
