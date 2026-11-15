// lib/personalization.js
// Central helper for country-aware content fetching.
// ─────────────────────────────────────────────────────────────────────────
// RULE: NO country names are hardcoded here. All country differences come
//       from DATA TAGS in the database. This file only contains logic.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build the array of region tags to query for a given user.
 * Fallback chain: country → regionGroup → "ALL"
 * Empty / undefined values are filtered out.
 *
 * @param {Object} user - User document (or plain object) with .country, .regionGroup
 * @returns {string[]}  - e.g. ["Uganda", "East Africa", "ALL"]
 */
export function buildRegionTags(user) {
  return [user?.country, user?.regionGroup, "ALL"].filter(
    (tag) => tag && tag.trim() !== ""
  );
}

/**
 * Returns the Mongoose query fragment for region-personalised content.
 * Use in every module: Guide, ChecklistItem, Place (countryTags), Event.
 *
 * Usage:
 *   const filter = { ...regionQuery(user), category: "sim" };
 *   const guides = await Guide.find(filter).lean();
 *
 * @param {Object} user
 * @returns {{ region: { $in: string[] } }}
 */
export function regionQuery(user) {
  return { region: { $in: buildRegionTags(user) } };
}

/**
 * Same as regionQuery() but for the Place model which uses `countryTags`
 * instead of `region`.
 *
 * @param {Object} user
 * @returns {{ countryTags: { $in: string[] } }}
 */
export function placeRegionQuery(user) {
  return { countryTags: { $in: buildRegionTags(user) } };
}

/**
 * Returns one of three specificity labels for a single content document.
 *
 * @param {Object} item  - Document with a `region` or `countryTags` array field
 * @param {Object} user  - User with .country, .regionGroup
 * @param {string} [field="region"]  - Field name to check ("region" or "countryTags")
 * @returns {"country" | "region" | "all"}
 */
export function getSpecificityLabel(item, user, field = "region") {
  const tags = item[field] || [];
  if (user?.country     && tags.includes(user.country))      return "country";
  if (user?.regionGroup && tags.includes(user.regionGroup))  return "region";
  return "all";
}

/**
 * Sorts an array of content documents so the most specific region match
 * for this user comes first.
 *
 * Priority: exact country match (score 2) > regionGroup match (score 1) > "ALL" (score 0).
 * Preserves original order within the same score tier (stable sort).
 *
 * @param {Array}  items - Array of lean documents with `region` or `countryTags` field
 * @param {Object} user  - User with .country and .regionGroup
 * @param {string} [field="region"]  - Field to score on
 * @returns {Array}      - New sorted array (original is not mutated)
 */
export function sortBySpecificity(items, user, field = "region") {
  const score = (item) => {
    const tags = item[field] || [];
    if (user?.country     && tags.includes(user.country))      return 2;
    if (user?.regionGroup && tags.includes(user.regionGroup))  return 1;
    return 0;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}

/**
 * Sorts a list of buddy users by how well they match the requesting student.
 *
 * Scoring (higher = better match):
 *   3 pts – same country
 *   2 pts – shares at least one language
 *   1 pt  – same regionGroup
 * Scores are additive (a buddy from same country who also shares a language = 5 pts).
 *
 * @param {Array}  buddies - Array of user documents with .country, .regionGroup, .languages[]
 * @param {Object} student - Current student user
 * @returns {Array}        - New sorted array, best match first
 */
export function sortBuddiesByMatch(buddies, student) {
  const score = (buddy) => {
    let pts = 0;
    if (buddy.country === student?.country) pts += 3;

    const sharedLang =
      Array.isArray(buddy.languages) &&
      Array.isArray(student?.languages) &&
      buddy.languages.some((lang) => student.languages.includes(lang));
    if (sharedLang) pts += 2;

    if (
      buddy.regionGroup &&
      student?.regionGroup &&
      buddy.regionGroup === student.regionGroup
    ) pts += 1;

    return pts;
  };

  return [...buddies].sort((a, b) => score(b) - score(a));
}

/**
 * Returns the match score for a single buddy (useful for displaying in the UI).
 * Uses the same scoring logic as sortBuddiesByMatch.
 *
 * @param {Object} buddy
 * @param {Object} student
 * @returns {number}
 */
export function getBuddyScore(buddy, student) {
  let pts = 0;
  if (buddy.country === student?.country) pts += 3;
  const sharedLang =
    Array.isArray(buddy.languages) &&
    Array.isArray(student?.languages) &&
    buddy.languages.some((lang) => student.languages.includes(lang));
  if (sharedLang) pts += 2;
  if (buddy.regionGroup && student?.regionGroup && buddy.regionGroup === student.regionGroup) pts += 1;
  return pts;
}

/**
 * Returns a friendly note when no country-specific content exists for the user.
 * Called when getSpecificityLabel returns "all" for every item returned.
 *
 * @param {Object} user - User with .country
 * @returns {string}
 */
export function noContentNote(user) {
  const country = user?.country;
  if (!country || country.trim() === "") {
    return "Complete your profile to get country-specific content and buddy matches.";
  }
  return (
    `We don't have ${country}-specific guides yet. ` +
    `Showing general guides for now. ` +
    `Content improves as more students from ${country} join!`
  );
}

/**
 * Checks whether all returned items are "ALL"-level (no country or region match).
 * Use this to decide whether to show the noContentNote banner.
 *
 * @param {Array}  items
 * @param {Object} user
 * @param {string} [field="region"]
 * @returns {boolean}
 */
export function isOnlyGenericContent(items, user, field = "region") {
  return items.every((item) => getSpecificityLabel(item, user, field) === "all");
}
