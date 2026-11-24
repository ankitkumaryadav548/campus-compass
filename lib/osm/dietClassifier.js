// lib/osm/dietClassifier.js
// Pure diet classifier based on OpenStreetMap tags.
// Never labels a place without evidence from the tags.

import { OSM_CONFIG } from "./config.js";

/**
 * Classifies the diet of an OSM place based on its tags.
 *
 * @param {Object} tags - Raw OSM element tags (lowercased keys and values recommended)
 * @returns {{ vegLevel: "only" | "options" | "unknown", nonVegLikely: boolean }}
 */
export function classifyDiet(tags = {}) {
  const vegetarian = (tags["diet:vegetarian"] || "").toLowerCase().trim();
  const vegan = (tags["diet:vegan"] || "").toLowerCase().trim();
  const halal = (tags["diet:halal"] || "").toLowerCase().trim();
  const cuisineRaw = (tags["cuisine"] || "").toLowerCase();

  // 1. Veg level determination
  let vegLevel = "unknown";
  if (vegetarian === "only" || vegan === "only") {
    vegLevel = "only";
  } else if (vegetarian === "yes" || vegan === "yes") {
    vegLevel = "options";
  }

  // 2. Non-veg likelihood determination
  let nonVegLikely = false;
  if (halal === "yes" || halal === "only") {
    nonVegLikely = true;
  } else if (cuisineRaw) {
    const cuisines = cuisineRaw.split(";").map((c) => c.trim());
    nonVegLikely = cuisines.some((c) =>
      OSM_CONFIG.meatCuisines.some((keyword) => c.includes(keyword))
    );
  }

  return { vegLevel, nonVegLikely };
}

/**
 * Applies a verified diet label to a place's diet classification.
 * - pure_veg: vegLevel "only", nonVegLikely false
 * - veg_and_nonveg: vegLevel "options", nonVegLikely true
 * - nonveg_only: vegLevel "unknown", nonVegLikely true
 * - null: leaves diet unchanged
 * Carries dietVerified true when a label was applied.
 *
 * @param {{ vegLevel: "only" | "options" | "unknown", nonVegLikely: boolean }} diet
 * @param {"pure_veg"|"veg_and_nonveg"|"nonveg_only"|null} dietLabel
 * @returns {{ vegLevel: "only" | "options" | "unknown", nonVegLikely: boolean, dietVerified: boolean, dietLabel?: string|null }}
 */
export function applyVerifiedDiet(diet, dietLabel) {
  if (!dietLabel) {
    return {
      vegLevel: diet?.vegLevel || "unknown",
      nonVegLikely: Boolean(diet?.nonVegLikely),
      dietVerified: false,
      dietLabel: null,
    };
  }

  if (dietLabel === "pure_veg") {
    return {
      vegLevel: "only",
      nonVegLikely: false,
      dietVerified: true,
      dietLabel: "pure_veg",
    };
  }

  if (dietLabel === "veg_and_nonveg") {
    return {
      vegLevel: "options",
      nonVegLikely: true,
      dietVerified: true,
      dietLabel: "veg_and_nonveg",
    };
  }

  if (dietLabel === "nonveg_only") {
    return {
      vegLevel: "unknown",
      nonVegLikely: true,
      dietVerified: true,
      dietLabel: "nonveg_only",
    };
  }

  return {
    vegLevel: diet?.vegLevel || "unknown",
    nonVegLikely: Boolean(diet?.nonVegLikely),
    dietVerified: false,
    dietLabel: null,
  };
}
