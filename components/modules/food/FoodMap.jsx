"use client";
// components/modules/food/FoodMap.jsx
// Leaflet map with origin marker, radius circle, diet-colored place pins, and map pin mode.

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Star, MapPin } from "lucide-react";

function getPlaceColor(place) {
  if (place.kind === "grocery") return "#8b5cf6"; // Purple for groceries
  const vegLevel = place.diet?.vegLevel;
  const nonVegLikely = place.diet?.nonVegLikely;

  if (vegLevel === "only" || vegLevel === "options") {
    return "#10b981"; // Emerald green for veg
  }
  if (nonVegLikely) {
    return "#f43f5e"; // Rose for non-veg likely
  }
  return "#64748b"; // Slate grey for unconfirmed
}

function createPlacePin(place, isSelected = false) {
  const color = getPlaceColor(place);
  const size = isSelected ? 36 : 28;
  const ring = isSelected
    ? "box-shadow: 0 0 0 4px #6366f1, 0 6px 14px rgba(0,0,0,0.35);"
    : "box-shadow: 0 3px 8px rgba(0,0,0,0.25);";

  const label = place.kind === "grocery" ? "G" : "F";

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
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
      ">${label}</span>
    </div>
  `;

  return L.divIcon({
    className: "custom-osm-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createOriginPin() {
  const size = 32;
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
      box-shadow: 0 0 0 5px rgba(79, 70, 229, 0.35), 0 4px 10px rgba(0,0,0,0.3);
      cursor: grab;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-origin-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapViewController({ places, selectedPlace, origin }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (selectedPlace?.location?.lat != null && selectedPlace?.location?.lng != null) {
      map.flyTo([selectedPlace.location.lat, selectedPlace.location.lng], 16, {
        duration: 1.0,
      });
      return;
    }

    const validPlaces = places.filter(
      (p) => p.location?.lat != null && p.location?.lng != null
    );

    if (validPlaces.length > 0 && origin?.lat != null && origin?.lng != null) {
      const bounds = L.latLngBounds(
        validPlaces.map((p) => [p.location.lat, p.location.lng])
      );
      bounds.extend([origin.lat, origin.lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (origin?.lat != null && origin?.lng != null) {
      map.setView([origin.lat, origin.lng], 14);
    }
  }, [places, selectedPlace, origin, map]);

  return null;
}

function MapClickHandler({ pinModeActive, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (pinModeActive) {
        onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function FoodMap({
  places = [],
  selectedPlace,
  onSelectPlace,
  onOpenDetails,
  origin,
  onOriginChange,
  radius = 2000,
  pinModeActive = false,
}) {
  const originIcon = useMemo(() => createOriginPin(), []);
  const containerRef = useRef(null);

  // Clean up any lingering Leaflet ID on fast refresh
  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (el) {
        const leafletEl = el.querySelector(".leaflet-container");
        if (leafletEl && leafletEl._leaflet_id) {
          delete leafletEl._leaflet_id;
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <MapContainer
        center={[origin.lat, origin.lng]}
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
          origin={origin}
        />

        <MapClickHandler
          pinModeActive={pinModeActive}
          onMapClick={(coords) => {
            onOriginChange?.({
              lat: coords.lat,
              lng: coords.lng,
              label: "Pinned location",
              source: "pin",
            });
            fetch(`/api/geocode?lat=${coords.lat}&lng=${coords.lng}`)
              .then((r) => r.ok && r.json())
              .then((data) => {
                if (data?.label && data.label !== "My location") {
                  onOriginChange?.({
                    lat: coords.lat,
                    lng: coords.lng,
                    label: data.label,
                    source: "pin",
                  });
                }
              })
              .catch(() => {});
          }}
        />

        {/* Origin Marker & Radius Circle */}
        {origin?.lat != null && origin?.lng != null && (
          <>
            <Circle
              center={[origin.lat, origin.lng]}
              radius={radius}
              pathOptions={{
                color: "#6366f1",
                fillColor: "#6366f1",
                fillOpacity: 0.07,
                weight: 1.5,
                dashArray: "4 4",
              }}
            />
            <Marker
              position={[origin.lat, origin.lng]}
              icon={originIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  onOriginChange?.({
                    lat: latlng.lat,
                    lng: latlng.lng,
                    label: "Pinned location",
                    source: "pin",
                  });
                  fetch(`/api/geocode?lat=${latlng.lat}&lng=${latlng.lng}`)
                    .then((r) => r.ok && r.json())
                    .then((data) => {
                      if (data?.label && data.label !== "My location") {
                        onOriginChange?.({
                          lat: latlng.lat,
                          lng: latlng.lng,
                          label: data.label,
                          source: "pin",
                        });
                      }
                    })
                    .catch(() => {});
                },
              }}
            >
              <Popup>
                <div className="p-1 text-center">
                  <span className="text-[10px] uppercase font-bold text-primary-600 block mb-0.5">
                    Search Center
                  </span>
                  <p className="text-xs font-bold text-slate-900 m-0 leading-tight">
                    {origin.label || "Origin"}
                  </p>
                  <p className="text-[10px] text-slate-500 m-0 mt-0.5">
                    Drag pin or click map to move
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Place Markers */}
        {places.map((place) => {
          if (place.location?.lat == null || place.location?.lng == null) return null;

          const isSelected = selectedPlace?.placeKey === place.placeKey;
          const pinIcon = createPlacePin(place, isSelected);

          return (
            <Marker
              key={place.placeKey}
              position={[place.location.lat, place.location.lng]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectPlace?.(place),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[170px]">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 capitalize">
                      {place.kind}
                    </span>
                    {place.reviewCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {place.ratingAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 m-0 mb-1 leading-snug">
                    {place.name}
                  </h4>
                  <p className="text-[11px] text-primary-700 font-medium m-0 mb-2">
                    about {place.distanceKm} km away
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenDetails?.(place)}
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Search origin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Pure veg / Veg options</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Non-veg likely</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Diet not confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">Grocery store</span>
        </div>
      </div>
    </div>
  );
}
