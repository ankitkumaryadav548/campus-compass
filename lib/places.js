// lib/places.js
// Shared server-side logic for the Food Finder module.
// Handles country-aware queries, dietary and cuisine filtering, distance math, and sorting.

import Place from "@/models/Place";
import { placeRegionQuery } from "@/lib/personalization";
import { calculateDistance } from "@/lib/utils";
import { CAMPUS_LAT, CAMPUS_LNG } from "@/lib/campus";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Fetches places for a student according to their personalization tags and filter options.
 *
 * @param {Object} user - Session user
 * @param {Object} filters - { forMyCountry, type, cuisine, dietTags, search, sort }
 * @returns {Promise<Array>}
 */
export async function getPlacesForUser(user, filters = {}) {
  const {
    forMyCountry = true,
    type,
    cuisine,
    dietTags,
    search,
    sort = "best_match",
  } = filters;

  const query = {};

  // 1. Country / Region tag filtering
  if (forMyCountry && user) {
    Object.assign(query, placeRegionQuery(user));
  }

  // 2. Type filter
  if (type && ["grocery", "restaurant", "cafeteria"].includes(type)) {
    query.type = type;
  }

  // 3. Cuisine filter
  if (cuisine && typeof cuisine === "string" && cuisine.trim()) {
    query.cuisine = cuisine.trim();
  }

  // 4. Diet tags filter: place must contain ALL specified diet tags
  if (dietTags) {
    const dietArray = Array.isArray(dietTags)
      ? dietTags
      : typeof dietTags === "string"
      ? dietTags.split(",").map((d) => d.trim()).filter(Boolean)
      : [];

    if (dietArray.length > 0) {
      query.dietTags = { $all: dietArray };
    }
  }

  // 5. Search text on name or address (safely escaped)
  if (search && typeof search === "string" && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { address: { $regex: escaped, $options: "i" } },
    ];
  }

  const rawPlaces = await Place.find(query).lean();

  // 6. Enrich with distance from campus, review counts, and country match flag
  const enrichedPlaces = rawPlaces.map((place) => {
    const distanceKm =
      place.location?.lat != null && place.location?.lng != null
        ? calculateDistance(CAMPUS_LAT, CAMPUS_LNG, place.location.lat, place.location.lng)
        : null;

    const matchesCountry = Boolean(
      user?.country &&
      Array.isArray(place.countryTags) &&
      place.countryTags.includes(user.country)
    );

    const reviews = (place.reviews || []).map((r) => ({
      userId: r.userId ? r.userId.toString() : null,
      userName: r.userName || "Anonymous Student",
      rating: Number(r.rating) || 0,
      comment: r.comment || "",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Ensure reviews are sorted newest first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      _id: place._id.toString(),
      name: place.name,
      type: place.type,
      cuisine: place.cuisine || [],
      dietTags: place.dietTags || [],
      countryTags: place.countryTags || [],
      address: place.address || "",
      location: {
        lat: place.location?.lat ?? null,
        lng: place.location?.lng ?? null,
      },
      rating: Number((place.rating || 0).toFixed(1)),
      reviewCount: reviews.length,
      reviews,
      distanceKm,
      matchesCountry,
      isSample: Boolean(place.isSample),
    };
  });

  // 7. Apply sorting
  enrichedPlaces.sort((a, b) => {
    if (sort === "nearest") {
      const distA = a.distanceKm ?? 9999;
      const distB = b.distanceKm ?? 9999;
      if (distA !== distB) return distA - distB;
      return (b.rating || 0) - (a.rating || 0);
    }

    if (sort === "top_rated") {
      if ((b.rating || 0) !== (a.rating || 0)) {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    }

    // Default: "best_match"
    // 1st: country match
    if (a.matchesCountry !== b.matchesCountry) {
      return a.matchesCountry ? -1 : 1;
    }
    // 2nd: rating
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    // 3rd: distance
    const distA = a.distanceKm ?? 9999;
    const distB = b.distanceKm ?? 9999;
    return distA - distB;
  });

  return enrichedPlaces;
}

/**
 * Returns distinct filter options (types, cuisines, diet tags) present in the database.
 */
export async function getPlaceFilterOptions() {
  const [types, cuisines, dietTags] = await Promise.all([
    Place.distinct("type"),
    Place.distinct("cuisine"),
    Place.distinct("dietTags"),
  ]);

  return {
    types: types.filter(Boolean).sort(),
    cuisines: cuisines.filter(Boolean).sort(),
    dietTags: dietTags.filter(Boolean).sort(),
  };
}
