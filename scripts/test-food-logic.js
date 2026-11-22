// scripts/test-food-logic.js
// Verification unit tests for pure food logic modules:
// - lib/osm/dietClassifier.js
// - lib/placeFilters.js
// - lib/geo.js

import assert from "node:assert/strict";
import { classifyDiet } from "../lib/osm/dietClassifier.js";
import {
  filterAndSortPlaces,
  defaultDietFilter,
  cuisineOptions,
} from "../lib/placeFilters.js";
import {
  isValidCoord,
  walkingMinutes,
  directionsUrl,
  osmElementUrl,
  cellKey,
  cellCoords,
  calculateDistance,
} from "../lib/geo.js";
import { OSM_CONFIG } from "../lib/osm/config.js";

console.log("🧪  Running food logic tests…\n");

// ── 1. classifyDiet Tests ──────────────────────────────────────────────────
console.log("▶ Testing classifyDiet…");

// 1.1 Pure veg ("only")
const dietOnly = classifyDiet({ "diet:vegetarian": "only" });
assert.equal(dietOnly.vegLevel, "only");
assert.equal(dietOnly.nonVegLikely, false);

const veganOnly = classifyDiet({ "diet:vegan": "only" });
assert.equal(veganOnly.vegLevel, "only");
assert.equal(veganOnly.nonVegLikely, false);

// 1.2 Veg options ("yes")
const dietYes = classifyDiet({ "diet:vegetarian": "yes" });
assert.equal(dietYes.vegLevel, "options");
assert.equal(dietYes.nonVegLikely, false);

// 1.3 Halal -> nonVegLikely
const halalPlace = classifyDiet({ "diet:halal": "yes" });
assert.equal(halalPlace.vegLevel, "unknown");
assert.equal(halalPlace.nonVegLikely, true);

// 1.4 Meat cuisine keywords
const meatPlace = classifyDiet({ cuisine: "chicken;burger;bbq" });
assert.equal(meatPlace.vegLevel, "unknown");
assert.equal(meatPlace.nonVegLikely, true);

// 1.5 Both veg options AND meat cuisine
const mixedPlace = classifyDiet({ "diet:vegetarian": "yes", cuisine: "indian;kebab" });
assert.equal(mixedPlace.vegLevel, "options");
assert.equal(mixedPlace.nonVegLikely, true);

// 1.6 No tags at all
const emptyTags = classifyDiet({});
assert.equal(emptyTags.vegLevel, "unknown");
assert.equal(emptyTags.nonVegLikely, false);

console.log("  ✓ classifyDiet tests passed");

// ── 2. defaultDietFilter Tests ─────────────────────────────────────────────
console.log("▶ Testing defaultDietFilter…");

assert.equal(defaultDietFilter("vegetarian"), "veg");
assert.equal(defaultDietFilter("vegan"), "veg");
assert.equal(defaultDietFilter("jain"), "veg");
assert.equal(defaultDietFilter("eggetarian"), "veg");
assert.equal(defaultDietFilter("non-vegetarian"), "nonveg");
assert.equal(defaultDietFilter("halal"), "nonveg");
assert.equal(defaultDietFilter("no preference"), "any");
assert.equal(defaultDietFilter("none"), "any");
assert.equal(defaultDietFilter(null), "any");
assert.equal(defaultDietFilter(undefined), "any");

console.log("  ✓ defaultDietFilter tests passed");

// ── 3. filterAndSortPlaces Tests ───────────────────────────────────────────
console.log("▶ Testing filterAndSortPlaces…");

const samplePlaces = [
  {
    placeKey: "node-1",
    name: "Pure Veg Nirvana",
    kind: "food",
    cuisines: ["indian"],
    diet: { vegLevel: "only", nonVegLikely: false },
    distanceKm: 0.8,
    ratingAverage: 4.8,
    reviewCount: 10,
  },
  {
    placeKey: "node-2",
    name: "Cafe Options",
    kind: "food",
    cuisines: ["coffee_shop"],
    diet: { vegLevel: "options", nonVegLikely: false },
    distanceKm: 1.5,
    ratingAverage: 4.2,
    reviewCount: 5,
  },
  {
    placeKey: "node-3",
    name: "Corner Diner (Unconfirmed)",
    kind: "food",
    cuisines: ["diner"],
    diet: { vegLevel: "unknown", nonVegLikely: false },
    distanceKm: 0.3,
    ratingAverage: 3.9,
    reviewCount: 2,
  },
  {
    placeKey: "node-4",
    name: "BBQ & Grill Shack",
    kind: "food",
    cuisines: ["barbecue", "grill"],
    diet: { vegLevel: "unknown", nonVegLikely: true },
    distanceKm: 0.5,
    ratingAverage: 4.6,
    reviewCount: 8,
  },
  {
    placeKey: "node-5",
    name: "Fresh Market",
    kind: "grocery",
    cuisines: [],
    diet: { vegLevel: "unknown", nonVegLikely: false },
    distanceKm: 0.4,
    ratingAverage: 4.0,
    reviewCount: 3,
  },
];

