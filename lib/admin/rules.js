// lib/admin/rules.js
// Pure business and safety rules for administrative operations.

import { ADMIN_CONFIG } from "./config.js";

/**
 * Checks whether an admin can deactivate a given target user.
 *
 * @param {Object} params
 * @param {Object} [params.actor] - Performing admin
 * @param {Object} [params.adminUser] - Performing admin alias
 * @param {Object} [params.target] - Target user
 * @param {Object} [params.targetUser] - Target user alias
 * @param {number} [params.activeAdminCount=1] - Count of active admins
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canDeactivateUser(params = {}) {
  const actor = params.actor || params.adminUser;
  const target = params.target || params.targetUser;
  const activeAdminCount = params.activeAdminCount !== undefined ? params.activeAdminCount : 1;

  if (!actor || !target) {
    return { allowed: false, reason: "Actor and target must be defined." };
  }

  const actorId = (actor.id || actor._id)?.toString();
  const targetId = (target.id || target._id)?.toString();

  if (actorId && targetId && actorId === targetId) {
    return { allowed: false, reason: "You cannot deactivate your own account." };
  }

  if (target.role === "admin") {
    if (activeAdminCount <= 1) {
      return { allowed: false, reason: "Cannot deactivate the last active administrator." };
    }
    return { allowed: false, reason: "Administrator accounts cannot be deactivated from this panel." };
  }

  if (target.role !== "student" && target.role !== "buddy") {
    return { allowed: false, reason: "Only student and buddy accounts can be deactivated." };
  }

  return { allowed: true };
}

/**
 * Checks whether an admin can change the senior mentor status of a target user.
 *
 * @param {Object} params
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canChangeSeniorStatus(params = {}) {
  const target = params.target || params.targetUser || (params.role ? params : null);

  if (!target) {
    return { allowed: false, reason: "Target user must be defined." };
  }

  if (target.role === "admin") {
    return { allowed: false, reason: "Senior status applies only to students and buddies, not administrators." };
  }

  if (target.role !== "student" && target.role !== "buddy") {
    return { allowed: false, reason: "Only student and buddy accounts can be marked as verified seniors." };
  }

  return { allowed: true };
}

/**
 * Determines whether a guide requires re-verification (>90 days).
 *
 * @param {string|Date|null} lastVerified
 * @param {Date} [now=new Date()]
 * @param {number} [staleDays=ADMIN_CONFIG.STALE_GUIDE_DAYS]
 * @returns {boolean}
 */
export function isGuideStale(lastVerified, now = new Date(), staleDays = ADMIN_CONFIG.STALE_GUIDE_DAYS) {
  if (!lastVerified) return true;

  const verifiedDate = new Date(lastVerified);
  if (Number.isNaN(verifiedDate.getTime())) return true;

  const msDiff = now.getTime() - verifiedDate.getTime();
  const daysDiff = msDiff / (1000 * 60 * 60 * 24);

  return daysDiff > staleDays;
}

/**
 * Checks whether a guide meets the requirements to be published or drafted.
 *
 * @param {Object} guide
 * @param {Date} [now=new Date()]
 * @returns {{ allowed: boolean, canPublish: boolean, reason?: string, missing: string[] }}
 */
export function canPublishGuide(guide, now = new Date()) {
  const missing = [];
  const status = guide?.status || "draft";

  if (!guide?.title || typeof guide.title !== "string" || !guide.title.trim()) {
    missing.push("Title is required.");
  } else if (guide.title.trim().length < ADMIN_CONFIG.limits.titleMin) {
    missing.push("A valid title of at least 3 characters is required.");
  }

  if (status === "published") {
    if (!guide?.summary || typeof guide.summary !== "string" || !guide.summary.trim()) {
      missing.push("Summary is required to publish a guide.");
    }

    const steps = Array.isArray(guide?.steps) ? guide.steps : [];
    if (steps.length === 0) {
      missing.push("A guide must contain at least one step before it can be published.");
    } else {
      const hasValidStep = steps.some((s) => s?.title && typeof s.title === "string" && s.title.trim());
      if (!hasValidStep) {
        missing.push("At least one step must have a title.");
      }
    }
  }

  const allowed = missing.length === 0;
  return {
    allowed,
    canPublish: allowed,
    reason: missing.join(", "),
    missing,
  };
}
