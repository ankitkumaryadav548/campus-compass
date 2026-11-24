"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import Pagination from "@/components/modules/admin/shared/Pagination";
import StatusBadge from "@/components/modules/admin/shared/StatusBadge";
import ConfirmDialog from "@/components/modules/admin/shared/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { GraduationCap, UserX, UserCheck, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [senior, setSenior] = useState("all");
  const [status, setStatus] = useState("all");
  const [actionTarget, setActionTarget] = useState(null); // { user, action }
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      if (search) params.set("search", search);
      if (role && role !== "all") params.set("role", role);
      if (senior && senior !== "all") params.set("senior", senior);
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
        setPagination(json.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, role, senior, status]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleExecuteAction = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${actionTarget.user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionTarget.action }),
      });
      if (res.ok) {
        setActionTarget(null);
        loadUsers(pagination.page);
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Student Name & Email",
      cell: (row) => (
        <div className="space-y-0.5 py-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{row.name}</span>
            {row.role === "admin" && (
              <Badge variant="neutral" className="text-[10px] gap-1 font-bold">
                <Shield size={10} /> Admin
              </Badge>
            )}
            {row.isSenior && (
              <Badge variant="info" className="text-[10px] gap-1 font-bold">
                <GraduationCap size={10} /> Senior Buddy
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Country",
      cell: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.country || "Not specified"}
        </span>
      ),
    },
    {
      header: "Role",
      cell: (row) => (
        <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-300">
          {row.role}
        </span>
      ),
    },
    {
      header: "Account Status",
      cell: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} />,
    },
    {
      header: "Joined On",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => {
        const isAdmin = row.role === "admin";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setActionTarget({
                    user: row,
                    action: row.isSenior ? "unset_senior" : "set_senior",
                  })
                }
                className="text-xs text-slate-600 dark:text-slate-300"
              >
                {row.isSenior ? "Revoke Senior" : "Make Senior"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setActionTarget({
                  user: row,
                  action: row.isActive ? "deactivate" : "reactivate",
                })
              }
              className={`text-xs ${
                row.isActive ? "text-danger-600 hover:text-danger-700" : "text-success-600 hover:text-success-700"
              }`}
            >
              {row.isActive ? "Deactivate" : "Reactivate"}
            </Button>
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
            User Directory & Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student registrations, peer buddy recognition, and account deactivations.
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search students by name or email (press Enter)..."
        filters={[
          {
            id: "role",
            value: role,
            onChange: setRole,
            options: [
              { label: "All Roles", value: "all" },
              { label: "Students", value: "student" },
              { label: "Buddies", value: "buddy" },
              { label: "Admins", value: "admin" },
            ],
          },
          {
            id: "senior",
            value: senior,
            onChange: setSenior,
            options: [
              { label: "Senior Status: Any", value: "all" },
              { label: "Senior Buddies Only", value: "true" },
              { label: "Standard Students", value: "false" },
            ],
          },
          {
            id: "status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All Accounts", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setRole("all");
          setSenior("all");
          setStatus("all");
        }}
      />

      <DataTable
        columns={columns}
        data={users}
        emptyMessage="No users found matching your criteria"
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.pageSize || 20}
        onPageChange={(p) => loadUsers(p)}
      />

      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onConfirm={handleExecuteAction}
        loading={actionLoading}
        title={
          actionTarget?.action === "deactivate"
            ? "Deactivate Account"
            : actionTarget?.action === "reactivate"
            ? "Reactivate Account"
            : actionTarget?.action === "set_senior"
            ? "Grant Senior Status"
            : "Revoke Senior Status"
        }
        description={
          actionTarget?.action === "deactivate"
            ? `Are you sure you want to deactivate ${actionTarget?.user?.name}'s account? The user will be logged out and cannot send messages or access university services.`
            : actionTarget?.action === "reactivate"
            ? `Reactivate account for ${actionTarget?.user?.name}? The student will be allowed to log in again.`
            : `Update senior peer mentor status for ${actionTarget?.user?.name}?`
        }
        confirmLabel={
          actionTarget?.action === "deactivate"
            ? "Deactivate User"
            : "Confirm Action"
        }
        confirmVariant={actionTarget?.action === "deactivate" ? "danger" : "primary"}
      />
    </div>
  );
}
