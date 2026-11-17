"use client";

import { Edit3, Globe, Utensils, School, Calendar, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function StepReview({
  formData,
  onEditStep,
  onBioChange,
  isEditMode,
  isSubmitting,
  onSubmit
}) {
  const displayArrivalDate = formData.arrivalDate
    ? new Date(formData.arrivalDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not specified";

  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Review your profile
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Everything looks great! Check your information below or jump back to edit any section before entering your dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Origin & Language */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Globe size={16} className="text-primary-600" />
              Origin & Languages
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px] px-2"
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Country:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {formData.country || "Not selected"}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Languages:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.languages?.map((lang) => (
                  <Badge key={lang} variant="neutral" className="text-[10px]">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dietary Preferences */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Utensils size={16} className="text-primary-600" />
              Food & Diet
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px] px-2"
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 capitalize">
            {formData.diet || "None selected"}
          </p>
        </div>

        {/* Section 3: Campus & Stay */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <School size={16} className="text-primary-600" />
              University & Stay
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[36px] px-2"
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400">University:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {formData.university}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Visa Type:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                {formData.visaType}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Arrival Date:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {displayArrivalDate}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Optional Bio */}
        <div className="space-y-1.5">
          <label
            htmlFor="bio"
            className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={16} className="text-primary-600" />
              Short Bio (Optional)
            </span>
            <span className="text-xs font-normal text-slate-400">
              {(formData.bio || "").length}/300
            </span>
          </label>

          <textarea
            id="bio"
            rows={3}
            maxLength={300}
            value={formData.bio || ""}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Share a short note about your interests, hobbies, or what you are excited about studying in India..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
          />
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          loading={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full mt-4"
        >
          {isEditMode ? "Save Changes & Return to Dashboard" : "Start My Journey"}
        </Button>
      </div>
    </div>
  );
}

