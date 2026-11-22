// lib/placeFilters.js
// Pure client-side filtering, sorting, tier calculation, and diet mapping.
// Operates on normalised place objects with zero network requests.

/**
 * Maps the user's saved diet preference to an initial filter value.
 *
 * @param {string|null} userDiet - Value from user profile (e.g. "vegetarian", "halal")
 * @returns {"veg" | "nonveg" | "any"}
 */
export function defaultDietFilter(userDiet) {
  if (!userDiet) return "any";
  const normalized = userDiet.toLowerCase().trim();

  if (["vegetarian", "vegan", "jain", "eggetarian"].includes(normalized)) {
    return "veg";
  }
  if (["non-vegetarian", "halal"].includes(normalized)) {
    return "nonveg";
  }
  return "any";
}

/**
 * Extracts distinct, sorted cuisines from a list of places.
 *
 * @param {Array} places
 * @returns {Array<string>}
 */
export function cuisineOptions(places = []) {
  const set = new Set();
  places.forEach((p) => {
    if (p.kind === "food" && Array.isArray(p.cuisines)) {
      p.cuisines.forEach((c) => {
        if (c && typeof c === "string") set.add(c.trim());
      });
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters and sorts places based on user criteria.
 * Adds a `tier` property (1 or 2) to each food place based on diet rules.
 * Groceries ignore diet and tiering rules.
 *
 * @param {Array} places - Array of normalized places
 * @param {Object} filters - { type, diet, hideUnconfirmed, cuisine, search, sort }
 * @returns {Array} Filtered and sorted places with tier metadata
 */
export function filterAndSortPlaces(places = [], filters = {}) {
  const {
    type = "all",
    diet = "any",
    hideUnconfirmed = false,
    cuisine = "",
    search = "",
    sort = "best",
  } = filters;

  const searchLower = (search || "").toLowerCase().trim();
  const cuisineLower = (cuisine || "").toLowerCase().trim();

  // 1. Filter places and calculate diet tier
  const filtered = [];

  for (const place of places) {
    // Type filter
    if (type === "food" && place.kind !== "food") continue;
    if (type === "grocery" && place.kind !== "grocery") continue;

    // Cuisine filter
    if (cuisineLower) {
      const hasCuisine = Array.isArray(place.cuisines) &&
        place.cuisines.some((c) => c.toLowerCase() === cuisineLower);
      if (!hasCuisine) continue;
    }

    // Text search (plain substring on name and cuisines)
    if (searchLower) {
      const nameMatch = place.name && place.name.toLowerCase().includes(searchLower);
      const cuisineMatch = Array.isArray(place.cuisines) &&
        place.cuisines.some((c) => c.toLowerCase().includes(searchLower));
      if (!nameMatch && !cuisineMatch) continue;
    }

    // Diet filtering and tiering (groceries ignore diet and tiering)
    let tier = 1;

    if (place.kind === "food") {
      const vegLevel = place.diet?.vegLevel || "unknown";
      const nonVegLikely = Boolean(place.diet?.nonVegLikely);

      if (diet === "veg") {
        if (vegLevel === "only" || vegLevel === "options") {
          tier = 1;
        } else if (vegLevel === "unknown" && !nonVegLikely) {
          tier = 2;
        } else {
          // Unknown with non-veg likely, or pure non-veg -> excluded
          continue;
        }

        if (hideUnconfirmed && tier === 2) continue;
      } else if (diet === "nonveg") {
        if (vegLevel === "only") {
          // Pure veg -> excluded
          continue;
        } else if (nonVegLikely) {
          tier = 1;
        } else {
          // Not pure veg, not explicitly confirmed non-veg
          tier = 2;
        }

        if (hideUnconfirmed && tier === 2) continue;
      }
    }

    filtered.push({ ...place, tier });
  }

  // 2. Sort results
  filtered.sort((a, b) => {
    const distA = a.distanceKm ?? 999999;
    const distB = b.distanceKm ?? 999999;

    if (sort === "nearest") {
      return distA - distB;
    }

    if (sort === "top_rated") {
      const ratingDiff = (b.ratingAverage || 0) - (a.ratingAverage || 0);
      if (Math.abs(ratingDiff) > 0.01) return ratingDiff;

      const reviewDiff = (b.reviewCount || 0) - (a.reviewCount || 0);
      if (reviewDiff !== 0) return reviewDiff;

      return distA - distB;
    }

    // Default "best": tier ascending (tier 1 before tier 2), then distance
    const tierA = a.tier ?? 1;
    const tierB = b.tier ?? 1;
    if (tierA !== tierB) return tierA - tierB;

    return distA - distB;
  });

  return filtered;
}