// 3.1 Veg mode excludes pure non-veg and puts tier 1 before tier 2
const vegResults = filterAndSortPlaces(samplePlaces, { diet: "veg", type: "food", sort: "best" });
assert.ok(!vegResults.some((p) => p.placeKey === "node-4"), "BBQ shack must be excluded in veg mode");
assert.equal(vegResults[0].tier, 1, "First result must be tier 1");
assert.equal(vegResults[vegResults.length - 1].tier, 2, "Last result must be tier 2");
assert.equal(vegResults[vegResults.length - 1].placeKey, "node-3");

// 3.2 Non-veg mode excludes pure veg place and puts tier 1 (nonVegLikely) first
const nonVegResults = filterAndSortPlaces(samplePlaces, { diet: "nonveg", type: "food", sort: "best" });
assert.ok(!nonVegResults.some((p) => p.placeKey === "node-1"), "Pure Veg must be excluded in nonveg mode");
assert.equal(nonVegResults[0].placeKey, "node-4", "BBQ shack (tier 1) should be first");
assert.equal(nonVegResults[0].tier, 1);

// 3.3 hideUnconfirmed removes tier 2
const vegStrict = filterAndSortPlaces(samplePlaces, { diet: "veg", hideUnconfirmed: true });
assert.ok(!vegStrict.some((p) => p.tier === 2), "hideUnconfirmed must remove tier 2 places");
assert.ok(!vegStrict.some((p) => p.placeKey === "node-3"));

// 3.4 Groceries ignore diet rules
const vegWithGrocery = filterAndSortPlaces(samplePlaces, { diet: "veg", type: "all" });
assert.ok(vegWithGrocery.some((p) => p.kind === "grocery"), "Grocery must remain in veg mode");

const nonvegWithGrocery = filterAndSortPlaces(samplePlaces, { diet: "nonveg", type: "all" });
assert.ok(nonvegWithGrocery.some((p) => p.kind === "grocery"), "Grocery must remain in non-veg mode");

// 3.5 Sort modes
const nearestResults = filterAndSortPlaces(samplePlaces, { sort: "nearest" });
for (let i = 0; i < nearestResults.length - 1; i++) {
  assert.ok(
    nearestResults[i].distanceKm <= nearestResults[i + 1].distanceKm,
    "nearest sort must order ascending by distance"
  );
}

const topRatedResults = filterAndSortPlaces(samplePlaces, { sort: "top_rated" });
assert.equal(topRatedResults[0].placeKey, "node-1", "Highest rated place must be first");

// 3.6 cuisineOptions helper
const cuisines = cuisineOptions(samplePlaces);
assert.ok(cuisines.includes("indian"));
assert.ok(cuisines.includes("barbecue"));
assert.ok(!cuisines.includes(""));

console.log("  ✓ filterAndSortPlaces tests passed");

// ── 4. Geo Helpers Tests ───────────────────────────────────────────────────
console.log("▶ Testing geo helpers…");

// 4.1 calculateDistance sanity check
const zeroDist = calculateDistance(28.6139, 77.2090, 28.6139, 77.2090);
assert.equal(zeroDist, 0);

const dist = calculateDistance(28.6139, 77.2090, 28.6239, 77.2090);
assert.ok(dist > 1.0 && dist < 1.2, `Distance should be ~1.1km, got ${dist}`);

// 4.2 walkingMinutes
assert.equal(walkingMinutes(0), 0);
assert.ok(walkingMinutes(1.0) > 10 && walkingMinutes(1.0) < 20);

// 4.3 directionsUrl
const dUrl = directionsUrl(
  { lat: 28.6139, lng: 77.2090 },
  { location: { lat: 28.6200, lng: 77.2100 } }
);
assert.ok(dUrl.includes("fossgis_osrm_foot"));
assert.ok(dUrl.includes("28.6139,77.209;28.62,77.21"));

// 4.4 osmElementUrl
assert.equal(osmElementUrl("node", 12345), "https://www.openstreetmap.org/node/12345");
assert.equal(osmElementUrl("way", 999), "https://www.openstreetmap.org/way/999");

