// lib/guides.js
// Shared server-side logic for the Guides module (SIM and Bank).
// Used by both Server Component pages and API routes.

import Guide from "@/models/Guide";
import GuideProgress from "@/models/GuideProgress";
import { regionQuery, getSpecificityLabel, sortBySpecificity } from "@/lib/personalization";

/**
 * Returns all guides of a given category visible to the user,
 * filtered by region and visaType, sorted by specificity,
 * enriched with user progress and plain serializable fields.
 *
 * @param {Object} user - Session user (needs id/userId, country, regionGroup, visaType)
 * @param {string} category - "sim" or "bank"
 * @returns {Promise<Array>}
 */
export async function getGuidesForUser(user, category) {
  const visaFilter = user?.visaType
    ? {
        $or: [
          { visaTypes: user.visaType },
          { visaTypes: "ALL" },
          { visaTypes: { $size: 0 } },
          { visaTypes: { $exists: false } },
        ],
      }
    : {};

  const query = {
    category,
    status: "published",
    ...regionQuery(user),
    ...visaFilter,
  };

  const guides = await Guide.find(query).lean();
  const sortedGuides = sortBySpecificity(guides, user);

  const userId = user?.id || user?._id;
  const guideIds = sortedGuides.map((g) => g._id);

  const progressRows = userId
    ? await GuideProgress.find({ userId, guideId: { $in: guideIds } }).lean()
    : [];

  const progressMap = {};
  for (const row of progressRows) {
    progressMap[row.guideId.toString()] = row.completedSteps || [];
  }

  return sortedGuides.map((guide) => {
    const guideId = guide._id.toString();
    const completedSteps = progressMap[guideId] || [];

    return {
      _id: guideId,
      category: guide.category,
      title: guide.title,
      region: guide.region || [],
      visaTypes: guide.visaTypes || [],
      requiredDocs: guide.requiredDocs || [],
      providers: (guide.providers || []).map((p) => ({
        name: p.name,
        notes: p.notes || "",
      })),
      steps: (guide.steps || []).map((s) => ({
        order: s.order,
        title: s.title,
        description: s.description || "",
      })),
      tips: guide.tips || [],
      sourceUrl: guide.sourceUrl || "",
      lastVerified: guide.lastVerified ? new Date(guide.lastVerified).toISOString() : null,
      isSample: Boolean(guide.isSample),
      completedSteps,
      specificityLabel: getSpecificityLabel(guide, user),
    };
  });
}

/**
 * Returns high-level summary cards for SIM and Bank guides for the /guides overview page.
 *
 * @param {Object} user
 * @returns {Promise<{ sim: Object|null, bank: Object|null }>}
 */
export async function getGuidesOverviewForUser(user) {
  const [simGuides, bankGuides] = await Promise.all([
    getGuidesForUser(user, "sim"),
    getGuidesForUser(user, "bank"),
  ]);

  const topSim = simGuides[0] || null;
  const topBank = bankGuides[0] || null;

  return {
    sim: topSim
      ? {
          guide: topSim,
          totalGuides: simGuides.length,
          completedCount: topSim.completedSteps.length,
          totalSteps: topSim.steps.length,
        }
      : null,
    bank: topBank
      ? {
          guide: topBank,
          totalGuides: bankGuides.length,
          completedCount: topBank.completedSteps.length,
          totalSteps: topBank.steps.length,
        }
      : null,
  };
}
