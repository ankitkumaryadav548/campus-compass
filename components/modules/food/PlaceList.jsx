// components/modules/food/PlaceList.jsx
// Scrollable container for PlaceCards with count summary, meta notices,
// tier 2 "Diet not confirmed" divider, skeletons, and error/empty states.

import { AlertCircle, RefreshCw, Utensils, Info } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PlaceCard from "./PlaceCard";

export default function PlaceList({
  places = [],
  origin,
  meta,
  dietMode,
  selectedPlace,
  onSelectPlace,
  onOpenDetails,
  loading,
  error,
  onRetry,
  onClearFilters,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48 mb-2" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
          >
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-60" />
            <div className="flex gap-1.5 pt-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-950/40 text-danger-600">
          <AlertCircle size={24} aria-hidden="true" />
        </div>
        <div className="max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Could not load places
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error.message || "Places are temporarily unavailable from OpenStreetMap services. Please try again."}
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={onRetry}
          leftIcon={<RefreshCw size={13} />}
          className="text-xs min-h-[38px]"
        >
          Try again
        </Button>
      </div>
    );
  }

  const radiusKm = meta?.radius ? meta.radius / 1000 : 2;

  if (places.length === 0) {
    return (
      <EmptyState
        icon={<Utensils size={32} />}
        title="No places found"
        description={`No places found within ${radiusKm} km. Try a bigger radius or another location.`}
        action={
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  // Split into tier 1 and tier 2 if in veg/nonveg mode
  const showTierDivider = dietMode === "veg" || dietMode === "nonveg";
  const tier1Places = showTierDivider ? places.filter((p) => p.tier === 1) : places;
  const tier2Places = showTierDivider ? places.filter((p) => p.tier === 2) : [];

  return (
    <div className="space-y-4">
      {/* Count summary and OpenStreetMap notice */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {places.length} {places.length === 1 ? "place" : "places"} within {radiusKm} km
          </span>
          {meta?.truncated && (
            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
              Showing the 150 closest places
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info size={11} className="shrink-0" aria-hidden="true" />
          Data comes from OpenStreetMap contributors and can be incomplete or out of date.
        </p>
      </div>

      {/* Tier 1 Places */}
      <div className="space-y-3">
        {tier1Places.map((place) => (
          <PlaceCard
            key={place.placeKey}
            place={place}
            origin={origin}
            isSelected={selectedPlace?.placeKey === place.placeKey}
            onSelect={() => onSelectPlace(place)}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>

      {/* Tier 2 Divider: "Diet not confirmed" */}
      {showTierDivider && tier2Places.length > 0 && (
        <div className="pt-3 space-y-3">
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700" />
            </div>
            <span className="relative px-3 bg-slate-50 dark:bg-slate-900 text-[11px] font-semibold text-slate-400 dark:text-slate-500 rounded-full">
              Diet not confirmed
            </span>
          </div>

          <div className="space-y-3">
            {tier2Places.map((place) => (
              <PlaceCard
                key={place.placeKey}
                place={place}
                origin={origin}
                isSelected={selectedPlace?.placeKey === place.placeKey}
                onSelect={() => onSelectPlace(place)}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