// 4.5 isValidCoord
assert.equal(isValidCoord(28.6139, 77.2090), true);
assert.equal(isValidCoord(-90, -180), true);
assert.equal(isValidCoord(90, 180), true);
assert.equal(isValidCoord(91, 50), false, "Lat > 90 must be invalid");
assert.equal(isValidCoord(50, 185), false, "Lng > 180 must be invalid");
assert.equal(isValidCoord("invalid", 50), false);
assert.equal(isValidCoord(null, 50), false);
assert.equal(isValidCoord(undefined, undefined), false);

console.log("  ✓ geo helpers tests passed");

// ── 5. Two Origins in the Same Cell ───────────────────────────────────────
console.log("▶ Testing two origins in the same cell…");

const originA = { lat: 28.6140, lng: 77.2090 };
const originB = { lat: 28.6155, lng: 77.2110 };

// Must share the exact same cellKey and cellCoords
const k1 = cellKey(originA.lat, originA.lng, 2000);
const k2 = cellKey(originB.lat, originB.lng, 2000);
assert.equal(k1, k2, "Two distinct coordinates in the same ~500m cell must share cellKey");

const cA = cellCoords(originA.lat, originA.lng);
const cB = cellCoords(originB.lat, originB.lng);
assert.equal(cA.lat, cB.lat, "Cell center latitude must match for same cell");
assert.equal(cA.lng, cB.lng, "Cell center longitude must match for same cell");

// Places positioned so one is close to A (south) and another close to B (north)
const placeNearA = {
  name: "Cafe Near A",
  location: { lat: originA.lat - 0.0085, lng: originA.lng },
};
const placeNearB = {
  name: "Diner Near B",
  location: { lat: originB.lat + 0.0085, lng: originB.lng },
};

const distFromA_PlaceA = calculateDistance(originA.lat, originA.lng, placeNearA.location.lat, placeNearA.location.lng);
const distFromB_PlaceA = calculateDistance(originB.lat, originB.lng, placeNearA.location.lat, placeNearA.location.lng);
const distFromCenter_PlaceA = calculateDistance(cA.lat, cA.lng, placeNearA.location.lat, placeNearA.location.lng);

assert.ok(distFromA_PlaceA <= 1.0, `Place Near A should be <= 1.0km from A, got ${distFromA_PlaceA}`);
assert.ok(distFromB_PlaceA > 1.0, `Place Near A should be > 1.0km from B, got ${distFromB_PlaceA}`);
assert.notEqual(distFromA_PlaceA, distFromCenter_PlaceA, "Distance from origin A must not be conflated with cell center distance");

// Exact-distance filtering simulation (as in lib/places.js) with 1000m radius
const filterPlacesForOrigin = (rawList, origin, radiusMeters) => {
  const maxKm = radiusMeters / 1000;
  return rawList
    .map((p) => {
      const d = calculateDistance(origin.lat, origin.lng, p.location.lat, p.location.lng);
      return { ...p, distanceKm: d };
    })
    .filter((p) => p.distanceKm <= maxKm);
};

const cachedRawPlaces = [placeNearA, placeNearB];
const filteredA = filterPlacesForOrigin(cachedRawPlaces, originA, 1000);
const filteredB = filterPlacesForOrigin(cachedRawPlaces, originB, 1000);

assert.equal(filteredA.length, 1);
assert.equal(filteredA[0].name, "Cafe Near A");
assert.equal(filteredA[0].distanceKm, distFromA_PlaceA, "Distance on returned place must be computed from exact origin A");

assert.equal(filteredB.length, 1);
assert.equal(filteredB[0].name, "Diner Near B");
assert.ok(filteredB[0].distanceKm <= 1.0);

console.log("  ✓ two origins in the same cell tests passed");

// ── 6. Origin Near a Cell Edge ─────────────────────────────────────────────
console.log("▶ Testing origin near a cell edge…");

// Place an origin near the northeast corner of the cell (~320m from center)
const cornerOrigin = {
  lat: cA.lat + 0.0022,
  lng: cA.lng + 0.0022,
};
assert.equal(cellKey(cornerOrigin.lat, cornerOrigin.lng, 1000), cellKey(cA.lat, cA.lng, 1000));

const distOriginToCenter = calculateDistance(cA.lat, cA.lng, cornerOrigin.lat, cornerOrigin.lng);
assert.ok(distOriginToCenter > 0.20 && distOriginToCenter < 0.40, `Corner origin offset should be ~0.3km, got ${distOriginToCenter}km`);

