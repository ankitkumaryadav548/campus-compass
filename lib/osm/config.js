// lib/osm/config.js
// Single source of truth for all OpenStreetMap, Overpass, Nominatim,
// geo-calculation, and food-filtering tunables.

export const OSM_CONFIG = {
  // Overpass API interpreter endpoints (tried in order)
  overpassEndpoints: [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ],

  // Nominatim endpoints
  nominatimEndpoint: "https://nominatim.openstreetmap.org/search",
  nominatimReverseEndpoint: "https://nominatim.openstreetmap.org/reverse",

  // Timeouts (in milliseconds)
  overpassQueryTimeoutSec: 20,
  overpassClientTimeoutMs: 22000,
  nominatimTimeoutMs: 8000,

  // Overpass cooldown after HTTP 429 (in seconds)
  endpointCooldownSec: 30,

  // Nominatim rate-limiting queue: minimum interval between consecutive requests
  nominatimMinIntervalMs: 1100,

  // Cache lifetimes (in seconds for TTL index calculation)
  placesCacheTtlSec: 24 * 60 * 60, // 24 hours
  geocodeCacheTtlSec: 30 * 24 * 60 * 60, // 30 days

  // Result caps
  maxCachedPlaces: 150,
  overpassElementLimit: 300,
  maxGeocodeResults: 5,

  // Radius options in meters
  radiusOptions: [1000, 2000, 5000],
  defaultRadiusMeters: 2000,

  // Cache cell configuration (about 500 meters grid)
  cellPrecisionDegrees: 0.005, // 0.005 degrees latitude ≈ 555m (~500m grid cell)
  cellMarginMeters: 500, // Query margin in meters to cover cell corners (~393m max offset)

  // Walking speed estimate
  walkingSpeedKmH: 4.8,
  detourFactor: 1.25,

  // Rate limits per user
  rateLimits: {
    nearbySearchesPerMin: 20,
    geocodeSearchesPerMin: 10,
    reviewsPerHour: 10,
  },

  // OSM tag filters
  foodAmenities: ["restaurant", "fast_food", "cafe", "food_court", "canteen"],
  groceryShops: ["supermarket", "convenience", "greengrocer"],

  // Cuisine keywords indicative of meat/non-veg offerings
  meatCuisines: [
    "kebab",
    "chicken",
    "barbecue",
    "bbq",
    "burger",
    "steak_house",
    "seafood",
    "fish",
    "grill",
  ],

  // Default User-Agent fallback when OSM_USER_AGENT is not configured
  defaultUserAgent: "CampusCompass/1.0 (campuscompass@sample.test)",
};
