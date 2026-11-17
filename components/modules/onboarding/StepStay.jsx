"use client";

import { School, Calendar, FileBadge } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { visaOptions } from "@/lib/countries";

export default function StepStay({ formData, onChange, errors }) {
  const formattedArrivalDate = formData.arrivalDate
    ? typeof formData.arrivalDate === "string"
      ? formData.arrivalDate.split("T")[0]
      : new Date(formData.arrivalDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Your stay in India
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tell us where you are studying and when you arrive so we can schedule your FRRO registration deadlines and SIM card setups.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="university"
          label="University or College"
          placeholder="e.g. Sample City University"
          value={formData.university || ""}
          onChange={(e) => onChange("university", e.target.value)}
          leftIcon={School}
          error={errors?.university}
          helper="The campus where your classes and orientation will take place"
          required
        />

        <Select
          id="visaType"
          label="Visa Type"
          value={formData.visaType || "student"}
          onChange={(e) => onChange("visaType", e.target.value)}
          options={visaOptions}
          error={errors?.visaType}
          helper="Used to customize your required document lists"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="arrivalDate"
            className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <Calendar size={16} className="text-primary-600" />
            Arrival Date in India
          </label>

          <input
            id="arrivalDate"
            type="date"
            value={formattedArrivalDate}
            onChange={(e) => onChange("arrivalDate", e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-h-[44px]"
            required
          />

          {errors?.arrivalDate ? (
            <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">
              {errors.arrivalDate}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your arrival date sets your countdown timer for mandatory registration (e.g. FRRO within 14 days)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

