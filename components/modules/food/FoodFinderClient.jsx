"use client";
// components/modules/food/FoodFinderClient.jsx
// Client orchestrator for the Food Finder module: handles reactive filtering,
// URL query sync, desktop side-by-side / mobile toggle view, interactive place cards,
// dynamically loaded Leaflet map, and detail review modal.

import { useState, useMemo, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Utensils,
  MapPin,
  Star,
  List,
  Map as MapIcon,
  Info,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FoodFilterBar from "./FoodFilterBar";
import PlaceDetailModal from "./PlaceDetailModal";
import Skeleton from "@/components/ui/Skeleton";

// Dynamic client-only import of FoodMap to prevent Leaflet SSR document errors
const FoodMap = dynamic(() => import("./FoodMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[580px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Loader2 size={24} className="animate-spin text-primary-500" />
        <span className="text-xs">Loading campus map...</span>
      </div>
    </div>
  ),
});

export default function FoodFinderClient({
  initialPlaces,
  filterOptions,
  userCountry,
  campusCoords,
  noContentBannerText,
  currentUserId,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state initialization
  const initialCountryOnly = searchParams.get("forMyCountry") !== "false";
  const initialType = searchParams.get("type") || "";
  const initialCuisine = searchParams.get("cuisine") || "";
  const initialDietParam = searchParams.get("diet") || searchParams.get("dietTags") || "";
  const initialDiets = initialDietParam ? initialDietParam.split(",").filter(Boolean) : [];
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "best_match";
  const initialPlaceId = searchParams.get("place");

  // Local state
  const [places, setPlaces] = useState(initialPlaces);
  const [forMyCountry, setForMyCountry] = useState(initialCountryOnly);
  const [type, setType] = useState(initialType);
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [selectedDiets, setSelectedDiets] = useState(initialDiets);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  // Mobile layout view toggle ("list" | "map")
  const [mobileView, setMobileView] = useState("list");

  // Selection & modal state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeModalPlace, setActiveModalPlace] = useState(null);

  // Auto-open modal if ?place={id} query parameter is present (from dashboard link)
  useEffect(() => {
    if (initialPlaceId && places.length > 0) {
      const target = places.find((p) => p._id === initialPlaceId);
      if (target) {
        setActiveModalPlace(target);
        setSelectedPlace(target);
        setDetailModalOpen(true);
      }
    }
  }, [initialPlaceId, places]);

  // Sync state changes with URL query string
  const updateUrlParams = useCallback(
    (paramsObj) => {
      const current = new URLSearchParams(searchParams.toString());

      for (const [key, val] of Object.entries(paramsObj)) {
        if (!val || (Array.isArray(val) && val.length === 0)) {
          current.delete(key);
        } else if (Array.isArray(val)) {
          current.set(key, val.join(","));
        } else {
          current.set(key, String(val));
        }
      }

      const queryString = current.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch updated places when filters change
  const fetchPlaces = useCallback(async () => {
    const params = new URLSearchParams();
    if (!forMyCountry) params.set("forMyCountry", "false");
    if (type) params.set("type", type);
    if (cuisine) params.set("cuisine", cuisine);
    if (selectedDiets.length > 0) params.set("diet", selectedDiets.join(","));
    if (search.trim()) params.set("search", search.trim());
    if (sort) params.set("sort", sort);

    try {
      const res = await fetch(`/api/places?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPlaces(data.places || []);
      }
    } catch (err) {
      console.error("Error fetching places:", err);
    }
  }, [forMyCountry, type, cuisine, selectedDiets, search, sort]);

  // Refetch on filter change (debounced for search text)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlaces();
      updateUrlParams({
        forMyCountry: forMyCountry ? null : "false",
        type: type || null,
        cuisine: cuisine || null,
        diet: selectedDiets.length > 0 ? selectedDiets : null,
        search: search.trim() || null,
        sort: sort !== "best_match" ? sort : null,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [forMyCountry, type, cuisine, selectedDiets, search, sort, fetchPlaces, updateUrlParams]);

  const handleCountryToggle = (checked) => {
    setForMyCountry(checked);
  };

  const handleDietToggle = (diet) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleClearFilters = () => {
    setType("");
    setCuisine("");
    setSelectedDiets([]);
    setSearch("");
    setSort("best_match");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (type) count++;
    if (cuisine) count++;
    if (selectedDiets.length > 0) count += selectedDiets.length;
    if (search.trim()) count++;
    if (sort !== "best_match") count++;
    return count;
  }, [type, cuisine, selectedDiets, search, sort]);

  const handleOpenDetails = (place) => {
    setActiveModalPlace(place);
    setSelectedPlace(place);
    setDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    // If URL has ?place={id}, remove it cleanly
    if (searchParams.has("place")) {
      const current = new URLSearchParams(searchParams.toString());
      current.delete("place");
      const qs = current.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  };

  const handleReviewSubmitted = (placeId, updatedReviews, newRating, newReviewCount) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p._id === placeId
          ? {
              ...p,
              reviews: updatedReviews,
              rating: newRating,
              reviewCount: newReviewCount,
            }
          : p
      )
    );

    setActiveModalPlace((prev) =>
      prev && prev._id === placeId
        ? {
            ...prev,
            reviews: updatedReviews,
            rating: newRating,
            reviewCount: newReviewCount,
          }
        : prev
    );
  };

  const hasCountryMatch = places.some((p) => p.matchesCountry);

  return (
    <div className="space-y-5">
      {/* Country Filter Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-card">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
            Personalized dining & grocery spots
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing restaurants, canteens, and grocery stores serving campus students.
          </p>
        </div>

        {/* Toggle Switch */}
        <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto select-none">
          <input
            type="checkbox"
            checked={forMyCountry}
            onChange={(e) => handleCountryToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            For {userCountry || "my country"}
          </span>
        </label>
      </div>

      {/* Info Banner when no country-specific places are tagged */}
      {!hasCountryMatch && forMyCountry && noContentBannerText && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50/70 dark:bg-primary-950/20 dark:border-primary-800">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">
            <p className="font-semibold mb-0.5">General campus places</p>
            <p>{noContentBannerText}</p>
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <FoodFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedType={type}
        onTypeChange={setType}
        selectedCuisine={cuisine}
        onCuisineChange={setCuisine}
        selectedDiets={selectedDiets}
        onDietToggle={handleDietToggle}
        selectedSort={sort}
        onSortChange={setSort}
        availableCuisines={filterOptions.cuisines}
        availableDietTags={filterOptions.dietTags}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Mobile View Toggle: List vs Map (hidden on lg: screens) */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
            mobileView === "list"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <List size={14} aria-hidden="true" />
          List view ({places.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
            mobileView === "map"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <MapIcon size={14} aria-hidden="true" />
          Map view
        </button>
      </div>

      {/* Main Content: Split List and Map on desktop, switched on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / List Column */}
        <div
          className={cn(
            "lg:col-span-7 space-y-3",
            mobileView === "map" ? "hidden lg:block" : "block"
          )}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing {places.length} {places.length === 1 ? "place" : "places"}
            </span>
            {isPending && (
              <span className="flex items-center gap-1.5 text-primary-600 font-medium">
                <Loader2 size={12} className="animate-spin" /> Updating...
              </span>
            )}
          </div>

          {places.length === 0 ? (
            <EmptyState
              icon={<Utensils size={32} />}
              title="No places match your filters"
              description="Try clearing some of your dietary or cuisine filters to see more spots around campus."
              action={
                activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {places.map((place) => {
                const isSelected = selectedPlace?._id === place._id;
                const cleanName = place.name.replace(/^\[SAMPLE\]\s*/i, "");

                return (
                  <Card
                    key={place._id}
                    hover
                    onClick={() => {
                      setSelectedPlace(place);
                    }}
                    className={cn(
                      "p-4 transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "border-primary-500 dark:border-primary-400 ring-2 ring-primary-500/20 shadow-md"
                        : "hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cleanName}
                          </h3>
                          <Badge variant="neutral" className="text-[10px] capitalize">
                            {place.type}
                          </Badge>
                          {place.matchesCountry && (
                            <Badge variant="info" className="text-[10px]">
                              For {userCountry} students
                            </Badge>
                          )}
                        </div>

                        {place.address && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={11} className="shrink-0" />
                            {place.address}
                          </p>
                        )}
                      </div>

                      {/* Rating & Distance */}
                      <div className="text-right shrink-0">
                        {place.rating > 0 && (
                          <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span>{place.rating}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({place.reviewCount})
                            </span>
                          </div>
                        )}
                        {place.distanceKm != null && (
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">
                            {place.distanceKm} km
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tags & Action row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap gap-1">
                        {place.cuisine?.slice(0, 3).map((c) => (
                          <Badge key={c} variant="neutral" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                        {place.dietTags?.map((d) => (
                          <Badge key={d} variant="success" className="text-[10px] capitalize">
                            {d}
                          </Badge>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(place);
                        }}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline min-h-[32px] px-1"
                      >
                        View details & reviews →
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right / Map Column */}
        <div
          className={cn(
            "lg:col-span-5 lg:sticky lg:top-24",
            mobileView === "list" ? "hidden lg:block" : "block"
          )}
        >
          <FoodMap
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onOpenDetails={(p) => handleOpenDetails(p)}
            campusCoords={campusCoords}
          />
        </div>
      </div>

      {/* Place Details Modal */}
      <PlaceDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseModal}
        place={activeModalPlace}
        currentUserId={currentUserId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
