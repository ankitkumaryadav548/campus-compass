"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import StatusBadge from "@/components/modules/admin/shared/StatusBadge";
import SampleBadge from "@/components/modules/admin/shared/SampleBadge";
import WhoSeesThisModal from "@/components/modules/admin/guides/WhoSeesThisModal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, HelpCircle, Edit3, Archive, CheckCircle, Clock } from "lucide-react";
import { isGuideStale } from "@/lib/admin/rules";

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [whoSeesOpen, setWhoSeesOpen] = useState(false);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/guides?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setGuides(json.guides || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  const handleSearchSubmit = () => {
    loadGuides();
  };

  const handleStatusToggle = async (guideId, currentStatus) => {
    const action = currentStatus === "published" ? "archive" : "publish";
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        loadGuides();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: "Title & Details",
      cell: (row) => {
        const stale = isGuideStale(row.lastVerified);
        return (
          <div className="space-y-1 py-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Link
                href={`/admin/guides/${row._id}`}
                className="hover:text-primary-600 transition-colors"
              >
                {row.title}
              </Link>
              <SampleBadge isSample={row.isSample} />
              {stale && (
                <Badge variant="warning" className="text-[10px] flex items-center gap-1">
                  <Clock size={10} /> Needs verification (&gt;90d)
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 max-w-md">
              {row.summary || "No summary"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-300">
          {row.category}
        </span>
      ),
    },
    {
      header: "Applicable Regions",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {(!row.applicableRegions || row.applicableRegions.length === 0) ? (
            <span className="text-xs text-slate-400">ALL</span>
          ) : (
            row.applicableRegions.slice(0, 3).map((r) => (
              <Badge key={r} variant="neutral" className="text-[10px]">
                {r}
              </Badge>
            ))
          )}
          {row.applicableRegions?.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{row.applicableRegions.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status || "published"} />,
    },
    {
      header: "Last Verified",
      cell: (row) => (
        <span className="text-xs text-slate-500">
          {row.lastVerified ? new Date(row.lastVerified).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/admin/guides/${row._id}`}>
            <Button variant="ghost" size="sm" className="p-1.5 text-slate-600" title="Edit guide">
              <Edit3 size={15} />
            </Button>
          </Link>
          {row.status === "published" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusToggle(row._id, row.status)}
              className="p-1.5 text-amber-600 hover:text-amber-700"
              title="Archive guide"
            >
              <Archive size={15} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusToggle(row._id, row.status)}
              className="p-1.5 text-success-600 hover:text-success-700"
              title="Publish guide"
            >
              <CheckCircle size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Guides
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified onboarding instructions and procedures for international students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWhoSeesOpen(true)}
            leftIcon={HelpCircle}
          >
            Who sees this?
          </Button>

          <Link href="/admin/guides/new">
            <Button variant="primary" size="sm" leftIcon={Plus}>
              New Guide
            </Button>
          </Link>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
        }}
        searchPlaceholder="Search guides by title or keywords (press Enter)..."
        filters={[
          {
            id: "category",
            value: category,
            onChange: setCategory,
            options: [
              { label: "All Categories", value: "all" },
              { label: "Bank Account", value: "bank" },
              { label: "SIM & Mobile", value: "sim" },
              { label: "FRRO / Police", value: "frro" },
              { label: "Medical & Health", value: "medical" },
              { label: "Academics", value: "academics" },
              { label: "Campus Life", value: "campus" },
              { label: "Essentials", value: "essentials" },
            ],
          },
          {
            id: "status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
              { label: "Archived", value: "archived" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setCategory("all");
          setStatus("all");
        }}
      />

      <DataTable
        columns={columns}
        data={guides}
        emptyMessage="No guides found matching your filters"
      />

      <WhoSeesThisModal
        isOpen={whoSeesOpen}
        onClose={() => setWhoSeesOpen(false)}
      />
    </div>
  );
}
