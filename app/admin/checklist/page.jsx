"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import ChecklistModal from "@/components/modules/admin/checklist/ChecklistModal";
import ConfirmDialog from "@/components/modules/admin/shared/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminChecklistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/checklist");
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    return true;
  });

  const handleMove = async (index, direction) => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= filteredItems.length) return;

    const newFiltered = [...filteredItems];
    const temp = newFiltered[index];
    newFiltered[index] = newFiltered[targetIdx];
    newFiltered[targetIdx] = temp;

    // Send new orderedIds to reorder API
    const orderedIds = newFiltered.map((it) => it._id);
    try {
      const res = await fetch("/api/admin/checklist/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        loadItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/checklist/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        loadItems();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: "Order",
      className: "w-20",
      cell: (row) => {
        const idx = filteredItems.findIndex((it) => it._id === row._id);
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-bold text-slate-500 w-5">
              {idx + 1}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => handleMove(idx, "up")}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                title="Move up"
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                disabled={idx === filteredItems.length - 1}
                onClick={() => handleMove(idx, "down")}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                title="Move down"
              >
                <ArrowDown size={12} />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: "Title & Description",
      cell: (row) => (
        <div className="space-y-0.5 py-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{row.title}</span>
            {row.isEssential && (
              <Badge variant="warning" className="text-[10px] font-bold">
                Essential
              </Badge>
            )}
          </div>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => (
        <Badge variant="info" className="text-xs uppercase">
          {row.category?.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Applicable Regions",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {(!row.applicableRegions || row.applicableRegions.length === 0) ? (
            <span className="text-xs text-slate-400">ALL</span>
          ) : (
            row.applicableRegions.map((r) => (
              <Badge key={r} variant="neutral" className="text-[10px]">
                {r}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingItem(row);
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-600"
            title="Edit item"
          >
            <Edit3 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-danger-600 hover:text-danger-700"
            title="Delete item"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Arrival Checklist
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard transition steps and official university tasks for international students.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          leftIcon={Plus}
        >
          New Task
        </Button>
      </div>

      <FilterBar
        filters={[
          {
            id: "category",
            value: category,
            onChange: setCategory,
            options: [
              { label: "All Categories", value: "all" },
              { label: "Before Arrival", value: "before_arrival" },
              { label: "First Week", value: "first_week" },
              { label: "First Month", value: "first_month" },
              { label: "Academics", value: "academics" },
            ],
          },
        ]}
        onClear={() => setCategory("all")}
      />

      <DataTable
        columns={columns}
        data={filteredItems}
        emptyMessage="No checklist items found for this category"
      />

      <ChecklistModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSaved={loadItems}
        item={editingItem}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Checklist Item"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove it from all student checklists and delete associated progress records.`}
      />
    </div>
  );
}
