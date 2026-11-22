// components/modules/food/FoodFilters.jsx
// Instant client-side filtering controls for diet, type, radius, cuisine, search, and sorting.

import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function FoodFilters({
  diet,
  onDietChange,
  hideUnconfirmed,
  onHideUnconfirmedChange,
  type,
  onTypeChange,
  radius,
  onRadiusChange,
  cuisine,
  onCuisineChange,
  availableCuisines = [],
  search,
  onSearchChange,
  sort,
  onSortChange,
  onClearFilters,
  activeFilterCount,
}) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
      {/* Top Row: Diet Segmented Control + Hide Unconfirmed + Type Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Diet Segmented Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">
            Diet:
          </span>
          <div
            className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            role="group"
            aria-label="Diet filter"
          >
            {[
              { id: "any", label: "Any" },
              { id: "veg", label: "Veg" },
              { id: "nonveg", label: "Non-veg" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDietChange(opt.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[34px]",
                  diet === opt.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Hide unconfirmed switch (visible only in Veg or Non-veg modes) */}
          {(diet === "veg" || diet === "nonveg") && (
            <label className="inline-flex items-center gap-2 ml-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hideUnconfirmed}
                onChange={(e) => onHideUnconfirmedChange(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <span>Hide unconfirmed</span>
            </label>
          )}
        </div>

        {/* Place Type Chips */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Place type filter">
          {[
            { id: "all", label: "All places" },
            { id: "food", label: "Food places" },
            { id: "grocery", label: "Groceries" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onTypeChange(chip.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px]",
                type === chip.id
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 font-bold"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Row: Search + Cuisine + Radius + Sort + Clear Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Name / Cuisine Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or cuisine…"
            aria-label="Search places by name or cuisine"
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px]"
          />
        </div>

        {/* Cuisine Select */}
        <div className="relative">
          <select
            value={cuisine}
            onChange={(e) => onCuisineChange(e.target.value)}
            aria-label="Filter by cuisine"
            className="w-full text-xs py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none"
          >
            <option value="">All Cuisines</option>
            {availableCuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <SlidersHorizontal size={12} aria-hidden="true" />
          </div>
        </div>

        {/* Radius Select */}
        <div className="relative">
          <select
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            aria-label="Search radius"
            className="w-full text-xs py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none"
          >
            <option value={1000}>Within 1 km</option>
            <option value={2000}>Within 2 km (default)</option>
            <option value={5000}>Within 5 km</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <SlidersHorizontal size={12} aria-hidden="true" />
          </div>
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort places"
            className="w-full text-xs py-2 px-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px] appearance-none font-medium"
          >
            <option value="best">Best match</option>
            <option value="nearest">Nearest first</option>
            <option value="top_rated">Top rated</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <SlidersHorizontal size={12} aria-hidden="true" />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex items-center justify-end">
          {activeFilterCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClearFilters}
              leftIcon={<RotateCcw size={12} />}
              className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white min-h-[38px]"
            >
              Clear filters ({activeFilterCount})
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 text-right w-full pr-2">
              Default filters
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
