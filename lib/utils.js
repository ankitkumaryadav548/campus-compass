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

