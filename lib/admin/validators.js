// lib/admin/validators.js
// Pure input validation functions for administrative actions.

import { ADMIN_CONFIG } from "./config.js";
import { countries, visaOptions } from "../countries.js";

// Build sets of recognized country names, codes, and region groups from lib/countries.js
const COMMON_COUNTRY_CODES = [
  "NP", "BD", "BT", "IN", "LK", "US", "UK", "CA", "AU", "NG",
  "UG", "VN", "KE", "GH", "TZ", "RW", "MY", "SG", "ID", "TH",
  "PH", "AE", "SA", "FR", "DE", "JP", "KR", "CN", "ZA", "EG",
];

const KNOWN_COUNTRIES = new Set([
  ...countries.map((c) => c.name.toUpperCase()),
  ...COMMON_COUNTRY_CODES,
]);
const KNOWN_REGION_GROUPS = new Set(
  countries
    .map((c) => c.regionGroup ? c.regionGroup.toUpperCase().replace(/\s+/g, "_") : null)
    .filter(Boolean)
);
// Also include common region groups
["SOUTH_ASIA", "EAST_ASIA", "SOUTHEAST_ASIA", "AFRICA", "MIDDLE_EAST", "EUROPE", "AMERICAS"].forEach((g) =>
  KNOWN_REGION_GROUPS.add(g)
);

/**
 * Checks whether a single region tag is valid.
 * Must be "ALL", a known country name/code, or a known regional group.
 *
 * @param {string} tag
 * @returns {boolean}
 */
export function isRegionTagValid(tag) {
  if (typeof tag !== "string") return false;
  const trimmed = tag.trim().toUpperCase();
  if (trimmed === "ALL") return true;
  return KNOWN_COUNTRIES.has(trimmed) || KNOWN_REGION_GROUPS.has(trimmed);
}

/**
 * Validates a region tag and returns an object with valid boolean.
 *
 * @param {string} tag
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRegionTag(tag) {
  const valid = isRegionTagValid(tag);
  return {
    valid,
    error: valid ? null : `Unknown region value "${tag}". Must be "ALL", a recognized country, or a regional group.`,
  };
}

/**
 * Validates a URL ensuring it starts with http:// or https://.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isValidWebUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return /^https?:\/\/.+/i.test(trimmed);
}

/**
 * Validates guide creation or edit payload.
 *
 * @param {any} body
 * @returns {{ ok: boolean, valid: boolean, value?: Object, errors: string[] }}
 */
