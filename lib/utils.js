// lib/utils.js
// Utility helpers shared across the entire app

import { clsx } from "clsx";

/**
 * cn() – merges Tailwind class strings conditionally.
 * Usage: cn("base-class", condition && "optional-class", { "another": bool })
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Formats a date to a readable string.
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [opts]
 */
export function formatDate(date, opts = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-IN", opts).format(new Date(date));
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to maxLen characters, appending "…".
 */
export function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "…";
}

/**
 * Calculates geographic distance in kilometers between two lat/lng coordinates
 * using the Haversine formula. Returns null if coordinates are incomplete.
 * Output is rounded to one decimal place (e.g. 1.2 km).
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

