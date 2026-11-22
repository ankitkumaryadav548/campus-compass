"use client";
// components/modules/food/FoodFinder.jsx
// Main stateful orchestrator for the OpenStreetMap Food Finder module.
// Manages origin, server queries on origin/radius change, instant client filtering, and responsive map/list layout.

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon, Loader2 } from "lucide-react";
import { CAMPUS_COORDS, CAMPUS_NAME } from "@/lib/campus";
import { OSM_CONFIG } from "@/lib/osm/config";
import { defaultDietFilter, filterAndSortPlaces, cuisineOptions } from "@/lib/placeFilters";
import LocationPicker from "./LocationPicker";
import FoodFilters from "./FoodFilters";
import PlaceList from "./PlaceList";
import PlaceDetailModal from "./PlaceDetailModal";

const STORAGE_KEY = "campus_compass_food_origin";

function getInitialOrigin() {
  if (typeof window === "undefined") {
    return { lat: CAMPUS_COORDS.lat, lng: CAMPUS_COORDS.lng, label: CAMPUS_NAME, source: "campus" };
  }
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.lat != null && parsed?.lng != null) return parsed;
    }
  } catch {
    // sessionStorage disabled or unavailable
  }
  return { lat: CAMPUS_COORDS.lat, lng: CAMPUS_COORDS.lng, label: CAMPUS_NAME, source: "campus" };
}

// Dynamically import Leaflet map with SSR false to prevent window/document undefined errors
const FoodMap = dynamic(() => import("./FoodMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[600px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Loader2 size={24} className="animate-spin text-primary-500" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  ),
});

export default function FoodFinder({ savedDiet = null, currentUserId }) {
  // Origin state
  const [origin, setOrigin] = useState(getInitialOrigin);
  const [pinModeActive, setPinModeActive] = useState(false);

  // Search radius (server fetch trigger)
  const [radius, setRadius] = useState(OSM_CONFIG.defaultRadiusMeters);

  // Server data state
  const [rawPlaces, setRawPlaces] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Client filter states (instant, zero network requests)
  const [diet, setDiet] = useState(() => defaultDietFilter(savedDiet));
  const [hideUnconfirmed, setHideUnconfirmed] = useState(false);
  const [type, setType] = useState("all");
  const [cuisine, setCuisine] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("best");

  // Selection & Modal states
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [modalPlace, setModalPlace] = useState(null);

  // Mobile layout toggle: "list" | "map"
  const [mobileView, setMobileView] = useState("list");

  // Track request sequence to discard stale responses and avoid React Strict Mode duplicate fetch
  const requestIdRef = useRef(0);
  const isInitialMount = useRef(true);

  // Save origin changes to sessionStorage
  const handleOriginChange = useCallback((newOrigin) => {
    setOrigin(newOrigin);
    setPinModeActive(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newOrigin));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Fetch nearby places when origin coordinates or radius change
  const fetchPlaces = useCallback(async (currentOrigin, currentRadius) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const params = new URLSearchParams({
        lat: String(currentOrigin.lat),
        lng: String(currentOrigin.lng),
        radius: String(currentRadius),
        label: currentOrigin.label || "",
      });

      const res = await fetch(`/api/places/nearby?${params.toString()}`, {
        signal: controller.signal,
      });

      const data = await res.json();

      // Discard response if a newer request was issued
      if (reqId !== requestIdRef.current) return;

      if (!res.ok) {
        const err = new Error(data.error || "Places are temporarily unavailable.");
        err.code = data.code;
        throw err;
      }

      setRawPlaces(data.places || []);
      setMeta(data.meta || null);
    } catch (err) {
      if (reqId === requestIdRef.current && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPlaces(origin, radius);
  }, [origin.lat, origin.lng, radius, fetchPlaces]);

  // Available cuisines from loaded places
  const availableCuisines = useMemo(() => cuisineOptions(rawPlaces), [rawPlaces]);

  // Instant client-side filtering and sorting
  const visiblePlaces = useMemo(() => {
    return filterAndSortPlaces(rawPlaces, {
      type,
      diet,
      hideUnconfirmed,
      cuisine,
      search,
      sort,
    });
  }, [rawPlaces, type, diet, hideUnconfirmed, cuisine, search, sort]);

  // Active filter count for the badge/clear button
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (diet !== defaultDietFilter(savedDiet)) count++;
    if (hideUnconfirmed) count++;
    if (type !== "all") count++;
    if (cuisine) count++;
    if (search.trim()) count++;
    if (sort !== "best") count++;
    return count;
  }, [diet, hideUnconfirmed, type, cuisine, search, sort, savedDiet]);

  const handleClearFilters = useCallback(() => {
    setDiet(defaultDietFilter(savedDiet));
    setHideUnconfirmed(false);
    setType("all");
    setCuisine("");
    setSearch("");
    setSort("best");
  }, [savedDiet]);

  // Update reviews locally after user submits a review
  const handleReviewSubmitted = useCallback((placeKey, newRatingAvg, newCount) => {
    setRawPlaces((prev) =>
      prev.map((p) =>
        p.placeKey === placeKey
          ? { ...p, ratingAverage: newRatingAvg, reviewCount: newCount }
          : p
      )
    );
  }, []);

  return (
    <div className="space-y-5">
      {/* 1. Location Picker Card */}
      <LocationPicker
        origin={origin}
        onOriginChange={handleOriginChange}
        pinModeActive={pinModeActive}
        onTogglePinMode={() => setPinModeActive((prev) => !prev)}
      />

      {/* 2. Filters Card */}
      <FoodFilters
        diet={diet}
        onDietChange={setDiet}
        hideUnconfirmed={hideUnconfirmed}
        onHideUnconfirmedChange={setHideUnconfirmed}
        type={type}
        onTypeChange={setType}
        radius={radius}
        onRadiusChange={setRadius}
        cuisine={cuisine}
        onCuisineChange={setCuisine}
        availableCuisines={availableCuisines}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Mobile Toggle: List vs Map (rendered below 1024px) */}
      <div className="flex lg:hidden items-center justify-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${
            mobileView === "list"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <List size={14} /> List view
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[38px] ${
            mobileView === "map"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <MapIcon size={14} /> Map view
        </button>
      </div>

      {/* 3. Main Content: List & Map side-by-side on desktop (>=1024px); exactly one on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Place List (always on desktop; mobile if view is 'list') */}
        <div className={`lg:col-span-7 space-y-4 ${mobileView === "map" ? "hidden lg:block" : "block"}`}>
          <PlaceList
            places={visiblePlaces}
            origin={origin}
            meta={meta}
            dietMode={diet}
            selectedPlace={selectedPlace}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              if (window.innerWidth < 1024) setMobileView("map");
            }}
            onOpenDetails={(place) => setModalPlace(place)}
            loading={loading}
            error={error}
            onRetry={() => fetchPlaces(origin, radius)}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Right column: Sticky Map (always on desktop; mobile if view is 'map') */}
        <div className={`lg:col-span-5 lg:sticky lg:top-20 ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
          <FoodMap
            places={visiblePlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(place) => setSelectedPlace(place)}
            onOpenDetails={(place) => setModalPlace(place)}
            origin={origin}
            onOriginChange={handleOriginChange}
            radius={radius}
            pinModeActive={pinModeActive}
          />
        </div>
      </div>

      {/* Place Detail & Review Modal */}
      <PlaceDetailModal
        isOpen={Boolean(modalPlace)}
        onClose={() => setModalPlace(null)}
        place={modalPlace}
        origin={origin}
        currentUserId={currentUserId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
