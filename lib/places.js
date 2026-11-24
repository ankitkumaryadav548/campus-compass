// lib/places.js
// High-level places service: coordinates Overpass queries, grid-cell caching,
// rating joins from MongoDB, verified diet labels, and student review management.

import { OSM_CONFIG } from "@/lib/osm/config";
import { fetchPlacesAround, fetchElementByKey } from "@/lib/osm/overpass";
import { cellKey, cellCoords, calculateDistance, walkingMinutes } from "@/lib/geo";
import { applyVerifiedDiet } from "@/lib/osm/dietClassifier";
import OsmCache from "@/models/OsmCache";
import Place from "@/models/Place";

/**
 * Ensures a Place document exists in MongoDB, lazily fetching and verifying
 * its element data from OpenStreetMap if not already recorded.
 *
 * @param {string} osmType
 * @param {number} osmId
 * @returns {Promise<Object>}
 */
export async function ensurePlaceDocument(osmType, osmId) {
  let placeDoc = await Place.findOne({ osmType, osmId });
  if (!placeDoc) {
    const osmElement = await fetchElementByKey(osmType, osmId);
    if (!osmElement) {
      const err = new Error("This place could not be verified on OpenStreetMap.");
      err.status = 404;
      throw err;
    }

    placeDoc = new Place({
      osmType,
      osmId,
      name: osmElement.name,
      location: osmElement.location,
      ratingAverage: 0,
      reviewCount: 0,
      reviews: [],
    });
    await placeDoc.save();
  }
  return placeDoc;
}

/**
 * Fetches nearby food and grocery places around an exact origin.
 * Uses grid-cell caching to prevent redundant Overpass requests within 24 hours.
 *
 * @param {{ lat: number, lng: number, label?: string }} origin
 * @param {number} radius - Search radius in meters
 * @returns {Promise<{ origin: Object, places: Array, meta: Object }>}
 */
