// lib/osm/overpass.js
// Handles Overpass QL construction, resilient HTTP fetching with endpoint fallback,
// element parsing, and single-element verification.

import { OSM_CONFIG } from "./config.js";
import { classifyDiet } from "./dietClassifier.js";
import { calculateDistance } from "../geo.js";

function getUserAgent() {
  return process.env.OSM_USER_AGENT || OSM_CONFIG.defaultUserAgent;
}

// In-memory map of endpoint URL to blocked-until timestamp (ms) after HTTP 429
const endpointBlockedUntil = new Map();

function hasOverpassErrorRemark(json) {
  if (!json || typeof json.remark !== "string") return false;
  const remark = json.remark.toLowerCase();
  return (
    remark.includes("runtime error") ||
    remark.includes("timed out") ||
    remark.includes("out of memory")
  );
}

/**
 * Builds an Overpass QL query targeting named food places and grocery shops around a center.
 */
export function buildOverpassQuery(lat, lng, radius) {
  const foodRegex = `^(${OSM_CONFIG.foodAmenities.join("|")})$`;
  const groceryRegex = `^(${OSM_CONFIG.groceryShops.join("|")})$`;

  return `
[out:json][timeout:${OSM_CONFIG.overpassQueryTimeoutSec}];
(
  node(around:${radius},${lat},${lng})["name"]["amenity"~"${foodRegex}"];
  way(around:${radius},${lat},${lng})["name"]["amenity"~"${foodRegex}"];
  relation(around:${radius},${lat},${lng})["name"]["amenity"~"${foodRegex}"];

  node(around:${radius},${lat},${lng})["name"]["shop"~"${groceryRegex}"];
  way(around:${radius},${lat},${lng})["name"]["shop"~"${groceryRegex}"];
  relation(around:${radius},${lat},${lng})["name"]["shop"~"${groceryRegex}"];
);
out center tags ${OSM_CONFIG.overpassElementLimit};
  `.trim();
}

/**
 * Builds a query to fetch a single OSM element by type and ID.
 */
export function buildSingleElementQuery(osmType, osmId) {
  return `
[out:json][timeout:${OSM_CONFIG.overpassQueryTimeoutSec}];
${osmType}(${osmId});
out center tags;
  `.trim();
}

/**
 * Formats addr:* tags into a human-readable address line.
 */
function buildAddress(tags = {}) {
  const parts = [];
  const house = tags["addr:housenumber"];
  const street = tags["addr:street"];
  const suburb = tags["addr:suburb"] || tags["addr:neighbourhood"];
  const city = tags["addr:city"];
  const postcode = tags["addr:postcode"];

  if (house && street) {
    parts.push(`${house} ${street}`);
  } else if (street) {
    parts.push(street);
  } else if (house) {
    parts.push(house);
  }

  if (suburb) parts.push(suburb);
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);

  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Normalises a raw Overpass element into our internal place structure.
 */
