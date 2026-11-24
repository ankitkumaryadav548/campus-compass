// scripts/test-personalization.js
// ─────────────────────────────────────────────────────────────────────────
// Tests the personalization logic against the seeded MongoDB data.
// Run with: npm run test:personalization
//
// Command: node --env-file=.env.local scripts/test-personalization.js
// ─────────────────────────────────────────────────────────────────────────

"use strict";

const mongoose = require("mongoose");

// ── Inline personalization logic (mirrors lib/personalization.js) ──────────
// (Using inline because plain Node cannot import ES modules from lib/)

function buildRegionTags(user) {
  return [user?.country, user?.regionGroup, "ALL"].filter(
    (tag) => tag && tag.trim() !== ""
  );
}

function regionQuery(user) {
  return { region: { $in: buildRegionTags(user) } };
}

function getSpecificityLabel(item, user, field = "region") {
  const tags = item[field] || [];
  if (user?.country     && tags.includes(user.country))      return "country";
  if (user?.regionGroup && tags.includes(user.regionGroup))  return "region";
  return "all";
}

function sortBySpecificity(items, user, field = "region") {
  const score = (item) => {
    const tags = item[field] || [];
    if (user?.country     && tags.includes(user.country))      return 2;
    if (user?.regionGroup && tags.includes(user.regionGroup))  return 1;
    return 0;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}

function getBuddyScore(buddy, student) {
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

function sortBuddiesByMatch(buddies, student) {
  return [...buddies].sort((a, b) => getBuddyScore(b, student) - getBuddyScore(a, student));
}

function noContentNote(user) {
  const country = user?.country;
  if (!country || country.trim() === "") {
    return "Complete your profile to get country-specific content.";
  }
  return (
    `We don't have ${country}-specific guides yet. ` +
    `Showing general guides for now. ` +
    `Content improves as more students from ${country} join!`
  );
}

function isOnlyGenericContent(items, user, field = "region") {
  return items.length > 0 && items.every(
    (item) => getSpecificityLabel(item, user, field) === "all"
  );
}

// ── Minimal Mongoose schemas for the test ─────────────────────────────────
const GuideSchema = new mongoose.Schema({
  category: String, title: String, region: [String], isSample: Boolean, status: String,
});
const ChecklistItemSchema = new mongoose.Schema({
  title: String, region: [String], order: Number, isSample: Boolean,
});
const UserSchema = new mongoose.Schema({
  name: String, email: String, role: String, country: String,
  regionGroup: String, languages: [String], isSenior: Boolean, isSample: Boolean,
});

const Guide         = mongoose.models.Guide         || mongoose.model("Guide",         GuideSchema);
const ChecklistItem = mongoose.models.ChecklistItem || mongoose.model("ChecklistItem", ChecklistItemSchema);
const User          = mongoose.models.User          || mongoose.model("User",          UserSchema);

// ── Test users (synthetic – not in DB, just for the query) ────────────────
const TEST_USERS = [
  { label: "Uganda student",  country: "Uganda",  regionGroup: "East Africa",   languages: ["English", "Luganda"] },
  { label: "Vietnam student", country: "Vietnam", regionGroup: "Southeast Asia",languages: ["Vietnamese", "English"] },
  { label: "Nigeria student", country: "Nigeria", regionGroup: "West Africa",   languages: ["English", "Yoruba"] },
  // Ghana: no Ghana-specific data exists → should fall back to West Africa then ALL
  { label: "Ghana student",   country: "Ghana",   regionGroup: "West Africa",   languages: ["English", "Twi"] },
];

// ── Print helpers ──────────────────────────────────────────────────────────
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const CYAN   = "\x1b[36m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const GREY   = "\x1b[90m";
const RED    = "\x1b[31m";

function header(text) {
  console.log(`\n${BOLD}${CYAN}${"═".repeat(55)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${text}${RESET}`);
  console.log(`${BOLD}${CYAN}${"═".repeat(55)}${RESET}`);
}

function label(specificity) {
  if (specificity === "country") return `${GREEN}[country]${RESET}`;
  if (specificity === "region")  return `${YELLOW}[region] ${RESET}`;
  return `${GREY}[all]    ${RESET}`;
}

// ── Main test function ─────────────────────────────────────────────────────
async function runTests() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error(`${RED}❌  MONGODB_URI is not set.${RESET} Create .env.local from .env.example.`);
    process.exit(1);
  }

  console.log(`\n${BOLD}🧪  Campus Compass – Personalization Test${RESET}`);
  console.log("─".repeat(55));
  console.log("Connecting to MongoDB…");

  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✅  Connected\n");

  // Fetch ALL buddies (senior users) from the DB
  const allBuddies = await User.find({ isSenior: true, isSample: true }).lean();

  for (const testUser of TEST_USERS) {
    header(`Test: ${testUser.label}  (${testUser.country}, ${testUser.regionGroup})`);

    // ── SIM Guides ────────────────────────────────────────────────────
    const simGuides = await Guide.find({
      ...regionQuery(testUser),
      category: "sim",
      status: "published",
    }).lean();
    const sortedSim = sortBySpecificity(simGuides, testUser);

    console.log(`\n${BOLD}SIM Guides (${sortedSim.length} found):${RESET}`);
    if (sortedSim.length === 0) {
      console.log("  (none)");
    } else {
      sortedSim.forEach((g) => {
        const spec = getSpecificityLabel(g, testUser);
        console.log(`  ${label(spec)}  ${g.title}`);
      });
      if (isOnlyGenericContent(sortedSim, testUser)) {
        console.log(`  ${YELLOW}ℹ  ${noContentNote(testUser)}${RESET}`);
      }
    }

    // ── Checklist Items ───────────────────────────────────────────────
    const checklist = await ChecklistItem.find(regionQuery(testUser)).lean();
    const sortedCL  = sortBySpecificity(checklist, testUser);

    console.log(`\n${BOLD}Checklist Items (${sortedCL.length} found):${RESET}`);
    sortedCL.forEach((item) => {
      const spec = getSpecificityLabel(item, testUser);
      console.log(`  ${label(spec)}  ${item.title}`);
    });

    // ── Top 3 Buddy Suggestions ───────────────────────────────────────
    const sortedBuddies = sortBuddiesByMatch(allBuddies, testUser).slice(0, 3);

    console.log(`\n${BOLD}Top 3 Buddy Suggestions:${RESET}`);
    if (sortedBuddies.length === 0) {
      console.log("  (no buddies in DB – run npm run seed first)");
    } else {
      sortedBuddies.forEach((b) => {
        const score = getBuddyScore(b, testUser);
        const scoreStr = score >= 3 ? `${GREEN}score:${score}${RESET}` : score >= 1 ? `${YELLOW}score:${score}${RESET}` : `${GREY}score:${score}${RESET}`;
        console.log(`  ${scoreStr}  ${b.name}  (${b.country}, ${b.regionGroup})  langs:[${b.languages?.join(",")}]`);
      });
    }

    // ── noContentNote (only shown when no country-specific content) ───
    const hasCountryGuide = sortedSim.some(
      (g) => getSpecificityLabel(g, testUser) === "country"
    );
    if (!hasCountryGuide) {
      console.log(`\n${YELLOW}  Note: ${noContentNote(testUser)}${RESET}`);
    }
  }

  console.log(`\n${BOLD}${"─".repeat(55)}${RESET}`);
  console.log(`${GREEN}✅  All tests completed. Check results above.${RESET}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error(`\n${RED}❌  Test failed:${RESET}`, err.message);
  console.error(err);
  process.exit(1);
});