export function validateGuideInput(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, valid: false, errors: ["Invalid payload object."] };
  }

  // 1. Title
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    errors.push("Title is required.");
  } else if (title.length < ADMIN_CONFIG.limits.titleMin || title.length > ADMIN_CONFIG.limits.titleMax) {
    errors.push(`Title must be between ${ADMIN_CONFIG.limits.titleMin} and ${ADMIN_CONFIG.limits.titleMax} characters.`);
  }

  // 2. Category
  const category = typeof body.category === "string" ? body.category.trim().toLowerCase() : "";
  if (!ADMIN_CONFIG.categories.includes(category)) {
    errors.push(`Invalid category: "${category}". Must be one of: ${ADMIN_CONFIG.categories.join(", ")}.`);
  }

  // 3. Regions / ApplicableRegions
  const rawRegions = Array.isArray(body.region)
    ? body.region
    : Array.isArray(body.applicableRegions)
    ? body.applicableRegions
    : ["ALL"];

  const cleanRegions = [];
  for (const r of rawRegions) {
    if (typeof r === "string" && isRegionTagValid(r)) {
      const cleanR = r.trim().toUpperCase();
      if (!cleanRegions.includes(cleanR)) cleanRegions.push(cleanR);
    } else {
      errors.push(`Unknown region value "${r}". Must be "ALL", a recognized country, or a regional group.`);
    }
  }
  if (cleanRegions.length === 0) {
    cleanRegions.push("ALL");
  }

  // 4. Visa Types
  const rawVisas = Array.isArray(body.visaTypes)
    ? body.visaTypes
    : Array.isArray(body.applicableVisaTypes)
    ? body.applicableVisaTypes
    : [];

  const cleanVisas = [];
  for (const v of rawVisas) {
    if (typeof v === "string" && v.trim()) {
      cleanVisas.push(v.trim());
    }
  }

  // 5. Required Documents
  const rawDocs = Array.isArray(body.requiredDocs)
    ? body.requiredDocs
    : Array.isArray(body.requiredDocuments)
    ? body.requiredDocuments
    : [];

  const cleanDocs = [];
  for (const d of rawDocs) {
    if (typeof d === "string" && d.trim()) {
      cleanDocs.push(d.trim().slice(0, ADMIN_CONFIG.limits.docNameMax));
    }
  }

  // 6. Providers
  const rawProviders = Array.isArray(body.providers) ? body.providers : [];
  const cleanProviders = [];
  for (const p of rawProviders) {
    const pName = typeof p?.name === "string" ? p.name.trim().slice(0, ADMIN_CONFIG.limits.providerNameMax) : "";
    const pNotes = typeof p?.notes === "string" ? p.notes.trim().slice(0, ADMIN_CONFIG.limits.providerNotesMax) : "";
    const pBestFor = typeof p?.bestFor === "string" ? p.bestFor.trim().slice(0, ADMIN_CONFIG.limits.providerNotesMax) : pNotes;
    const pLink = typeof p?.link === "string" ? p.link.trim() : "";
    if (pName) {
      cleanProviders.push({ name: pName, notes: pNotes || pBestFor, bestFor: pBestFor, link: pLink });
    }
  }

  // 7. Steps
  const rawSteps = Array.isArray(body.steps) ? body.steps : [];
  const cleanSteps = [];
  for (let i = 0; i < rawSteps.length; i++) {
    const s = rawSteps[i];
    const sTitle = typeof s?.title === "string" ? s.title.trim().slice(0, ADMIN_CONFIG.limits.stepTitleMax) : "";
    const sDesc = typeof s?.description === "string"
      ? s.description.trim().slice(0, ADMIN_CONFIG.limits.stepDescriptionMax)
      : typeof s?.detail === "string"
      ? s.detail.trim().slice(0, ADMIN_CONFIG.limits.stepDescriptionMax)
      : "";
    const sTip = typeof s?.tip === "string" ? s.tip.trim().slice(0, ADMIN_CONFIG.limits.tipMax) : "";

    if (sTitle) {
      cleanSteps.push({
        order: i + 1,
        title: sTitle,
        description: sDesc,
        detail: sDesc,
        tip: sTip,
      });
    } else {
      errors.push(`Step ${i + 1}: title is required.`);
    }
  }

  // 8. Tips & Common Mistakes
  const rawTips = Array.isArray(body.tips) ? body.tips : [];
  const cleanTips = [];
  for (const t of rawTips) {
    if (typeof t === "string" && t.trim()) {
      cleanTips.push(t.trim().slice(0, ADMIN_CONFIG.limits.tipMax));
    }
  }

  const rawMistakes = Array.isArray(body.commonMistakes) ? body.commonMistakes : [];
  const cleanMistakes = [];
  for (const m of rawMistakes) {
    if (typeof m === "string" && m.trim()) {
      cleanMistakes.push(m.trim().slice(0, ADMIN_CONFIG.limits.tipMax));
    }
  }

  // 9. Source URL
  let cleanSourceUrl = "";
  if (body.sourceUrl && typeof body.sourceUrl === "string" && body.sourceUrl.trim()) {
    const trimmed = body.sourceUrl.trim();
    if (!isValidWebUrl(trimmed)) {
      errors.push("Source link must begin with http:// or https://.");
    } else if (trimmed.length > ADMIN_CONFIG.limits.sourceUrlMax) {
      errors.push(`Source link cannot exceed ${ADMIN_CONFIG.limits.sourceUrlMax} characters.`);
    } else {
      cleanSourceUrl = trimmed;
    }
  }

  // 10. Summary & Slug
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  // 11. Status
  let cleanStatus = "draft";
  if (body.status && typeof body.status === "string") {
    const s = body.status.trim().toLowerCase();
    if (ADMIN_CONFIG.guideStatuses.includes(s)) {
      cleanStatus = s;
    } else {
      errors.push(`Status must be one of: ${ADMIN_CONFIG.guideStatuses.join(", ")}.`);
    }
  }

  const isOk = errors.length === 0;

  return {
    ok: isOk,
    valid: isOk,
    value: {
      title,
      category,
      slug,
      summary,
      region: cleanRegions,
      applicableRegions: cleanRegions,
      visaTypes: cleanVisas,
      applicableVisaTypes: cleanVisas,
      requiredDocs: cleanDocs,
      requiredDocuments: cleanDocs,
      providers: cleanProviders,
      steps: cleanSteps,
      tips: cleanTips,
      commonMistakes: cleanMistakes,
      sourceUrl: cleanSourceUrl,
      status: cleanStatus,
    },
    errors,
  };
}

/**
 * Validates checklist item creation or update.
 */