function normalizeElement(elem) {
  const tags = elem.tags || {};
  const name = tags.name?.trim();
  if (!name) return null;

  // Resolve coordinate (ways/relations output `center` with out center)
  const lat = elem.lat ?? elem.center?.lat;
  const lng = elem.lon ?? elem.center?.lon;
  if (lat == null || lng == null) return null;

  const osmType = elem.type; // "node" | "way" | "relation"
  const osmId = Number(elem.id);
  const placeKey = `${osmType}-${osmId}`;

  const isGrocery = Boolean(tags.shop && OSM_CONFIG.groceryShops.includes(tags.shop));
  const kind = isGrocery ? "grocery" : "food";

  // Parse cuisines
  let cuisines = [];
  if (tags.cuisine) {
    cuisines = tags.cuisine
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  const address = buildAddress(tags);
  const openingHours = tags.opening_hours ? String(tags.opening_hours).trim() : null;
  const diet = isGrocery ? { vegLevel: "unknown", nonVegLikely: false } : classifyDiet(tags);

  return {
    osmType,
    osmId,
    placeKey,
    name,
    kind,
    cuisines,
    address,
    openingHours,
    location: { lat: Number(lat), lng: Number(lng) },
    diet,
  };
}

/**
 * Fetches places from Overpass API, attempting configured endpoints in order.
 */
export async function fetchPlacesAround(lat, lng, radius) {
  const query = buildOverpassQuery(lat, lng, radius);
  const userAgent = getUserAgent();
  const failures = [];

  for (const endpoint of OSM_CONFIG.overpassEndpoints) {
    // Skip endpoint if currently in cooldown after receiving HTTP 429
    const blockedUntil = endpointBlockedUntil.get(endpoint) || 0;
    if (Date.now() < blockedUntil) {
      failures.push(`${endpoint}: skipped (cooling down after HTTP 429)`);
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSM_CONFIG.overpassClientTimeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "*/*",
          "User-Agent": userAgent,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // On 429, place this endpoint in 30s cooldown and advance to next mirror
      if (res.status === 429) {
        const cooldownMs = (OSM_CONFIG.endpointCooldownSec || 30) * 1000;
        endpointBlockedUntil.set(endpoint, Date.now() + cooldownMs);
        failures.push(`${endpoint}: HTTP 429 (rate limited, cooldown for ${OSM_CONFIG.endpointCooldownSec || 30}s)`);
        continue;
      }

      // Treat HTTP 406, 5xx, or any other non-OK status as failed attempt
      if (res.status === 406 || res.status >= 500 || !res.ok) {
        failures.push(`${endpoint}: HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();

      // Empty body
      if (!text || !text.trim()) {
        failures.push(`${endpoint}: empty body`);
        continue;
      }

      // Non-JSON body
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        failures.push(`${endpoint}: non-JSON body`);
        continue;
      }

      // Remark error (e.g. server timed out or out of memory) even if elements are present
      if (hasOverpassErrorRemark(json)) {
        failures.push(`${endpoint}: remark error (${json.remark.trim()})`);
        continue;
      }

      // JSON without an "elements" array
      if (!json || !Array.isArray(json.elements)) {
        failures.push(`${endpoint}: missing elements array`);
        continue;
      }

      const elements = json.elements;
      const normalized = [];
      for (const el of elements) {
        const item = normalizeElement(el);
        if (item) normalized.push(item);
      }

      // Sort candidate places by distance from the cell center ascending
      // so the closest places are always retained before applying the cache cap
      normalized.sort((a, b) => {
        const distA = calculateDistance(lat, lng, a.location.lat, a.location.lng) ?? 9999;
        const distB = calculateDistance(lat, lng, b.location.lat, b.location.lng) ?? 9999;
        return distA - distB;
      });

      const rawCount = normalized.length;
      const truncated = rawCount > OSM_CONFIG.maxCachedPlaces || elements.length >= OSM_CONFIG.overpassElementLimit;
      const places = normalized.slice(0, OSM_CONFIG.maxCachedPlaces);

      return { places, rawCount, truncated };
    } catch (err) {
      clearTimeout(timeout);
      const reason = err.name === "AbortError" ? "timeout" : err.message || "network error";
      failures.push(`${endpoint}: ${reason}`);
    }
  }

  // All endpoints failed: log one single console.error with status/reasons (never User-Agent)
  console.error(`All Overpass endpoints failed: ${failures.join("; ")}`);
  const error = new Error("Could not reach OpenStreetMap places services.");
  error.code = "places_unavailable";
  throw error;
}

/**
 * Fetches and verifies a single OSM element by key. Used before creating review records.
 */
export async function fetchElementByKey(osmType, osmId) {
  const query = buildSingleElementQuery(osmType, osmId);
  const userAgent = getUserAgent();
  const failures = [];

  for (const endpoint of OSM_CONFIG.overpassEndpoints) {
    const blockedUntil = endpointBlockedUntil.get(endpoint) || 0;
    if (Date.now() < blockedUntil) {
      failures.push(`${endpoint}: skipped (cooling down after HTTP 429)`);
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSM_CONFIG.overpassClientTimeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "*/*",
          "User-Agent": userAgent,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 429) {
        const cooldownMs = (OSM_CONFIG.endpointCooldownSec || 30) * 1000;
        endpointBlockedUntil.set(endpoint, Date.now() + cooldownMs);
        failures.push(`${endpoint}: HTTP 429`);
        continue;
      }

      if (res.status === 406 || res.status >= 500 || !res.ok) {
        failures.push(`${endpoint}: HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        failures.push(`${endpoint}: empty body`);
        continue;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        failures.push(`${endpoint}: non-JSON body`);
        continue;
      }

      if (hasOverpassErrorRemark(json)) {
        failures.push(`${endpoint}: remark error`);
        continue;
      }

      if (!json || !Array.isArray(json.elements)) {
        failures.push(`${endpoint}: missing elements array`);
        continue;
      }

      if (json.elements.length === 0) return null;

      return normalizeElement(json.elements[0]);
    } catch (err) {
      clearTimeout(timeout);
      const reason = err.name === "AbortError" ? "timeout" : err.message || "network error";
      failures.push(`${endpoint}: ${reason}`);
    }
  }

  if (failures.length > 0) {
    console.error(`Overpass fetchElementByKey failed on all endpoints: ${failures.join("; ")}`);
  }

  return null;
}
