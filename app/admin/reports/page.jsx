"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import Pagination from "@/components/modules/admin/shared/Pagination";
import StatusBadge from "@/components/modules/admin/shared/StatusBadge";
import ReportDetailModal from "@/components/modules/admin/reports/ReportDetailModal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Eye, ShieldAlert } from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [status, setStatus] = useState("open");
  const [reason, setReason] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  const loadReports = useCallback(async (page = 1) => {
    setLoading(true);
    setFetchError("");
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (status) params.set("status", status);
      if (reason && reason !== "all") params.set("reason", reason);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
        setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        const errJson = await res.json().catch(() => ({}));
        setFetchError(errJson.error || "Failed to load reports");
      }
    } catch (err) {
      console.error("Network or fetch error:", err);
      setFetchError("Network error while loading reports");
    } finally {
      setLoading(false);
    }
  }, [status, reason]);

  useEffect(() => {
    loadReports(1);
  }, [loadReports]);

  const columns = [
    {
      header: "Reported Student",
      cell: (row) => (
        <div className="space-y-0.5 py-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-danger-500" />
            <span>{row.reportedUser?.name || "Unknown User"}</span>
            {row.reportedUser?.openReports > 1 && (
              <Badge variant="danger" className="text-[10px]">
                {row.reportedUser.openReports} open
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {row.reportedUser?.email} · {row.reportedUser?.country || "No country"}
          </div>
        </div>
      ),
    },
    {
      header: "Reason",
      cell: (row) => (
        <Badge variant="warning" className="text-xs uppercase font-semibold">
          {row.reason?.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Details",
      cell: (row) => (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-sm">
          {row.details || "No details provided"}
        </p>
      ),
    },
    {
      header: "Reported By",
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.reporter?.name || "Anonymous"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Reported On",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedReport(row)}
          leftIcon={Eye}
        >
          Review
        </Button>
      ),
    },
  ];

  const renderMobileCard = (row) => {
    const isOpen = row.status === "open";
    return (
      <div
        className={`p-4 rounded-xl border transition-all ${
          isOpen
            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 shadow-xs"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <ShieldAlert size={14} className="text-danger-500 shrink-0" />
              <span>{row.reportedUser?.name || "Unknown User"}</span>
              {row.reportedUser?.openReports > 1 && (
                <Badge variant="danger" className="text-[10px]">
                  {row.reportedUser.openReports} open
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {row.reportedUser?.email} · {row.reportedUser?.country || "No country"}
            </div>
          </div>
          <StatusBadge status={row.status} />
        </div>

        <div className="py-2.5 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Reason:</span>
            <Badge variant="warning" className="text-[10px] uppercase font-semibold">
              {row.reason?.replace("_", " ")}
            </Badge>
          </div>
          {row.details && (
            <p className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
              {row.details}
            </p>
          )}
          <div className="flex justify-between items-center text-slate-500 text-[11px] pt-0.5">
            <span>Reported by: <span className="text-slate-700 dark:text-slate-300 font-medium">{row.reporter?.name || "Anonymous"}</span></span>
            <span>{new Date(row.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedReport(row)}
            leftIcon={Eye}
          >
            Review Report
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Safety & Moderation Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student safety reports and conduct moderation. Admins never read private chat contents.
          </p>
        </div>
      </div>

      <FilterBar
        filters={[
          {
            id: "status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "Open Reports", value: "open" },
              { label: "Reviewed Reports", value: "reviewed" },
              { label: "All Reports", value: "all" },
            ],
          },
          {
            id: "reason",
            value: reason,
            onChange: setReason,
            options: [
              { label: "All Reasons", value: "all" },
              { label: "Spam / Commercial", value: "spam" },
              { label: "Harassment", value: "harassment" },
              { label: "Inappropriate Content", value: "inappropriate" },
              { label: "Fake Profile", value: "fake_profile" },
              { label: "Safety Concern", value: "safety_concern" },
              { label: "Other", value: "other" },
            ],
          },
        ]}
        onClear={() => {
          setStatus("open");
          setReason("all");
        }}
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading moderation reports...</p>
        </div>
      ) : fetchError ? (
        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl flex items-center justify-between gap-4">
          <p className="text-xs text-danger-700 dark:text-danger-300 font-medium">
            {fetchError}
          </p>
          <Button size="sm" variant="outline" onClick={() => loadReports(pagination.page)}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Reports Log
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {pagination.total} {pagination.total === 1 ? "report" : "reports"} total
            </span>
          </div>
          <DataTable
            columns={columns}
            data={reports}
            renderMobileCard={renderMobileCard}
            emptyMessage="No reports found"
          />
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.pageSize || 20}
        onPageChange={(p) => loadReports(p)}
      />

      <ReportDetailModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        onActionCompleted={() => loadReports(pagination.page)}
        report={selectedReport}
      />
    </div>
  );
}
