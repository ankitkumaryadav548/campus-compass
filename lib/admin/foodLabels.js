// lib/admin/foodLabels.js
// Service for listing campus food places and applying verified dietary labels.

import { connectDB } from "@/lib/mongodb";
import { CAMPUS_COORDS } from "@/lib/campus";
import { getNearbyPlaces, ensurePlaceDocument } from "@/lib/places";
import { recordAudit } from "./audit";

/**
 * Lists nearby food and grocery places around the university campus for administrative labeling.
 */
export async function listNearbyForLabelling(filters = {}) {
  await connectDB();
  const radius = parseInt(filters.radius, 10) || 2000;
  const search = (filters.search || "").trim().toLowerCase();
  const unlabelledOnly = filters.unlabelledOnly === true || filters.unlabelledOnly === "true";

  const { places } = await getNearbyPlaces(CAMPUS_COORDS, radius);

  let filtered = places.filter((p) => p.kind !== "grocery");

  if (unlabelledOnly) {
    filtered = filtered.filter((p) => !p.diet?.dietVerified);
  }

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (Array.isArray(p.cuisines) && p.cuisines.some((c) => c.toLowerCase().includes(search)))
    );
  }

  return filtered.map((p) => ({
    placeKey: p.placeKey,
    osmType: p.osmType,
    osmId: p.osmId,
    name: p.name,
    kind: p.kind,
    cuisines: p.cuisines || [],
    distanceKm: p.distanceKm,
    walkingMinutes: p.walkingMinutes,
    diet: p.diet,
    dietLabel: p.diet?.dietLabel || null,
    dietVerified: Boolean(p.diet?.dietVerified),
  }));
}

/**
 * Sets or removes a verified dietary classification label on an OpenStreetMap place.
 * Lazily creates the Place record from OpenStreetMap if it doesn't exist yet.
 */
export async function setDietLabel(placeKey, label, adminId) {
  await connectDB();
  const match = String(placeKey).match(/^(node|way|relation)-(\d+)$/);
  if (!match) {
    const err = new Error("Invalid place identifier format.");
    err.status = 400;
    throw err;
  }

  const [, osmType, idStr] = match;
  const osmId = Number(idStr);

  const placeDoc = await ensurePlaceDocument(osmType, osmId);

  if (!label) {
    placeDoc.dietLabel = null;
    placeDoc.dietLabelBy = null;
    placeDoc.dietLabelAt = null;
    await placeDoc.save();

    await recordAudit({
      adminId,
      action: "food_label_removed",
      entityType: "food_place",
      entityId: placeKey,
      summary: `Removed verified diet label from "${placeDoc.name}"`,
    });

    return {
      placeKey,
      dietLabel: null,
      dietVerified: false,
    };
  }

  placeDoc.dietLabel = label;
  placeDoc.dietLabelBy = adminId;
  placeDoc.dietLabelAt = new Date();
  await placeDoc.save();

  await recordAudit({
    adminId,
    action: "food_label_set",
    entityType: "food_place",
    entityId: placeKey,
    summary: `Set verified diet label "${label}" on "${placeDoc.name}"`,
  });

  return {
    placeKey,
    dietLabel: placeDoc.dietLabel,
    dietVerified: true,
  };
}
