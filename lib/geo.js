// lib/geo.js
// Pure geospatial helpers reusing calculateDistance from lib/utils.js.

import { calculateDistance } from "./utils.js";
import { OSM_CONFIG } from "./osm/config.js";

/**
 * Validates whether latitude and longitude are valid geographical numbers.
 */
export function isValidCoord(lat, lng) {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) return false;
  if (numLat < -90 || numLat > 90) return false;
  if (numLng < -180 || numLng > 180) return false;
  return true;
}

/**
 * Computes an estimated walking time in minutes based on straight-line distance,
 * walking speed, and an urban detour factor.
 */
export function walkingMinutes(distanceKm) {
  if (distanceKm == null || distanceKm <= 0) return 0;
  const { walkingSpeedKmH, detourFactor } = OSM_CONFIG;
  const effectiveDistance = distanceKm * detourFactor;
  const hours = effectiveDistance / walkingSpeedKmH;
  return Math.max(1, Math.round(hours * 60));
}

/**
 * Generates an external OpenStreetMap foot directions URL.
 */
export function directionsUrl(origin, place) {
  if (!origin?.lat || !origin?.lng || !place?.location?.lat || !place?.location?.lng) {
    return "#";
  }
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${origin.lat},${origin.lng};${place.location.lat},${place.location.lng}`;
}

/**
 * Generates a link to view or fix an element on OpenStreetMap.
 */
export function osmElementUrl(osmType, osmId) {
  if (!osmType || !osmId) return "https://www.openstreetmap.org";
  return `https://www.openstreetmap.org/${osmType}/${osmId}`;
}

/**
 * Calculates the center coordinates of the ~500m cache cell for a given coordinate.
 */
export function cellCoords(lat, lng) {
  const p = OSM_CONFIG.cellPrecisionDegrees;
  const cellLat = Math.round(Number(lat) / p) * p;
  const cellLng = Math.round(Number(lng) / p) * p;
  return {
    lat: Number(cellLat.toFixed(6)),
    lng: Number(cellLng.toFixed(6)),
  };
}

/**
 * Produces a stable cache cell key by mapping coordinates to the cell center.
 */
export function cellKey(lat, lng, radius) {
  const { lat: cLat, lng: cLng } = cellCoords(lat, lng);
  return `places_${cLat.toFixed(4)}_${cLng.toFixed(4)}_${radius}`;
}

export { calculateDistance };
