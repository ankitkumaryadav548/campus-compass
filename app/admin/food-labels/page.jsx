"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/modules/admin/shared/DataTable";
import FilterBar from "@/components/modules/admin/shared/FilterBar";
import StatusBadge from "@/components/modules/admin/shared/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Utensils, Check, ExternalLink } from "lucide-react";

export default function AdminFoodLabelsPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState("2000");
  const [unlabelledOnly, setUnlabelledOnly] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (radius) params.set("radius", radius);
      if (search) params.set("search", search);
      if (unlabelledOnly) params.set("unlabelledOnly", "true");

      const res = await fetch(`/api/admin/food-labels?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPlaces(json.places || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [radius, search, unlabelledOnly]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const handleSetLabel = async (placeKey, label) => {
    setSavingKey(placeKey);
    try {
      const res = await fetch(`/api/admin/food-labels/${placeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        // Update state locally
        setPlaces((prev) =>
          prev.map((p) =>
            p.key === placeKey
              ? {
                  ...p,
                  dietLabel: label,
                  dietLabelAt: new Date().toISOString(),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  const columns = [
    {
      header: "Restaurant / Shop",
      cell: (row) => (
        <div className="space-y-0.5 py-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{row.name}</span>
            {row.osmUrl && (
              <a
                href={row.osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-primary-600"
                title="View on OpenStreetMap"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {row.cuisine ? `Cuisine: ${row.cuisine} · ` : ""}
            {row.distance !== null ? `${Math.round(row.distance)}m away` : ""}
          </div>
        </div>
      ),
    },
    {
      header: "OSM Diet Tags",
      cell: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
          <div>Veg tag: <span className="font-mono">{row.diet?.dietVeg || "none"}</span></div>
          <div>Cuisine: <span className="font-mono">{row.diet?.cuisine || "none"}</span></div>
        </div>
      ),
    },
    {
      header: "Verified Status",
      cell: (row) => (
        <StatusBadge status={row.dietLabel || "unlabelled"} />
      ),
    },
    {
      header: "Apply Verified Diet Label",
      className: "text-right",
      cell: (row) => {
        const isSaving = savingKey === row.key;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <select
              disabled={isSaving}
              value={row.dietLabel || ""}
              onChange={(e) => handleSetLabel(row.key, e.target.value || null)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Unlabelled</option>
              <option value="pure_veg">Pure Veg</option>
              <option value="veg_and_nonveg">Veg & Non-Veg</option>
              <option value="nonveg_only">Non-Veg Only</option>
            </select>
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
            Campus Food Labelling
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verify nearby dining spots and eateries around campus with authoritative dietary labels.
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter places by name or cuisine (press Enter)..."
        filters={[
          {
            id: "radius",
            value: radius,
            onChange: setRadius,
            options: [
              { label: "Within 1 km", value: "1000" },
              { label: "Within 2 km", value: "2000" },
              { label: "Within 5 km", value: "5000" },
            ],
          },
          {
            id: "unlabelled",
            value: unlabelledOnly ? "unlabelled" : "all",
            onChange: (val) => setUnlabelledOnly(val === "unlabelled"),
            options: [
              { label: "All Eateries", value: "all" },
              { label: "Unlabelled Only", value: "unlabelled" },
            ],
          },
        ]}
        onClear={() => {
          setSearch("");
          setRadius("2000");
          setUnlabelledOnly(false);
        }}
      />

      <DataTable
        columns={columns}
        data={places}
        emptyMessage="No campus food places found in this radius"
      />
    </div>
  );
}
