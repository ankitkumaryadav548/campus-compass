"use client";

import { Utensils, Leaf, Check, Salad, ShieldAlert, Sparkles, Egg } from "lucide-react";
import { dietOptions } from "@/lib/countries";

const dietIcons = {
  vegetarian: Salad,
  vegan: Leaf,
  halal: Sparkles,
  "non-vegetarian": Utensils,
  jain: ShieldAlert,
  eggetarian: Egg,
  "no preference": Check
};

export default function StepDiet({ formData, onChange, errors }) {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          About your food
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Campus Compass filters nearby eateries, mess menus, and student grocers based on what you eat.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {dietOptions.map((opt) => {
          const isSelected = formData.diet === opt.value;
          const IconComponent = dietIcons[opt.value] || Utensils;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange("diet", opt.value)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 min-h-[72px] ${
                isSelected
                  ? "bg-primary-50/70 dark:bg-primary-950/40 border-primary-600 dark:border-primary-500 shadow-sm ring-2 ring-primary-500/20"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isSelected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                <IconComponent size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {opt.label}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {errors?.diet && (
        <p className="text-xs text-danger-600 dark:text-danger-400 text-center">
          {errors.diet}
        </p>
      )}
    </div>
  );
}

