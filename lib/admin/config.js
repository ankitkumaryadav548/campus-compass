// lib/admin/config.js
// Central configuration for the Admin module.

const GUIDE_CATEGORIES = [
  "bank",
  "sim",
  "frro",
  "medical",
  "academics",
  "campus",
  "essentials",
  "language",
];

const CHECKLIST_CATEGORIES = [
  "before_arrival",
  "first_week",
  "first_month",
  "academics",
];

const EVENT_CATEGORIES = [
  "social",
  "academic",
  "cultural",
  "orientation",
  "wellness",
];

const FOOD_LABELS = [
  "pure_veg",
  "veg_and_nonveg",
  "nonveg_only",
];

export const ADMIN_CONFIG = {
  PAGE_SIZE: 20,
  pageSize: 20,
  STALE_GUIDE_DAYS: 90,
  staleGuideDays: 90,
  sessionRefreshSeconds: 300,

  // Rate limiting for administrative mutation operations (POST, PATCH, PUT, DELETE)
  mutationRateLimit: {
    maxPerMinute: 60,
    windowMs: 60 * 1000,
  },

  // Field length restrictions
  limits: {
    titleMin: 3,
    titleMax: 120,
    descriptionMax: 500,
    locationMax: 120,
    adminNoteMax: 500,
    providerNameMax: 80,
    providerNotesMax: 300,
    stepTitleMax: 120,
    stepDescriptionMax: 600,
    tipMax: 300,
    sourceUrlMax: 300,
    maxSteps: 20,
    maxProviders: 10,
    maxTips: 10,
    maxDocs: 15,
    maxRegions: 10,
  },

  // Allowed enumerations
  GUIDE_CATEGORIES,
  categories: GUIDE_CATEGORIES,
  CHECKLIST_CATEGORIES,
  EVENT_CATEGORIES,
  FOOD_LABELS,
  foodLabels: FOOD_LABELS,
  guideStatuses: ["draft", "published", "archived"],
  reportResolutions: ["dismissed", "reviewed", "account_deactivated"],
  reportStatuses: ["open", "reviewed"],

  auditActions: [
    "guide_created",
    "guide_updated",
    "guide_published",
    "guide_unpublished",
    "guide_archived",
    "guide_restored",
    "guide_status_changed",
    "checklist_created",
    "checklist_updated",
    "checklist_deleted",
    "checklist_reordered",
    "event_created",
    "event_updated",
    "event_deleted",
    "food_diet_labelled",
    "report_dismissed",
    "report_reviewed",
    "user_deactivated",
    "user_reactivated",
    "senior_granted",
    "senior_revoked",
  ],
};
