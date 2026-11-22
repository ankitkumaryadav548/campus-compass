// lib/osm/nominatim.js
// Typed address search using OpenStreetMap Nominatim.
// Adheres strictly to the Nominatim usage policy: max 1 request/second via an in-process queue.

import { OSM_CONFIG } from "./config.js";
import OsmCache from "../../models/OsmCache.js";

// In-process rate limiting queue: ensures calls are spaced at least 1.1s apart.
// Note: In a multi-instance serverless deployment, this in-process queue does not share state across lambdas;
// at production scale, a distributed rate limiter (such as Redis) or a dedicated geocoding service is recommended.
let lastRequestTime = 0;
let queuePromise = Promise.resolve();

function scheduleRequest(fn) {
  queuePromise = queuePromise.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    const waitTime = Math.max(0, OSM_CONFIG.nominatimMinIntervalMs - elapsed);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
    return fn();
  });
  return queuePromise;
}

function getUserAgent() {
  const ua = process.env.OSM_USER_AGENT;
  if (!ua) {
    console.error("OSM_USER_AGENT environment variable is missing. Using default User-Agent.");
    return OSM_CONFIG.defaultUserAgent;
  }
  return ua;
}

/**
 * Geocodes an address or place name query into coordinates.
 * Checks cache first; on cache miss, executes a queued request to Nominatim.
 *
 * @param {string} rawQuery
 * @returns {Promise<Array<{ label: string, lat: number, lng: number }>>}
 */
export async function geocode(rawQuery) {
  const query = (rawQuery || "").trim().toLowerCase();
  if (query.length < 3 || query.length > 100) return [];

  const cacheKey = `geocode_${query}`;

  // 1. Check OsmCache
  try {
    const cached = await OsmCache.findOne({ key: cacheKey, kind: "geocode" }).lean();
    if (cached && cached.payload && new Date(cached.expiresAt) > new Date()) {
      return cached.payload;
    }
  } catch (err) {
    console.error("OsmCache geocode lookup error:", err.message);
  }

  // 2. Execute scheduled Nominatim request
  const results = await scheduleRequest(async () => {
    const userAgent = getUserAgent();
    const url = new URL(OSM_CONFIG.nominatimEndpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(OSM_CONFIG.maxGeocodeResults));
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSM_CONFIG.nominatimTimeoutMs);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": userAgent,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        console.error(`Nominatim returned HTTP ${res.status}`);
        const err = new Error("The address search service is currently busy. Please try dropping a pin on the map.");
        err.code = "geocode_busy";
        throw err;
      }

      if (!res.ok) {
        const err = new Error("Address search failed.");
        err.code = "geocode_busy";
        throw err;
      }

      const json = await res.json();
      if (!Array.isArray(json)) return [];

      return json.slice(0, OSM_CONFIG.maxGeocodeResults).map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
    } catch (err) {
      clearTimeout(timeout);
      if (err.code === "geocode_busy") throw err;
      console.error("Nominatim fetch error:", err.message || err);
      const busyErr = new Error("The address search service is currently busy. Please try dropping a pin on the map.");
      busyErr.code = "geocode_busy";
      throw busyErr;
    }
  });

  // 3. Save to cache (30 days TTL)
  try {
    const expiresAt = new Date(Date.now() + OSM_CONFIG.geocodeCacheTtlSec * 1000);
    await OsmCache.findOneAndUpdate(
      { key: cacheKey },
      {
        key: cacheKey,
        kind: "geocode",
        payload: results,
        expiresAt,
      },
      { upsert: true, new: true }
    );
  } catch (cacheErr) {
    console.error("OsmCache write error:", cacheErr.message);
  }

  return results;
}

/**
 * Reverse geocodes coordinates to a human-friendly place or area name.
 * Checks cache first; on miss, calls Nominatim /reverse with rate limiting.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ label: string }>}
 */
export async function reverseGeocode(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return { label: "My location" };
  }

  const roundLat = numLat.toFixed(4);
  const roundLng = numLng.toFixed(4);
  const cacheKey = `geocode_reverse_${roundLat}_${roundLng}`;

  // 1. Check cache
  try {
    const cached = await OsmCache.findOne({ key: cacheKey, kind: "geocode" }).lean();
    if (cached?.payload?.label && new Date(cached.expiresAt) > new Date()) {
      return cached.payload;
    }
  } catch (err) {
    console.error("OsmCache reverse geocode lookup error:", err.message);
  }

  // 2. Schedule request
  const result = await scheduleRequest(async () => {
    const userAgent = getUserAgent();
    const endpoint = OSM_CONFIG.nominatimReverseEndpoint || "https://nominatim.openstreetmap.org/reverse";
    const url = new URL(endpoint);
    url.searchParams.set("lat", String(numLat));
    url.searchParams.set("lon", String(numLng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OSM_CONFIG.nominatimTimeoutMs);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": userAgent,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) {
        return { label: "My location" };
      }

      const json = await res.json();
      const address = json.address || {};
      const name = json.name || address.amenity || address.building || address.university || address.college;
      const locality = address.city || address.town || address.village || address.suburb || address.county || "";

      let label = "";
      if (name && locality && !name.toLowerCase().includes(locality.toLowerCase())) {
        label = `${name}, ${locality}`;
      } else if (name) {
        label = name;
      } else if (address.road && locality) {
        label = `${address.road}, ${locality}`;
      } else if (json.display_name) {
        label = json.display_name.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
      } else {
        label = "My location";
      }

      return { label };
    } catch (err) {
      clearTimeout(timeout);
      return { label: "My location" };
    }
  });

  // 3. Save to cache (30 days TTL)
  if (result?.label && result.label !== "My location") {
    try {
      const expiresAt = new Date(Date.now() + OSM_CONFIG.geocodeCacheTtlSec * 1000);
      await OsmCache.findOneAndUpdate(
        { key: cacheKey },
        {
          key: cacheKey,
          kind: "geocode",
          payload: result,
          expiresAt,
        },
        { upsert: true, new: true }
      );
    } catch (cacheErr) {
      console.error("OsmCache reverse geocode write error:", cacheErr.message);
    }
  }

  return result;
}
