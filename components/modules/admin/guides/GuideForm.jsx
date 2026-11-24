"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import RegionTagInput from "../shared/RegionTagInput";
import StringListEditor from "../shared/StringListEditor";
import StepsEditor from "../shared/StepsEditor";
import ProvidersEditor from "../shared/ProvidersEditor";
import GuidePreviewModal from "./GuidePreviewModal";
import WhoSeesThisModal from "./WhoSeesThisModal";
import StatusBadge from "../shared/StatusBadge";
import SampleBadge from "../shared/SampleBadge";
import { ADMIN_CONFIG } from "@/lib/admin/config";
import { Eye, HelpCircle, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GuideForm({ initialData = null, isNew = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [whoSeesOpen, setWhoSeesOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "bank",
    slug: initialData?.slug || "",
    summary: initialData?.summary || "",
    estimatedTime: initialData?.estimatedTime || "",
    applicableRegions: initialData?.applicableRegions || ["ALL"],
    applicableVisaTypes: initialData?.applicableVisaTypes || [],
    requiredDocuments: initialData?.requiredDocuments || [],
    steps: initialData?.steps || [{ title: "", detail: "", tip: "" }],
    commonMistakes: initialData?.commonMistakes || [],
    providers: initialData?.providers || [],
    searchTags: initialData?.searchTags || [],
    status: initialData?.status || "draft",
    isSample: initialData?.isSample || false,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (targetStatus) => {
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        ...(targetStatus ? { status: targetStatus } : {}),
      };

      const url = isNew ? "/api/admin/guides" : `/api/admin/guides/${initialData._id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(", "));
        }
        throw new Error(data.error || "Failed to save guide");
      }

      router.push("/admin/guides");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action) => {
    if (isNew || !initialData?._id) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/guides/${initialData._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      setFormData((prev) => ({ ...prev, status: data.guide.status }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/guides"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isNew ? "New Student Guide" : `Edit: ${formData.title || "Guide"}`}
              </h1>
              {!isNew && <StatusBadge status={formData.status} />}
              {!isNew && <SampleBadge isSample={formData.isSample} />}
            </div>
            <p className="text-xs text-slate-500">
              {isNew ? "Draft a guide to help international students." : "Modify guide content or change publication status."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            leftIcon={Eye}
          >
            Preview
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWhoSeesOpen(true)}
            leftIcon={HelpCircle}
          >
            Who sees this?
          </Button>

          {isNew ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSave("draft")}
                loading={loading}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSave("published")}
                loading={loading}
                leftIcon={Save}
              >
                Publish Now
              </Button>
            </>
          ) : (
            <>
              {formData.status === "draft" && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange("publish")}
                  loading={loading}
                >
                  Publish Guide
                </Button>
              )}
              {formData.status === "published" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("archive")}
                  loading={loading}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  Archive Guide
                </Button>
              )}
              {formData.status === "archived" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("publish")}
                  loading={loading}
                >
                  Unarchive & Publish
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSave()}
                loading={loading}
                leftIcon={Save}
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl text-xs text-danger-700 dark:text-danger-300">
          {error}
        </div>
      )}

      {/* Main form grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 cols: Main details, steps, mistakes */}
        <div className="md:col-span-2 space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Basic Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guide Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Opening a Bank Account in India"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase"
                >
                  {ADMIN_CONFIG.GUIDE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Completion Time
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => handleChange("estimatedTime", e.target.value)}
                  placeholder="e.g. 2–3 days, 1 hour"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Summary *
              </label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                placeholder="Brief summary explaining what this guide covers and who needs it..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <StepsEditor
              value={formData.steps}
              onChange={(steps) => handleChange("steps", steps)}
            />
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <StringListEditor
              label="Common Mistakes to Avoid"
              placeholder="e.g. Forgetting to carry 4 passport size photos"
              value={formData.commonMistakes}
              onChange={(mistakes) => handleChange("commonMistakes", mistakes)}
            />
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <ProvidersEditor
              value={formData.providers}
              onChange={(provs) => handleChange("providers", provs)}
            />
          </div>
        </div>

        {/* Right col: Targeting, requirements, metadata */}
        <div className="space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Student Targeting
            </h2>

            <RegionTagInput
              label="Applicable Regions / Countries"
              value={formData.applicableRegions}
              onChange={(tags) => handleChange("applicableRegions", tags)}
            />

            <StringListEditor
              label="Applicable Visa Types"
              placeholder="e.g. Student Visa, Research Visa"
              value={formData.applicableVisaTypes}
              onChange={(types) => handleChange("applicableVisaTypes", types)}
            />
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <StringListEditor
              label="Required Documents"
              placeholder="e.g. Passport copy, Admission letter"
              value={formData.requiredDocuments}
              onChange={(docs) => handleChange("requiredDocuments", docs)}
            />
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <StringListEditor
              label="Search Tags (Keywords)"
              placeholder="e.g. sbi, bank account, kyc"
              value={formData.searchTags}
              onChange={(tags) => handleChange("searchTags", tags)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <GuidePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        guide={formData}
      />

      <WhoSeesThisModal
        isOpen={whoSeesOpen}
        onClose={() => setWhoSeesOpen(false)}
      />
    </div>
  );
}
