"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import Pagination from "@/components/modules/admin/shared/Pagination";
import Badge from "@/components/ui/Badge";
import { History, Shield } from "lucide-react";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (action && action !== "all") params.set("action", action);

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const columns = [
    {
      header: "Timestamp",
      cell: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Admin",
      cell: (row) => (
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
          {row.adminName || "System Admin"}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (row) => (
        <Badge variant="info" className="text-[11px] font-mono">
          {row.action}
        </Badge>
      ),
    },
    {
      header: "Target",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.targetType}:{" "}
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {row.targetName || row.targetId}
          </span>
        </div>
      ),
    },
    {
      header: "Details / Note",
      cell: (row) => {
        const details = row.details || {};
        return (
          <div className="text-xs text-slate-500 max-w-xs truncate font-mono">
            {JSON.stringify(details)}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Immutable Activity Audit Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete, tamper-proof record of all administrative changes and moderation actions.
          </p>
        </div>
      </div>

      <FilterBar
        filters={[
          {
            id: "action",
            value: action,
            onChange: setAction,
            options: [
              { label: "All Actions", value: "all" },
              { label: "Guide Created", value: "guide_created" },
              { label: "Guide Updated", value: "guide_updated" },
              { label: "Guide Status Changed", value: "guide_status_changed" },
              { label: "Checklist Created", value: "checklist_created" },
              { label: "Checklist Updated", value: "checklist_updated" },
              { label: "Checklist Deleted", value: "checklist_deleted" },
              { label: "Event Created", value: "event_created" },
              { label: "Event Updated", value: "event_updated" },
              { label: "Event Deleted", value: "event_deleted" },
              { label: "Food Diet Labelled", value: "food_diet_labelled" },
              { label: "Report Dismissed", value: "report_dismissed" },
              { label: "Report Reviewed", value: "report_reviewed" },
              { label: "User Deactivated", value: "user_deactivated" },
              { label: "User Reactivated", value: "user_reactivated" },
              { label: "Senior Granted", value: "senior_granted" },
              { label: "Senior Revoked", value: "senior_revoked" },
            ],
          },
        ]}
        onClear={() => setAction("all")}
      />

      <DataTable
        columns={columns}
        data={logs}
        emptyMessage="No audit logs recorded for this action"
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.pageSize || 20}
        onPageChange={(p) => loadLogs(p)}
      />
    </div>
  );
}