export async function getNearbyPlaces(origin, radius = OSM_CONFIG.defaultRadiusMeters) {
  const exactLat = Number(origin.lat);
  const exactLng = Number(origin.lng);
  const searchRadius = Number(radius) || OSM_CONFIG.defaultRadiusMeters;

  const center = cellCoords(exactLat, exactLng);
  const key = cellKey(exactLat, exactLng, searchRadius);
  let rawPlaces = null;
  let fromCache = false;
  let truncated = false;

  // 1. Check OsmCache
  try {
    const cached = await OsmCache.findOne({ key, kind: "places" }).lean();
    if (cached && Array.isArray(cached.payload?.places) && new Date(cached.expiresAt) > new Date()) {
      rawPlaces = cached.payload.places;
      truncated = Boolean(cached.payload.truncated);
      fromCache = true;
    }
  } catch (err) {
    console.error("Cache read error:", err.message);
  }

  // 2. Query Overpass if cache miss
  if (!rawPlaces) {
    const fetchResult = await fetchPlacesAround(center.lat, center.lng, searchRadius);
    rawPlaces = fetchResult.places;
    truncated = fetchResult.truncated;

    try {
      const expiresAt = new Date(Date.now() + OSM_CONFIG.cacheTtlHours * 60 * 60 * 1000);
      await OsmCache.findOneAndUpdate(
        { key, kind: "places" },
        {
          key,
          kind: "places",
          center,
          radius: searchRadius,
          payload: { places: rawPlaces, truncated },
          expiresAt,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Cache write error:", err.message);
    }
  }

  // 3. Exact distance filter: recompute distances from student's exact origin
  const inRangePlaces = [];
  for (const p of rawPlaces) {
    const distMeters = calculateDistance(exactLat, exactLng, p.location.lat, p.location.lng);
    if (distMeters <= searchRadius) {
      inRangePlaces.push({
        ...p,
        distanceMeters: Math.round(distMeters),
        distanceKm: Math.round((distMeters / 1000) * 10) / 10,
        walkingMinutes: walkingMinutes(distMeters),
      });
    }
  }

  // 4. Join ratings and verified diet labels from our Place documents with ONE query using $in
  const placeIds = inRangePlaces.map((p) => p.osmId);
  const ratingMap = new Map();
  const dietLabelMap = new Map();

  if (placeIds.length > 0) {
    try {
      const existingDocs = await Place.find({
        osmId: { $in: placeIds },
      })
        .select("osmType osmId ratingAverage reviewCount dietLabel")
        .lean();

      for (const doc of existingDocs) {
        const docKey = `${doc.osmType}-${doc.osmId}`;
        ratingMap.set(docKey, {
          ratingAverage: doc.ratingAverage || 0,
          reviewCount: doc.reviewCount || 0,
        });
        if (doc.dietLabel) {
          dietLabelMap.set(docKey, doc.dietLabel);
        }
      }
    } catch (err) {
      console.error("Rating/label join error:", err.message);
    }
  }

  // 5. Build clean whitelisted place objects with applied verified diet labels
  const finalPlaces = inRangePlaces.map((p) => {
    const ratings = ratingMap.get(p.placeKey) || { ratingAverage: 0, reviewCount: 0 };
    const verifiedLabel = dietLabelMap.get(p.placeKey) || null;
    const finalDiet = applyVerifiedDiet(p.diet || { vegLevel: "unknown", nonVegLikely: false }, verifiedLabel);

    return {
      osmType: p.osmType,
      osmId: p.osmId,
      placeKey: p.placeKey,
      name: p.name,
      kind: p.kind,
      cuisines: p.cuisines || [],
      address: p.address || null,
      openingHours: p.openingHours || null,
      location: p.location,
      distanceKm: p.distanceKm,
      walkingMinutes: p.walkingMinutes,
      diet: finalDiet,
      ratingAverage: ratings.ratingAverage,
      reviewCount: ratings.reviewCount,
    };
  });

  // Sort by straight-line distance ascending
  finalPlaces.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    origin: {
      lat: exactLat,
      lng: exactLng,
      label: origin.label || "Current location",
    },
    places: finalPlaces,
    meta: {
      fromCache,
      truncated,
      radius: searchRadius,
      source: "OpenStreetMap",
    },
  };
}

/**
 * Returns reviews and rating averages for a placeKey ("node-123", "way-456").
 */
export async function getPlaceReviews(placeKey) {
  const match = String(placeKey).match(/^(node|way|relation)-(\d+)$/);
  if (!match) return { ratingAverage: 0, reviewCount: 0, reviews: [] };

  const [, osmType, idStr] = match;
  const osmId = Number(idStr);

  const place = await Place.findOne({ osmType, osmId }).lean();
  if (!place) {
    return { ratingAverage: 0, reviewCount: 0, reviews: [] };
  }

  const reviews = (place.reviews || []).map((r) => ({
    userId: r.userId ? r.userId.toString() : null,
    userName: r.userName || "Anonymous Student",
    rating: Number(r.rating) || 5,
    comment: r.comment || "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));

  // Newest first
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    ratingAverage: place.ratingAverage || 0,
    reviewCount: place.reviewCount || 0,
    reviews,
  };
}

/**
 * Adds or updates a student review for an OSM place.
 * Lazily creates the Place document if it does not yet exist after verifying against OSM.
 */
export async function addOrUpdateReview(placeKey, user, { rating, comment }) {
  const match = String(placeKey).match(/^(node|way|relation)-(\d+)$/);
  if (!match) {
    const err = new Error("Invalid place identifier format.");
    err.status = 400;
    throw err;
  }

  const [, osmType, idStr] = match;
  const osmId = Number(idStr);
  const userId = user.id || user._id;
  const userName = user.name || "Anonymous Student";
  const numRating = parseInt(rating, 10);
  const cleanComment = (comment || "").trim();

  const placeDoc = await ensurePlaceDocument(osmType, osmId);

  // Update or insert review (one review per user per place)
  const existingIndex = placeDoc.reviews.findIndex(
    (r) => r.userId?.toString() === userId.toString()
  );

  if (existingIndex >= 0) {
    placeDoc.reviews[existingIndex].rating = numRating;
    placeDoc.reviews[existingIndex].comment = cleanComment;
    placeDoc.reviews[existingIndex].userName = userName;
    placeDoc.reviews[existingIndex].createdAt = new Date();
  } else {
    placeDoc.reviews.push({
      userId,
      userName,
      rating: numRating,
      comment: cleanComment,
      createdAt: new Date(),
    });
  }

  // Recalculate average rating and review count
  placeDoc.reviewCount = placeDoc.reviews.length;
  const total = placeDoc.reviews.reduce((sum, r) => sum + r.rating, 0);
  placeDoc.ratingAverage = Math.round((total / placeDoc.reviewCount) * 10) / 10;

  await placeDoc.save();

  const reviews = placeDoc.reviews.map((r) => ({
    userId: r.userId ? r.userId.toString() : null,
    userName: r.userName || "Anonymous Student",
    rating: Number(r.rating),
    comment: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    ratingAverage: placeDoc.ratingAverage,
    reviewCount: placeDoc.reviewCount,
    reviews,
  };
}
