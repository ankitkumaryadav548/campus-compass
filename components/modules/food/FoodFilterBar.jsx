"use client";
// components/modules/food/FoodFilterBar.jsx
// Filter controls for Food Finder: search, type buttons, cuisine select,
// multi-select diet chips, sorting, and active filter counter.

import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACE_TYPES = [
  { id: "all", label: "All types" },
  { id: "restaurant", label: "Restaurant" },
  { id: "grocery", label: "Grocery" },
  { id: "cafeteria", label: "Cafeteria" },
];

const SORT_OPTIONS = [
  { id: "best_match", label: "Best match" },
  { id: "nearest", label: "Nearest to campus" },
  { id: "top_rated", label: "Top rated" },
];

export default function FoodFilterBar({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCuisine,
  onCuisineChange,
  selectedDiets,
  onDietToggle,
  selectedSort,
  onSortChange,
  availableCuisines,
  availableDietTags,
  onClearFilters,
  activeFilterCount,
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-card space-y-3.5">
      {/* Top Row: Search input & Sort dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dining spots or grocery stores by name or street..."
            className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400"
            aria-label="Search places"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <label htmlFor="food-sort" className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Sort by:
          </label>
          <select
            id="food-sort"
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-danger-600 dark:text-danger-400 hover:underline px-2 py-1.5"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Place Type Chips & Cuisine Select */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
            Type:
          </span>
          {PLACE_TYPES.map((pt) => {
            const isSelected = selectedType === pt.id || (!selectedType && pt.id === "all");
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => onTypeChange(pt.id === "all" ? "" : pt.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
                  isSelected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {pt.label}
              </button>
            );
          })}
        </div>

        {availableCuisines?.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="cuisine-select" className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
              Cuisine:
            </label>
            <select
              id="cuisine-select"
              value={selectedCuisine || ""}
              onChange={(e) => onCuisineChange(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All cuisines</option>
              {availableCuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom Row: Diet Chips (Multi-select) */}
      {availableDietTags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
            Dietary requirements:
          </span>
          {availableDietTags.map((diet) => {
            const isSelected = selectedDiets.includes(diet);
            return (
              <button
                key={diet}
                type="button"
                onClick={() => onDietToggle(diet)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium capitalize border transition-all min-h-[32px]",
                  isSelected
                    ? "bg-success-50 text-success-800 border-success-300 dark:bg-success-950/40 dark:text-success-300 dark:border-success-700 font-semibold"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                )}
              >
                {diet} {isSelected && "✓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
