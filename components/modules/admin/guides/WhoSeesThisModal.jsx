"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import StatusBadge from "../shared/StatusBadge";
import SampleBadge from "../shared/SampleBadge";
import { COUNTRIES } from "@/lib/countries";
import { Search } from "lucide-react";

export default function WhoSeesThisModal({ isOpen, onClose }) {
  const [country, setCountry] = useState("NP");
  const [visaType, setVisaType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/guides/visibility?country=${encodeURIComponent(country)}${
        visaType ? `&visaType=${encodeURIComponent(visaType)}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guide Visibility Check" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate what published guides a student sees on their dashboard based on nationality and visa type.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Visa Type (Optional)
            </label>
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="">Any / Not set</option>
              <option value="Student Visa">Student Visa</option>
              <option value="Research Visa">Research Visa</option>
              <option value="Internship Visa">Internship Visa</option>
              <option value="Tourist Visa">Tourist Visa</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={handleTest}
              loading={loading}
              leftIcon={Search}
            >
              Check Visibility
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Matched Guides ({result.matchedGuides?.length || 0})
            </div>
            {result.matchedGuides?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No published guides match this student profile.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {result.matchedGuides.map((g) => (
                  <div
                    key={g._id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{g.title}</span>
                        <SampleBadge isSample={g.isSample} />
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Category: <span className="capitalize">{g.category}</span> · Tags:{" "}
                        {g.applicableRegions?.join(", ") || "ALL"}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      Score: {g.specificityScore ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
