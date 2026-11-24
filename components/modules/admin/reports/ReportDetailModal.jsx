"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import StatusBadge from "../shared/StatusBadge";
import Badge from "@/components/ui/Badge";
import { AlertTriangle, UserX, CheckCircle, ShieldAlert } from "lucide-react";

export default function ReportDetailModal({ isOpen, onClose, onActionCompleted, report }) {
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!report) return null;

  const handleAction = async (action) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/reports/${report._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update report");
      }

      onActionCompleted?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isClosed = report.status === "reviewed";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Safety Report Review" size="lg">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-xl text-xs text-danger-700 dark:text-danger-300">
            {error}
          </div>
        )}

        {/* Report Overview Box */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={report.status} />
              <Badge variant="warning" className="uppercase font-semibold text-[10px]">
                {report.reason?.replace("_", " ")}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Reported on {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1.5">
              Details Provided by Reporter
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 whitespace-pre-wrap leading-relaxed shadow-xs">
              {report.details || "No additional text provided."}
            </p>
          </div>
        </div>

        {/* User context cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Reported User Profile */}
          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/50 space-y-2">
            <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ShieldAlert size={14} className="text-danger-500" /> Reported User
            </div>
            {report.reportedUser ? (
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {report.reportedUser.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">{report.reportedUser.email}</div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Country: {report.reportedUser.country || "Not set"}
                  </span>
                  <StatusBadge status={report.reportedUser.isActive ? "active" : "inactive"} />
                </div>
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between font-medium">
                  <span className="text-danger-600 dark:text-danger-400">
                    Open reports: {report.reportedUser.openReports ?? 1}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Total reports: {report.reportedUser.totalReports ?? 1}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">User not found or deleted.</p>
            )}
          </div>

          {/* Reporter Profile */}
          <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200/80 dark:border-sky-900/50 space-y-2">
            <div className="font-bold text-sky-900 dark:text-sky-300 text-xs uppercase tracking-wider">
              Reported By
            </div>
            {report.reporter ? (
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {report.reporter.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">{report.reporter.email}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-2">
                  Admins do not read private chat messages or inspect personal chat history.
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">Anonymous or deleted account.</p>
            )}
          </div>
        </div>

        {/* Existing resolution if reviewed */}
        {isClosed && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Resolved: <span className="uppercase text-primary-600 font-bold">{report.resolution}</span>
            </div>
            {report.reviewedBy && (
              <div className="text-slate-500">Reviewed by {report.reviewedBy.name}</div>
            )}
            {report.adminNote && (
              <div className="text-slate-600 dark:text-slate-400 pt-1 italic">
                Note: {report.adminNote}
              </div>
            )}
          </div>
        )}

        {/* Admin note input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Admin Investigation Note (Recorded in Audit Log)
          </label>
          <textarea
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Document action reason, student warning, or office check..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Close
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("dismiss")}
              loading={loading}
              className="text-slate-600 dark:text-slate-400"
            >
              Dismiss (No violation)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAction("review")}
              loading={loading}
              leftIcon={CheckCircle}
            >
              Mark Reviewed
            </Button>
            {report.reportedUser && report.reportedUser.isActive && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleAction("deactivate")}
                loading={loading}
                leftIcon={UserX}
              >
                Deactivate Account
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
