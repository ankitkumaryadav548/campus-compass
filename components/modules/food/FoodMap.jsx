"use client";
// components/modules/food/FoodMap.jsx
// Leaflet map component with customized vector markers by place type,
// campus anchor marker, interactive popups, and auto-fit bounding.

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, MapPin } from "lucide-react";
import { CAMPUS_NAME } from "@/lib/campus";

// Custom SVG-based divIcons to avoid bundler image path bugs and provide distinct type styling
function createCustomPin(type, isSelected = false) {
  let bgColor = "#f59e0b"; // restaurant (amber)
  let label = "R";

  if (type === "grocery") {
    bgColor = "#10b981"; // grocery (emerald)
    label = "G";
  } else if (type === "cafeteria") {
    bgColor = "#3b82f6"; // cafeteria (blue)
    label = "C";
  }

  const size = isSelected ? 38 : 30;
  const ring = isSelected ? "box-shadow: 0 0 0 4px #6366f1, 0 8px 16px rgba(0,0,0,0.3);" : "box-shadow: 0 4px 8px rgba(0,0,0,0.2);";

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bgColor};
      color: white;
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      ${ring}
      transition: all 0.2s ease;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: ${isSelected ? 13 : 11}px;
        font-weight: 700;
        letter-spacing: -0.5px;
      ">${label}</span>
    </div>
  `;

  return L.divIcon({
    className: "custom-place-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createCampusPin() {
  const size = 36;
  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: #4f46e5;
      color: white;
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4), 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "custom-campus-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapViewController({ places, selectedPlace, campusCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace?.location?.lat != null && selectedPlace?.location?.lng != null) {
      map.flyTo([selectedPlace.location.lat, selectedPlace.location.lng], 16, {
        duration: 1.2,
      });
      return;
    }

    const validPlaces = places.filter(
      (p) => p.location?.lat != null && p.location?.lng != null
    );

    if (validPlaces.length > 0) {
      const bounds = L.latLngBounds(
        validPlaces.map((p) => [p.location.lat, p.location.lng])
      );
      if (campusCoords?.lat != null && campusCoords?.lng != null) {
        bounds.extend([campusCoords.lat, campusCoords.lng]);
      }
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (campusCoords?.lat != null && campusCoords?.lng != null) {
      map.setView([campusCoords.lat, campusCoords.lng], 15);
    }
  }, [places, selectedPlace, campusCoords, map]);

  return null;
}

export default function FoodMap({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetails,
  campusCoords,
}) {
  const campusIcon = useMemo(() => createCampusPin(), []);

  return (
    <div className="relative w-full h-[400px] lg:h-[580px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-card">
      <MapContainer
        center={[campusCoords.lat, campusCoords.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController
          places={places}
          selectedPlace={selectedPlace}
          campusCoords={campusCoords}
        />

        {/* Campus Marker */}
        <Marker position={[campusCoords.lat, campusCoords.lng]} icon={campusIcon}>
          <Popup>
            <div className="p-1">
              <span className="text-[10px] uppercase font-bold text-primary-600 block mb-0.5">
                University Campus
              </span>
              <p className="text-sm font-bold text-slate-900 m-0 leading-tight">
                {CAMPUS_NAME}
              </p>
              <p className="text-xs text-slate-500 m-0 mt-1">
                Central reference location
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Place Markers */}
        {places.map((place) => {
          if (place.location?.lat == null || place.location?.lng == null) {
            return null;
          }

          const isSelected = selectedPlace?._id === place._id;
          const pinIcon = createCustomPin(place.type, isSelected);

          return (
            <Marker
              key={place._id}
              position={[place.location.lat, place.location.lng]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectPlace?.(place),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[170px]">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 capitalize">
                      {place.type}
                    </span>
                    {place.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {place.rating}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 m-0 mb-1 leading-snug">
                    {place.name.replace(/^\[SAMPLE\]\s*/i, "")}
                  </h4>
                  {place.address && (
                    <p className="text-[11px] text-slate-500 m-0 mb-2 flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      {place.address}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenDetails?.(place)}
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    View details & reviews
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Campus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Restaurant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Grocery Store</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Cafeteria</span>
        </div>
      </div>
    </div>
  );
}
