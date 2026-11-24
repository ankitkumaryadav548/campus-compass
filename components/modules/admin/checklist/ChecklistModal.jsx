"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RegionTagInput from "../shared/RegionTagInput";
import StringListEditor from "../shared/StringListEditor";
import { ADMIN_CONFIG } from "@/lib/admin/config";

export default function ChecklistModal({ isOpen, onClose, onSaved, item = null }) {
  const isEdit = Boolean(item?._id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "before_arrival",
    applicableRegions: ["ALL"],
    applicableVisaTypes: [],
    isEssential: true,
    priority: 1,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        category: item.category || "before_arrival",
        applicableRegions: item.applicableRegions || ["ALL"],
        applicableVisaTypes: item.applicableVisaTypes || [],
        isEssential: item.isEssential !== undefined ? item.isEssential : true,
        priority: item.priority || 1,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        category: "before_arrival",
        applicableRegions: ["ALL"],
        applicableVisaTypes: [],
        isEssential: true,
        priority: 1,
      });
    }
    setError("");
  }, [item, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit ? `/api/admin/checklist/${item._id}` : "/api/admin/checklist";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(", "));
        }
        throw new Error(data.error || "Failed to save checklist item");
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Checklist Item" : "New Checklist Item"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl text-xs text-danger-700 dark:text-danger-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Register with Local Police / FRRO"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase"
          >
            {ADMIN_CONFIG.CHECKLIST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Instructions or key information for completing this task..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <RegionTagInput
          value={formData.applicableRegions}
          onChange={(tags) => setFormData({ ...formData, applicableRegions: tags })}
        />

        <StringListEditor
          label="Applicable Visa Types"
          placeholder="e.g. Student Visa"
          value={formData.applicableVisaTypes}
          onChange={(types) => setFormData({ ...formData, applicableVisaTypes: types })}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isEssential"
            checked={formData.isEssential}
            onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isEssential" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Mark as Essential Task (Highlight in student dashboard)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            {isEdit ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
