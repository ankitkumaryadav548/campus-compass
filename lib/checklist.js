// lib/checklist.js
// Shared server-side logic for the checklist module.
// Used by both the page (Server Component) and the API route.

import ChecklistItem from "@/models/ChecklistItem";
import UserChecklist from "@/models/UserChecklist";
import { regionQuery, getSpecificityLabel } from "@/lib/personalization";
import { getDeadlineInfo } from "@/lib/dashboard";

/**
 * Fetches all checklist items visible to a user and merges in their
 * completion status. Returns a plain array of enriched item objects.
 *
 * @param {Object} user - Session user (needs .country, .regionGroup, .arrivalDate, .id)
 * @returns {Promise<Array>}
 */
export async function getChecklistForUser(user) {
  const userId = user.id || user._id;
  const [items, userRows] = await Promise.all([
    ChecklistItem.find(regionQuery(user)).sort({ order: 1 }).lean(),
    UserChecklist.find({ userId }).lean(),
  ]);

  // Index completion rows by itemId for O(1) lookup
  const statusByItemId = {};
  for (const row of userRows) {
    statusByItemId[row.itemId.toString()] = row.status;
  }

  return items.map((item) => {
    const itemId = item._id.toString();
    const status = statusByItemId[itemId] || "pending";
    const deadlineInfo = getDeadlineInfo(user.arrivalDate, item.deadlineOffsetDays);
    const specificity = getSpecificityLabel(item, user);

    // Compute the actual deadline date for display
    let deadlineDate = null;
    if (user.arrivalDate && item.deadlineOffsetDays != null) {
      const arrival = new Date(user.arrivalDate);
      deadlineDate = new Date(
        arrival.getTime() + item.deadlineOffsetDays * 24 * 60 * 60 * 1000
      );
    }

    return {
      _id: itemId,
      title: item.title,
      description: item.description,
      region: item.region,
      order: item.order,
      guideCategory: item.guideCategory || null,
      status,
      deadlineDate: deadlineDate ? deadlineDate.toISOString() : null,
      daysLeft: deadlineInfo.daysLeft,
      deadlineText: deadlineInfo.text,
      deadlineBadgeVariant: deadlineInfo.badgeVariant,
      isOverdue: deadlineInfo.isOverdue,
      isCountrySpecific: specificity === "country",
      countryLabel: specificity === "country" ? user.country : null,
    };
  });
}
