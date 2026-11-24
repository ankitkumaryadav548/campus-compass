"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const QUICK_TAGS = ["ALL", "SOUTH_ASIA", "AFRICA", "MIDDLE_EAST", "SOUTHEAST_ASIA", "IN", "NP", "BD", "BT", "US"];

export default function RegionTagInput({ value = [], onChange, label = "Applicable Regions" }) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = (tag) => {
    const clean = tag.trim().toUpperCase();
    if (!clean) return;
    if (!value.includes(clean)) {
      onChange([...value, clean]);
    }
    setInputVal("");
  };

  const handleRemove = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</label>}
      
      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
        {value.length === 0 ? (
          <span className="text-xs text-slate-400 italic px-1 py-0.5">No tags specified (defaults to visible to all if empty)</span>
        ) : (
          value.map((tag) => (
            <Badge key={tag} variant={tag === "ALL" ? "info" : "neutral"} className="gap-1 pr-1.5">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="text-slate-400 hover:text-danger-600 rounded-full"
              >
                <X size={12} />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd(inputVal);
            }
          }}
          placeholder="e.g. ALL, SOUTH_ASIA, NP"
          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAdd(inputVal)}
          leftIcon={Plus}
        >
          Add
        </Button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400">Quick add:</span>
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleAdd(tag)}
            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
          >
            +{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
