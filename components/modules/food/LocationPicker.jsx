// components/modules/food/LocationPicker.jsx
// Compact origin selector with 4 modes: GPS, typed Nominatim search, pin on map, and Campus.
// Coordinates are never logged or stored in the database.

import { useState } from "react";
import {
  Navigation,
  Search,
  MapPin,
  GraduationCap,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { CAMPUS_COORDS, CAMPUS_NAME } from "@/lib/campus";

export default function LocationPicker({
  origin,
  onOriginChange,
  pinModeActive,
  onTogglePinMode,
}) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoAccuracy, setGeoAccuracy] = useState(null);
  const [geoError, setGeoError] = useState(null);

  // Address search state
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [searchError, setSearchError] = useState(null);

  // 1. Browser Geolocation
  const handleUseMyLocation = () => {
    setGeoError(null);
    setSearchError(null);

    if (!navigator.geolocation) {
      setGeoError("Your browser does not support geolocation. Please search for an area or pick on the map.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyM = Math.round(pos.coords.accuracy);
        setGeoAccuracy(accuracyM);

        // Set initial origin so map centers and search begins immediately
        onOriginChange({
          lat,
          lng,
          label: `Locating area…`,
          source: "gps",
        });

        // Resolve exact place or area name via reverse geocoding
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.label && data.label !== "My location") {
              onOriginChange({
                lat,
                lng,
                label: data.label,
                source: "gps",
              });
              setGeoLoading(false);
              return;
            }
          }
        } catch {
          // Graceful fallback to accuracy label
        }

        onOriginChange({
          lat,
          lng,
          label: `My location (±${accuracyM}m)`,
          source: "gps",
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        let msg = "Could not retrieve your location. Try searching for your area or tapping Campus.";
        if (err.code === 1) {
          msg = "Location access was denied. You can search for an address or drop a pin on the map instead.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try searching or dropping a pin.";
        }
        setGeoError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 2. Typed Nominatim search (runs ONLY on Search or Enter)
  const handleRunSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchError("Please type at least 3 characters to search.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setCandidates([]);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Address search service is busy. Try dropping a pin on the map.");
      }

      if (!data.candidates || data.candidates.length === 0) {
        setSearchError(`No places found for "${query}". Try a broader area or city name.`);
        return;
      }

      setCandidates(data.candidates);
    } catch (err) {
      setSearchError(err.message || "Search is busy right now. Please try dropping a pin on the map.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCandidate = (cand) => {
    onOriginChange({
      lat: cand.lat,
      lng: cand.lng,
      label: cand.label.split(",")[0] || cand.label,
      source: "search",
    });
    setCandidates([]);
    setShowSearchInput(false);
    setSearchQuery("");
  };

  // 3. Reset to Campus
  const handleResetToCampus = () => {
    setGeoAccuracy(null);
    setGeoError(null);
    setSearchError(null);
    setCandidates([]);
    onOriginChange({
      lat: CAMPUS_COORDS.lat,
      lng: CAMPUS_COORDS.lng,
      label: CAMPUS_NAME,
      source: "campus",
    });
  };

  const isCampus = origin.source === "campus" || (!origin.source && origin.label === CAMPUS_NAME);

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
      {/* Current Origin Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={13} className="text-primary-600 dark:text-primary-400 shrink-0" aria-hidden="true" />
            <span>Searching around:</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
            {origin.label}
          </p>
        </div>

        {!isCampus && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToCampus}
            leftIcon={<RotateCcw size={12} />}
            className="text-xs self-start sm:self-center text-slate-600 dark:text-slate-300 min-h-[36px]"
          >
            Clear location
          </Button>
        )}
      </div>

      {/* Action Buttons: 4 Location Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Use My Location */}
        <Button
          type="button"
          size="sm"
          variant={origin.source === "gps" ? "primary" : "secondary"}
          loading={geoLoading}
          disabled={geoLoading}
          onClick={handleUseMyLocation}
          leftIcon={<Navigation size={13} />}
          className="w-full text-xs min-h-[42px]"
        >
          {geoLoading ? "Locating…" : "My location"}
        </Button>

        {/* 2. Search a Place */}
        <Button
          type="button"
          size="sm"
          variant={showSearchInput ? "primary" : "secondary"}
          onClick={() => {
            setShowSearchInput((prev) => !prev);
            setSearchError(null);
          }}
          leftIcon={<Search size={13} />}
          className="w-full text-xs min-h-[42px]"
        >
          Search place
        </Button>

        {/* 3. Pin on Map */}
        <Button
          type="button"
          size="sm"
          variant={pinModeActive ? "primary" : "secondary"}
          onClick={onTogglePinMode}
          leftIcon={<MapPin size={13} />}
          className="w-full text-xs min-h-[42px]"
        >
          {pinModeActive ? "Pin active" : "Pin on map"}
        </Button>

        {/* 4. Campus */}
        <Button
          type="button"
          size="sm"
          variant={isCampus ? "primary" : "secondary"}
          onClick={handleResetToCampus}
          leftIcon={<GraduationCap size={13} />}
          className="w-full text-xs min-h-[42px]"
        >
          Campus
        </Button>
      </div>

      {/* Geolocation Feedback / Accuracy */}
      {geoAccuracy && origin.source === "gps" && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle size={11} aria-hidden="true" />
          Location accurate to about {geoAccuracy} meters.
        </p>
      )}

      {/* Geolocation Error Alert */}
      {geoError && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>{geoError}</p>
        </div>
      )}

      {/* Pin-on-map instruction banner */}
      {pinModeActive && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-xs text-primary-800 dark:text-primary-200">
          <MapPin size={14} className="shrink-0 mt-0.5 text-primary-600" aria-hidden="true" />
          <p>Click anywhere on the map or drag the origin pin to set your search center.</p>
        </div>
      )}

      {/* Search Input Dropdown Panel */}
      {showSearchInput && (
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
          <form onSubmit={handleRunSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter area, street or landmark (min 3 chars)…"
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[38px]"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              loading={searching}
              disabled={searching || searchQuery.trim().length < 3}
              className="text-xs min-h-[38px] px-4 shrink-0"
            >
              Search
            </Button>
          </form>

          {/* Search Error */}
          {searchError && (
            <p className="text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1 pt-1">
              <AlertCircle size={12} aria-hidden="true" />
              {searchError}
            </p>
          )}

          {/* Candidate Selection List */}
          {candidates.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Select a matched place:
              </span>
              {candidates.map((cand, idx) => (
                <button
                  key={`${cand.lat}-${cand.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className="w-full text-left text-xs p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <MapPin size={12} className="text-primary-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{cand.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy note */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Your location is used only for this search and is never stored in the database or logged.
      </p>
    </div>
  );
}
