"use client";

import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ProvidersEditor({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([
      ...value,
      { name: "", bestFor: "", link: "" },
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
          Recommended Providers ({value.length})
        </label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} leftIcon={Plus}>
          Add Provider
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          No providers added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((prov, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-2 relative"
            >
              <input
                type="text"
                placeholder="Provider name (e.g. State Bank of India)"
                value={prov.name || ""}
                onChange={(e) => handleUpdate(idx, "name", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Best for (e.g. Zero-balance student accounts)"
                value={prov.bestFor || ""}
                onChange={(e) => handleUpdate(idx, "bestFor", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Website or URL"
                  value={prov.link || ""}
                  onChange={(e) => handleUpdate(idx, "link", e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 text-slate-400 hover:text-danger-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
