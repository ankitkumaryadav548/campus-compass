// scripts/test-admin-logic.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure Unit Tests for Admin Logic & Invariants:
// - lib/admin/validators.js
// - lib/admin/rules.js
// - lib/osm/dietClassifier.js (applyVerifiedDiet)
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";
import {
  validateGuideInput,
  validateChecklistInput,
  validateEventInput,
  validateFoodLabelInput,
  validateReportActionInput,
  validateUserActionInput,
  validateRegionTag,
} from "../lib/admin/validators.js";
import {
  canDeactivateUser,
  canChangeSeniorStatus,
  isGuideStale,
  canPublishGuide,
} from "../lib/admin/rules.js";
import { applyVerifiedDiet } from "../lib/osm/dietClassifier.js";

let testsRun = 0;
let testsPassed = 0;

function runTest(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("\n=== Testing Admin Pure Logic & Invariants ===");

// ==========================================
// 1. Guide Validation & Publication Rules
// ==========================================
console.log("\n[1. Guide Validation & Publication Rules]");

runTest("validates clean guide input successfully", () => {
  const result = validateGuideInput({
    title: "Opening a Bank Account in India",
    category: "bank",
    summary: "Complete guide for student bank accounts",
    steps: [{ title: "Visit Branch", detail: "Take passport and visa" }],
    applicableRegions: ["ALL", "NP"],
  });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

runTest("rejects guide missing title", () => {
  const result = validateGuideInput({
    title: "",
    category: "bank",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Title is required")));
});

runTest("rejects invalid guide category", () => {
  const result = validateGuideInput({
    title: "Valid Title",
    category: "invalid_category",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Invalid category")));
});

runTest("rejects steps missing step title", () => {
  const result = validateGuideInput({
    title: "Valid Title",
    category: "bank",
    steps: [{ detail: "Details without title" }],
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("title is required")));
});

runTest("canPublishGuide: enforces summary and steps for published status", () => {
  const noSummary = {
    title: "Bank Account",
    category: "bank",
    summary: "",
    steps: [{ title: "Step 1" }],
    status: "published",
  };
  const res1 = canPublishGuide(noSummary);
  assert.equal(res1.canPublish, false);
  assert.ok(res1.reason.includes("Summary is required"));

  const noSteps = {
    title: "Bank Account",
    category: "bank",
    summary: "Has summary",
    steps: [],
    status: "published",
  };
  const res2 = canPublishGuide(noSteps);
  assert.equal(res2.canPublish, false);
  assert.ok(res2.reason.includes("at least one step"));

  const validPublished = {
    title: "Bank Account",
    category: "bank",
    summary: "Has summary",
    steps: [{ title: "Step 1" }],
    status: "published",
  };
  const res3 = canPublishGuide(validPublished);
  assert.equal(res3.canPublish, true);
});

runTest("canPublishGuide: allows draft status with minimal fields", () => {
  const draft = {
    title: "Draft Guide",
    category: "bank",
    summary: "",
    steps: [],
    status: "draft",
  };
  const res = canPublishGuide(draft);
  assert.equal(res.canPublish, true);
});

// ==========================================
// 2. Guide Staleness Rules (>90 days)
// ==========================================
console.log("\n[2. Guide Staleness Rules]");

runTest("isGuideStale: true when lastVerified is null, undefined, or empty", () => {
  assert.equal(isGuideStale(null), true);
  assert.equal(isGuideStale(undefined), true);
});

runTest("isGuideStale: true when lastVerified is > 90 days ago", () => {
  const staleDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
  assert.equal(isGuideStale(staleDate), true);
});

runTest("isGuideStale: false when lastVerified is recent (< 90 days ago)", () => {
  const freshDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  assert.equal(isGuideStale(freshDate), false);
});

// ==========================================
// 3. Checklist & Event Validation
// ==========================================
console.log("\n[3. Checklist & Event Validation]");

runTest("validateChecklistInput: accepts valid item and rejects invalid category", () => {
  const valid = validateChecklistInput({
    title: "Get SIM card",
    category: "first_week",
  });
  assert.equal(valid.valid, true);

  const invalid = validateChecklistInput({
    title: "Get SIM card",
    category: "not_a_category",
  });
  assert.equal(invalid.valid, false);
});

runTest("validateEventInput: requires title, date, location, and valid category", () => {
  const valid = validateEventInput({
    title: "Campus Mixer",
    date: new Date().toISOString(),
    location: "Auditorium",
    category: "social",
  });
  assert.equal(valid.valid, true);

  const invalid = validateEventInput({
    title: "",
    date: "invalid-date-string",
    location: "",
    category: "unknown",
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length >= 3, true);
});

// ==========================================
// 4. Food Label & Moderation Actions Validation
// ==========================================
console.log("\n[4. Food Label & Moderation Actions Validation]");

runTest("validateFoodLabelInput: accepts pure_veg, veg_and_nonveg, nonveg_only, and null", () => {
  assert.equal(validateFoodLabelInput({ label: "pure_veg" }).valid, true);
  assert.equal(validateFoodLabelInput({ label: "veg_and_nonveg" }).valid, true);
  assert.equal(validateFoodLabelInput({ label: "nonveg_only" }).valid, true);
  assert.equal(validateFoodLabelInput({ label: null }).valid, true);
  assert.equal(validateFoodLabelInput({ label: "invalid_label" }).valid, false);
});

runTest("validateReportActionInput: accepts dismiss, review, deactivate", () => {
  assert.equal(validateReportActionInput({ action: "dismiss" }).valid, true);
  assert.equal(validateReportActionInput({ action: "review" }).valid, true);
  assert.equal(validateReportActionInput({ action: "deactivate" }).valid, true);
  assert.equal(validateReportActionInput({ action: "delete_everything" }).valid, false);
});

runTest("validateUserActionInput: accepts valid actions only", () => {
  assert.equal(validateUserActionInput({ action: "set_senior" }).valid, true);
  assert.equal(validateUserActionInput({ action: "unset_senior" }).valid, true);
  assert.equal(validateUserActionInput({ action: "deactivate" }).valid, true);
  assert.equal(validateUserActionInput({ action: "reactivate" }).valid, true);
  assert.equal(validateUserActionInput({ action: "make_admin" }).valid, false);
});

// ==========================================
// 5. Safety Invariants & Guard Rules
// ==========================================
console.log("\n[5. Safety Invariants & Guard Rules]");

runTest("canDeactivateUser: admin cannot deactivate themselves", () => {
  const selfDeactivation = canDeactivateUser({
    targetUser: { _id: "admin1", role: "admin" },
    adminUser: { _id: "admin1", role: "admin" },
    activeAdminCount: 3,
  });
  assert.equal(selfDeactivation.allowed, false);
  assert.ok(selfDeactivation.reason.includes("cannot deactivate your own account"));
});

runTest("canDeactivateUser: cannot deactivate the last active administrator", () => {
  const lastAdminDeactivation = canDeactivateUser({
    targetUser: { _id: "admin2", role: "admin" },
    adminUser: { _id: "admin1", role: "admin" },
    activeAdminCount: 1,
  });
  assert.equal(lastAdminDeactivation.allowed, false);
  assert.ok(lastAdminDeactivation.reason.includes("last active administrator"));
});

runTest("canDeactivateUser: permits deactivation of non-admin student or peer buddy", () => {
  const studentDeactivation = canDeactivateUser({
    targetUser: { _id: "student1", role: "student" },
    adminUser: { _id: "admin1", role: "admin" },
    activeAdminCount: 1,
  });
  assert.equal(studentDeactivation.allowed, true);
});

runTest("canChangeSeniorStatus: denies senior toggle on admin accounts", () => {
  const adminSenior = canChangeSeniorStatus({ role: "admin" });
  assert.equal(adminSenior.allowed, false);

  const studentSenior = canChangeSeniorStatus({ role: "student" });
  assert.equal(studentSenior.allowed, true);

  const buddySenior = canChangeSeniorStatus({ role: "buddy" });
  assert.equal(buddySenior.allowed, true);
});

// ==========================================
// 6. Region Tag Validator
// ==========================================
console.log("\n[6. Region Tag Validator]");

runTest("validateRegionTag: accepts ALL, valid country codes, and region groups", () => {
  assert.equal(validateRegionTag("ALL").valid, true);
  assert.equal(validateRegionTag("NP").valid, true);
  assert.equal(validateRegionTag("US").valid, true);
  assert.equal(validateRegionTag("SOUTH_ASIA").valid, true);
  assert.equal(validateRegionTag("AFRICA").valid, true);
  assert.equal(validateRegionTag("FAKE_COUNTRY_CODE").valid, false);
});

// ==========================================
// 7. Diet Classifier with Verified Admin Label
// ==========================================
console.log("\n[7. Diet Classifier with Verified Admin Label]");

runTest("applyVerifiedDiet: overrides OSM tags with pure_veg", () => {
  const initialDiet = { vegLevel: "unknown", nonVegLikely: false };
  const verified = applyVerifiedDiet(initialDiet, "pure_veg");

  assert.equal(verified.vegLevel, "only");
  assert.equal(verified.dietVerified, true);
  assert.equal(verified.dietLabel, "pure_veg");
});

runTest("applyVerifiedDiet: overrides OSM tags with veg_and_nonveg", () => {
  const initialDiet = { vegLevel: "unknown", nonVegLikely: false };
  const verified = applyVerifiedDiet(initialDiet, "veg_and_nonveg");

  assert.equal(verified.vegLevel, "options");
  assert.equal(verified.nonVegLikely, true);
  assert.equal(verified.dietVerified, true);
  assert.equal(verified.dietLabel, "veg_and_nonveg");
});

runTest("applyVerifiedDiet: unlabelled preserves original OSM classification", () => {
  const initialDiet = { vegLevel: "veg_friendly", nonVegLikely: true };
  const verified = applyVerifiedDiet(initialDiet, null);

  assert.equal(verified.vegLevel, "veg_friendly");
  assert.equal(verified.nonVegLikely, true);
  assert.equal(verified.dietVerified, false);
  assert.equal(verified.dietLabel, null);
});

console.log(`\nAll tests completed: ${testsPassed}/${testsRun} passed.`);