export function validateChecklistInput(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, valid: false, errors: ["Invalid payload object."] };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < ADMIN_CONFIG.limits.titleMin || title.length > ADMIN_CONFIG.limits.titleMax) {
    errors.push(`Title must be between ${ADMIN_CONFIG.limits.titleMin} and ${ADMIN_CONFIG.limits.titleMax} characters.`);
  }

  const description = typeof body.description === "string" ? body.description.trim().slice(0, ADMIN_CONFIG.limits.descriptionMax) : "";

  const category = typeof body.category === "string" ? body.category.trim().toLowerCase() : "before_arrival";
  if (!ADMIN_CONFIG.CHECKLIST_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${ADMIN_CONFIG.CHECKLIST_CATEGORIES.join(", ")}.`);
  }

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    value: {
      title,
      description,
      category,
      applicableRegions: Array.isArray(body.applicableRegions) ? body.applicableRegions : ["ALL"],
      applicableVisaTypes: Array.isArray(body.applicableVisaTypes) ? body.applicableVisaTypes : [],
      isEssential: body.isEssential !== undefined ? Boolean(body.isEssential) : true,
      priority: typeof body.priority === "number" ? body.priority : 1,
    },
    errors,
  };
}

/**
 * Validates campus event creation or update.
 */
export function validateEventInput(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, valid: false, errors: ["Invalid payload object."] };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < ADMIN_CONFIG.limits.titleMin || title.length > ADMIN_CONFIG.limits.titleMax) {
    errors.push(`Title must be between ${ADMIN_CONFIG.limits.titleMin} and ${ADMIN_CONFIG.limits.titleMax} characters.`);
  }

  const description = typeof body.description === "string" ? body.description.trim().slice(0, ADMIN_CONFIG.limits.descriptionMax) : "";

  let cleanDate = null;
  if (!body.date) {
    errors.push("Event date is required.");
  } else {
    const time = new Date(body.date).getTime();
    if (Number.isNaN(time)) {
      errors.push("Invalid event date format.");
    } else {
      cleanDate = new Date(time);
    }
  }

  const location = typeof body.location === "string" ? body.location.trim().slice(0, ADMIN_CONFIG.limits.locationMax) : "";
  if (!location) {
    errors.push("Location is required.");
  }

  const category = typeof body.category === "string" ? body.category.trim().toLowerCase() : "social";
  if (!ADMIN_CONFIG.EVENT_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${ADMIN_CONFIG.EVENT_CATEGORIES.join(", ")}.`);
  }

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    value: {
      title,
      description,
      date: cleanDate,
      location,
      category,
      maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees, 10) : null,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
    },
    errors,
  };
}

/**
 * Validates a food place diet label update.
 * Accepts either (placeKey, body) or just (body).
 */
export function validateFoodLabelInput(placeKeyOrBody, maybeBody) {
  const errors = [];
  let placeKey = "";
  let body = null;

  if (typeof placeKeyOrBody === "string") {
    placeKey = placeKeyOrBody;
    body = maybeBody || {};
  } else {
    body = placeKeyOrBody || {};
    placeKey = body.placeKey || "node-1";
  }

  const label = body?.label !== undefined ? body.label : null;
  let cleanLabel = null;
  if (label !== null && label !== "" && label !== undefined) {
    if (typeof label === "string" && ADMIN_CONFIG.foodLabels.includes(label.trim())) {
      cleanLabel = label.trim();
    } else {
      errors.push(`Food diet label must be one of: ${ADMIN_CONFIG.foodLabels.join(", ")} or null to remove.`);
    }
  }

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    value: { placeKey, label: cleanLabel },
    errors,
  };
}

/**
 * Validates report status resolution update.
 */
export function validateReportActionInput(body) {
  const errors = [];
  const action = typeof body?.action === "string" ? body.action.trim().toLowerCase() : "";
  const allowedActions = ["dismiss", "review", "deactivate"];

  if (!allowedActions.includes(action)) {
    errors.push(`Action must be one of: ${allowedActions.join(", ")}.`);
  }

  const adminNote = typeof body?.adminNote === "string" ? body.adminNote.trim().slice(0, ADMIN_CONFIG.limits.adminNoteMax) : "";

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    value: { action, adminNote },
    errors,
  };
}

export const validateReportUpdate = validateReportActionInput;

/**
 * Validates user action.
 */
export function validateUserActionInput(body) {
  const errors = [];
  const action = typeof body?.action === "string" ? body.action.trim().toLowerCase() : "";
  const allowedActions = ["set_senior", "unset_senior", "deactivate", "reactivate"];

  if (!allowedActions.includes(action)) {
    errors.push(`Action must be one of: ${allowedActions.join(", ")}.`);
  }

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    value: { action },
    errors,
  };
}

export const validateUserAction = validateUserActionInput;