// Place X is ~0.9km from cornerOrigin in the direction AWAY from cell center
const placeNearEdgeInsideRadius = {
  name: "Bistro Near Outer Edge",
  location: {
    lat: cornerOrigin.lat + 0.0080,
    lng: cornerOrigin.lng,
  },
};

const distFromCorner = calculateDistance(cornerOrigin.lat, cornerOrigin.lng, placeNearEdgeInsideRadius.location.lat, placeNearEdgeInsideRadius.location.lng);
const distFromCellCenter = calculateDistance(cA.lat, cA.lng, placeNearEdgeInsideRadius.location.lat, placeNearEdgeInsideRadius.location.lng);

assert.ok(distFromCorner <= 1.0, `Place must be within chosen radius (1.0km) from cornerOrigin, got ${distFromCorner}km`);
assert.ok(distFromCellCenter > 1.0, `Place must be further than 1.0km from cell center, got ${distFromCellCenter}km`);

// Verify that Overpass fetch radius with cellMarginMeters covers this place from cell center
const fetchRadiusKm = (1000 + OSM_CONFIG.cellMarginMeters) / 1000;
assert.ok(
  distFromCellCenter <= fetchRadiusKm,
  `Overpass query radius with cellMarginMeters (${fetchRadiusKm}km) must reach Place (${distFromCellCenter}km) so it is NEVER missed`
);

// Place Y is ~1.1km from cornerOrigin (just outside 1.0km radius)
const placeNearEdgeOutsideRadius = {
  name: "Bakery Just Outside Radius",
  location: {
    lat: cornerOrigin.lat + 0.0100,
    lng: cornerOrigin.lng,
  },
};
const distOutside = calculateDistance(cornerOrigin.lat, cornerOrigin.lng, placeNearEdgeOutsideRadius.location.lat, placeNearEdgeOutsideRadius.location.lng);
assert.ok(distOutside > 1.0, "Place Y must be outside 1.0km radius");

// Even if place Y was fetched into the cell cache, exact-distance filter excludes it
const rawCellCache = [placeNearEdgeInsideRadius, placeNearEdgeOutsideRadius];
const cornerResults = filterPlacesForOrigin(rawCellCache, cornerOrigin, 1000);
assert.equal(cornerResults.length, 1, "Cached cell must NEVER return a place outside chosen radius");
assert.equal(cornerResults[0].name, "Bistro Near Outer Edge");

console.log("  ✓ origin near a cell edge tests passed");

// ── 7. Cache Element Cap and Distance-Based Sorting ────────────────────────
console.log("▶ Testing cache element cap and distance-based sorting…");

// Create 200 places in arbitrary order around center (some close, some far)
const centerLat = 28.6150;
const centerLng = 77.2100;
const arbitraryPlaces = [];
for (let i = 0; i < 200; i++) {
  // Random distances from 0.05km up to 2.5km
  const offsetDeg = ((i * 13) % 200) * 0.0001 + 0.0005;
  arbitraryPlaces.push({
    placeKey: `node-${i}`,
    name: `Place ${i}`,
    location: { lat: centerLat + offsetDeg, lng: centerLng },
  });
}

// Emulate overpass.js distance sorting from cell center
arbitraryPlaces.sort((a, b) => {
  const dA = calculateDistance(centerLat, centerLng, a.location.lat, a.location.lng) ?? 9999;
  const dB = calculateDistance(centerLat, centerLng, b.location.lat, b.location.lng) ?? 9999;
  return dA - dB;
});

const cappedPlaces = arbitraryPlaces.slice(0, OSM_CONFIG.maxCachedPlaces);
const isTruncated = arbitraryPlaces.length > OSM_CONFIG.maxCachedPlaces;

assert.equal(cappedPlaces.length, 150, "Capped places must equal maxCachedPlaces (150)");
assert.equal(isTruncated, true, "Truncated flag must be true when places exceed 150");

// Verify that every kept place is closer to cell center than any omitted place
const maxKeptDist = calculateDistance(centerLat, centerLng, cappedPlaces[149].location.lat, cappedPlaces[149].location.lng);
const minDroppedDist = calculateDistance(centerLat, centerLng, arbitraryPlaces[150].location.lat, arbitraryPlaces[150].location.lng);
assert.ok(maxKeptDist <= minDroppedDist, "All kept places must be closer to center than dropped places");

console.log("  ✓ cache element cap and distance-based sorting tests passed\n");

console.log("🎉  All food logic unit tests passed successfully!");
process.exit(0);
