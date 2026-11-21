// scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────
// SAMPLE DATA SEED SCRIPT – run with:  npm run seed
// All data inserted here is CLEARLY MARKED as sample data (isSample: true).
// Idempotent: deletes only isSample=true documents, then reinserts.
// Never deletes or modifies real (non-sample) documents.
//
// Command: node --env-file=.env.local scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────

"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ── Campus constants – single source of truth from lib/campus.js ───────────
const { CAMPUS_NAME, CAMPUS_LAT, CAMPUS_LNG } = require("../lib/campus");
const { SquareDashedKanban } = require("lucide-react");

// ── MongoDB connection ─────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Create .env.local from .env.example.");
  process.exit(1);
}

// ── Schema definitions (inline so plain Node can require this file) ────────

// ── User ──
const UserSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true, select: false },
    role:           { type: String, enum: ["student", "buddy", "admin"], default: "student" },
    country:        { type: String, default: "" },
    regionGroup:    { type: String, default: "" },
    languages:      [String],
    diet:           { type: String, default: "" },
    university:     { type: String, default: "" },
    visaType:       { type: String, default: "" },
    arrivalDate:    Date,
    isSenior:       { type: Boolean, default: false },
    openToConnect:  { type: Boolean, default: true },
    lastSeenAt:     { type: Date, default: null },
    bio:            { type: String, default: "" },
    onboardingDone: { type: Boolean, default: false },
    isSample:       { type: Boolean, default: false },
  },
  { timestamps: true }
);
UserSchema.index({ country: 1 });
UserSchema.index({ isSenior: 1 });

// ── Guide ──
const ProviderSchema = new mongoose.Schema({ name: String, notes: String }, { _id: false });
const StepSchema     = new mongoose.Schema({ order: Number, title: String, description: String }, { _id: false });

const GuideSchema = new mongoose.Schema(
  {
    category:     { type: String, enum: ["sim", "bank", "language"], required: true },
    title:        { type: String, required: true },
    region:       [String],
    visaTypes:    [String],
    requiredDocs: [String],
    providers:    [ProviderSchema],
    steps:        [StepSchema],
    tips:         [String],
    sourceUrl:    String,
    lastVerified: Date,
    isSample:     { type: Boolean, default: false },
  },
  { timestamps: true }
);
GuideSchema.index({ region: 1 });
GuideSchema.index({ category: 1 });

// ── ChecklistItem ──
const ChecklistItemSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true },
    description:        { type: String, default: "" },
    region:             [String],
    deadlineOffsetDays: { type: Number, default: 30 },
    order:              { type: Number, default: 0 },
    guideCategory:      { type: String, enum: ["sim", "bank", null], default: null },
    isSample:           { type: Boolean, default: false },
  },
  { timestamps: true }
);
ChecklistItemSchema.index({ region: 1 });

// ── Place ──
const ReviewSchema = new mongoose.Schema(
  { userName: String, rating: Number, comment: String, createdAt: { type: Date, default: Date.now } },
  { _id: false }
);
const PlaceSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    type:        { type: String, enum: ["grocery", "restaurant", "cafeteria"] },
    cuisine:     [String],
    dietTags:    [String],
    countryTags: [String],
    address:     { type: String, default: "" },
    location:    { lat: Number, lng: Number },
    rating:      { type: Number, default: 0 },
    reviews:     [ReviewSchema],
    isSample:    { type: Boolean, default: false },
  },
  { timestamps: true }
);
PlaceSchema.index({ countryTags: 1 });
PlaceSchema.index({ cuisine: 1 });

// ── Event ──
const EventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    date:        { type: Date, required: true },
    region:      [String],
    location:    { type: String, default: "" },
    attendees:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isSample:    { type: Boolean, default: false },
  },
  { timestamps: true }
);
EventSchema.index({ region: 1 });

// ── BuddyMatch ──
const BuddyMatchSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pairKey:     { type: String, required: true },
    status:      { type: String, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },
    message:     { type: String, default: "" },
    respondedAt: Date,
  },
  { timestamps: true }
);
BuddyMatchSchema.index({ pairKey: 1 }, { unique: true });

// ── Message ──
const MessageSchema = new mongoose.Schema(
  {
    matchId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuddyMatch", required: true },
    senderId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId:    { type: String, default: null },
    text:        { type: String, required: true, trim: true },
    readAt:      { type: Date, default: null },
  },
  { timestamps: true }
);
MessageSchema.index({ matchId: 1, createdAt: 1 });
MessageSchema.index({ matchId: 1, updatedAt: 1 });
MessageSchema.index({ recipientId: 1, readAt: 1 });
MessageSchema.index(
  { senderId: 1, clientId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientId: { $type: "string" } },
  }
);

// ── UserChecklist ──
const UserChecklistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ChecklistItem" },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
  },
  { timestamps: true }
);
UserChecklistSchema.index({ userId: 1, itemId: 1 }, { unique: true });

// ── GuideProgress ──
const GuideProgressSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guideId:        { type: mongoose.Schema.Types.ObjectId, ref: "Guide" },
    completedSteps: [Number],
  },
  { timestamps: true }
);
GuideProgressSchema.index({ userId: 1, guideId: 1 }, { unique: true });

// ── Notification ──
const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type:        { type: String, enum: ["buddy_request", "request_accepted", "request_declined", "new_message"], required: true },
    matchId:     { type: mongoose.Schema.Types.ObjectId, ref: "BuddyMatch", default: null },
    count:       { type: Number, default: 1 },
    readAt:      { type: Date, default: null },
    isSample:    { type: Boolean, default: false },
  },
  { timestamps: true }
);
NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

// ── Register models ────────────────────────────────────────────────────────
const User          = mongoose.models.User          || mongoose.model("User",          UserSchema);
const Guide         = mongoose.models.Guide         || mongoose.model("Guide",         GuideSchema);
const ChecklistItem = mongoose.models.ChecklistItem || mongoose.model("ChecklistItem", ChecklistItemSchema);
const Place         = mongoose.models.Place         || mongoose.model("Place",         PlaceSchema);
const Event         = mongoose.models.Event         || mongoose.model("Event",         EventSchema);
const BuddyMatch    = mongoose.models.BuddyMatch    || mongoose.model("BuddyMatch",    BuddyMatchSchema);
const Message       = mongoose.models.Message       || mongoose.model("Message",       MessageSchema);
const UserChecklist = mongoose.models.UserChecklist || mongoose.model("UserChecklist", UserChecklistSchema);
const GuideProgress = mongoose.models.GuideProgress || mongoose.model("GuideProgress", GuideProgressSchema);
const Notification  = mongoose.models.Notification  || mongoose.model("Notification",  NotificationSchema);

// ── Helper ─────────────────────────────────────────────────────────────────
/** Returns a date N days from now */
function daysFromNow(n) { return new Date(Date.now() + n * 86400000); }
/** Returns a date N days ago */
function daysAgo(n)     { return new Date(Date.now() - n * 86400000); }
/** Small lat/lng offset for realistic nearby places */
function nearCampus(dLat, dLng) {
  return { lat: CAMPUS_LAT + dLat, lng: CAMPUS_LNG + dLng };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log("\n🌱  Campus Compass – Seed Script");
  console.log(`    Campus: ${CAMPUS_NAME}  (${CAMPUS_LAT}, ${CAMPUS_LNG})`);
  console.log("─".repeat(55));

  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✅  Connected to MongoDB\n");

  // ── 1. WIPE ONLY SAMPLE DATA (idempotent) ─────────────────────────────
  console.log("🗑   Removing previous sample data…");
  const existingSampleUsers = await User.find({ isSample: true }).select("_id").lean();
  const sampleUserIds = existingSampleUsers.map((u) => u._id);

  const [dU, dG, dC, dP, dE, dBM, dM, dUC, dGP, dN] = await Promise.all([
    User.deleteMany({ isSample: true }),
    Guide.deleteMany({ isSample: true }),
    ChecklistItem.deleteMany({ isSample: true }),
    Place.deleteMany({ isSample: true }),
    Event.deleteMany({ isSample: true }),
    BuddyMatch.deleteMany({
      $or: [
        { requesterId: { $in: sampleUserIds } },
        { recipientId: { $in: sampleUserIds } },
        { studentId: { $in: sampleUserIds } },
        { buddyId: { $in: sampleUserIds } },
      ],
    }),
    Message.deleteMany({
      senderId: { $in: sampleUserIds },
    }),
    UserChecklist.deleteMany({
      userId: { $in: sampleUserIds },
    }),
    GuideProgress.deleteMany({
      userId: { $in: sampleUserIds },
    }),
    Notification.deleteMany({ isSample: true }),
  ]);
  console.log(`    Deleted: Users(${dU.deletedCount}) Guides(${dG.deletedCount}) ChecklistItems(${dC.deletedCount}) Places(${dP.deletedCount}) Events(${dE.deletedCount})\n`);

  // ── 2. HASH PASSWORD (all sample users share one password) ────────────
  const SAMPLE_PASSWORD = "Sample@123";
  const hashedPw = await bcrypt.hash(SAMPLE_PASSWORD, 12);

  // ── 3. USERS ──────────────────────────────────────────────────────────
  console.log("👤  Inserting Users…");
  const usersData = [
    // Admin
    {
      name: "Admin User (Sample)", email: "admin@sample.test", password: hashedPw,
      role: "admin", isSample: true, onboardingDone: true,
      university: CAMPUS_NAME, country: "", regionGroup: "",
    },

    // ── Ugandan buddies ──
    {
      name: "David Ssekandi (Sample)", email: "david.ssekandi@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Uganda", regionGroup: "East Africa",
      languages: ["English", "Luganda"],
      university: CAMPUS_NAME, diet: "halal",
      lastSeenAt: new Date(Date.now() - 22 * 3600000), // yesterday evening
      bio: "[SAMPLE] 3rd-year BTech student from Kampala. Happy to help newcomers from Uganda!",
    },
    {
      name: "Grace Namukasa (Sample)", email: "grace.namukasa@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Uganda", regionGroup: "East Africa",
      languages: ["English", "Luganda"],
      university: CAMPUS_NAME, diet: "vegetarian",
      lastSeenAt: daysAgo(3), // 3 days ago
      bio: "[SAMPLE] Final year MBA, originally from Entebbe. Can help with FRRO and banking.",
    },

    // ── Vietnamese buddies ──
    {
      name: "Nguyen Van Minh (Sample)", email: "minh.nguyen@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Vietnam", regionGroup: "Southeast Asia",
      languages: ["Vietnamese", "English"],
      university: CAMPUS_NAME, diet: "none",
      bio: "[SAMPLE] 2nd-year MCA from Ho Chi Minh City. Expert in SIM setup and local transport.",
    },
    {
      name: "Tran Thi Linh (Sample)", email: "linh.tran@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Vietnam", regionGroup: "Southeast Asia",
      languages: ["Vietnamese", "English"],
      university: CAMPUS_NAME, diet: "vegetarian",
      bio: "[SAMPLE] Final year Computer Science from Hanoi. Happy to chat in Vietnamese!",
    },

    // ── Nigerian buddies ──
    {
      name: "Chidi Okonkwo (Sample)", email: "chidi.okonkwo@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Nigeria", regionGroup: "West Africa",
      languages: ["English", "Igbo"],
      university: CAMPUS_NAME, diet: "halal",
      bio: "[SAMPLE] Final year MBA from Lagos. Can guide on bank account & FRRO.",
    },
    {
      name: "Fatima Bello (Sample)", email: "fatima.bello@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Nigeria", regionGroup: "West Africa",
      languages: ["English", "Yoruba"],
      university: CAMPUS_NAME, diet: "halal",
      bio: "[SAMPLE] 3rd-year from Abuja. Active in the international student community.",
    },

    // ── Kenyan buddy (same regionGroup as Uganda → tests fallback) ──
    {
      name: "Samuel Mwangi (Sample)", email: "samuel.mwangi@sample.test", password: hashedPw,
      role: "buddy", isSenior: true, isSample: true, onboardingDone: true,
      country: "Kenya", regionGroup: "East Africa",
      languages: ["English", "Swahili"],
      university: CAMPUS_NAME, diet: "none",
      bio: "[SAMPLE] 2nd-year from Nairobi. Shares East Africa regionGroup with Uganda.",
    },

    // ── Sample students ──
    {
      name: "Moses Kato (Sample)", email: "moses.kato@sample.test", password: hashedPw,
      role: "student", isSample: true, onboardingDone: true,
      country: "Uganda", regionGroup: "East Africa",
      languages: ["English", "Luganda"],
      diet: "halal", university: CAMPUS_NAME, visaType: "student",
      arrivalDate: daysAgo(3),
    },
    {
      name: "Linh Pham (Sample)", email: "linh.pham@sample.test", password: hashedPw,
      role: "student", isSample: true, onboardingDone: true,
      country: "Vietnam", regionGroup: "Southeast Asia",
      languages: ["Vietnamese", "English"],
      diet: "vegetarian", university: CAMPUS_NAME, visaType: "student",
      arrivalDate: daysAgo(7),
      lastSeenAt: new Date(Date.now() - 10000), // 10 seconds ago -> online
    },
    {
      name: "Amina Yusuf (Sample)", email: "amina.yusuf@sample.test", password: hashedPw,
      role: "student", isSample: true, onboardingDone: true,
      country: "Nigeria", regionGroup: "West Africa",
      languages: ["English", "Yoruba"],
      diet: "halal", university: CAMPUS_NAME, visaType: "student",
      arrivalDate: daysAgo(10),
    },
  ];

  const users = await User.insertMany(usersData);
  // Build lookup maps
  const findUser = (email) => users.find((u) => u.email === email);
  console.log(`    ✓  ${users.length} users inserted\n`);

  // ── 4. GUIDES ──────────────────────────────────────────────────────────
  console.log("📖  Inserting Guides…");

  const DISCLAIMER = "[SAMPLE DATA – Rules change. Confirm with your university's international office.]";

  const guidesData = [
    // ════ SIM – ALL ════
    {
      category: "sim", title: "[SAMPLE] Getting a SIM Card in India – General Guide",
      region: ["ALL"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-sim-guide", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Passport (original)", "Student ID or admission letter", "Passport-size photo (2 copies)", "Campus address proof"],
      providers: [
        { name: "Provider A (Sample)", notes: "Known for good data plans. Ask for a student plan." },
        { name: "Provider B (Sample)", notes: "Wide campus coverage. Customer service in English." },
        { name: "Provider C (Sample)", notes: "Budget option. Requires in-store activation." },
      ],
      steps: [
        { order: 1, title: "Gather your documents", description: `${DISCLAIMER} Collect passport, student ID, photo and address proof before visiting the store.` },
        { order: 2, title: "Visit a store near campus", description: "Look for authorised retailer stores. Avoid unofficial kiosks." },
        { order: 3, title: "Choose a prepaid plan", description: "Compare data and call rates. Ask specifically for the student plan." },
        { order: 4, title: "Complete KYC", description: "Hand over documents; the agent scans them on-site. Keep photocopies." },
        { order: 5, title: "Activate your SIM", description: "Activation typically takes 2–24 hours. You may receive an activation call or SMS." },
      ],
      tips: [
        "Bring photocopies of everything – most stores need them.",
        "Ask your senior buddy or university office which provider they recommend for your area.",
        DISCLAIMER,
      ],
    },

    // ════ SIM – Uganda ════
    {
      category: "sim", title: "[SAMPLE] Getting a SIM Card – Uganda Student Guide",
      region: ["Uganda"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-sim-uganda", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Passport with valid visa", "Admission letter from university", "Passport-size photos (2)", "Hostel or campus address proof"],
      providers: [
        { name: "Provider A (Sample)", notes: "Many Ugandan students found KYC straightforward here with a Ugandan passport." },
        { name: "Provider B (Sample)", notes: "Good for data-heavy plans. Ask for the 'campus data pack'." },
      ],
      steps: [
        { order: 1, title: "Get your admission letter ready", description: `${DISCLAIMER} Ugandan students have reported that the admission letter is very helpful for KYC.` },
        { order: 2, title: "Visit an authorised store (not a kiosk)", description: "Ask your buddy David or Grace for the nearest trusted store." },
        { order: 3, title: "Request a student plan", description: "Mention you are an international student from Uganda; some stores have specific help." },
        { order: 4, title: "Complete KYC & get SIM", description: "Expect 2–24 hours for activation. Keep the receipt." },
        { order: 5, title: "Test calls and data", description: "Call your emergency contact back home to confirm international calling works." },
      ],
      tips: [
        "Ugandan passport holders: some stores ask for an extra address-proof letter from the university warden. Get one in advance.",
        "Ask your buddy or international office for the most up-to-date provider recommendation.",
        DISCLAIMER,
      ],
    },

    // ════ SIM – Vietnam ════
    {
      category: "sim", title: "[SAMPLE] Getting a SIM Card – Vietnam Student Guide",
      region: ["Vietnam"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-sim-vietnam", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Vietnamese passport with valid student visa", "University admission letter", "1 passport-size photo"],
      providers: [
        { name: "Provider B (Sample)", notes: "Popular among Vietnamese students for affordable international calling." },
        { name: "Provider C (Sample)", notes: "Budget option. Vietnamese-language customer service available via app." },
      ],
      steps: [
        { order: 1, title: "Prepare your Vietnamese passport", description: `${DISCLAIMER} Vietnamese passport accepted at all major stores.` },
        { order: 2, title: "Bring your admission letter", description: "Have a physical or digital copy ready on your phone." },
        { order: 3, title: "Choose a plan with international SMS", description: "Useful for OTPs from Vietnamese banking apps." },
        { order: 4, title: "Complete KYC & activate", description: "Activation is usually 2–4 hours. Some stores have Vietnamese-speaking staff." },
      ],
      tips: [
        "If you need to contact family in Vietnam, check international calling bundles before choosing a plan.",
        "Vietnamese students found app-based customer support helpful for queries in Vietnamese.",
        DISCLAIMER,
      ],
    },

    // ════ SIM – Nigeria ════
    {
      category: "sim", title: "[SAMPLE] Getting a SIM Card – Nigeria Student Guide",
      region: ["Nigeria"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-sim-nigeria", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Nigerian passport with valid student visa", "University admission letter", "Hostel address proof", "2 passport photos"],
      providers: [
        { name: "Provider A (Sample)", notes: "Recommended by Nigerian students for quick KYC with Nigerian passport." },
        { name: "Provider B (Sample)", notes: "Best for data packs; large retail presence near campus." },
      ],
      steps: [
        { order: 1, title: "Get a warden letter", description: `${DISCLAIMER} Nigerian passport holders may need a letter from the hostel warden as address proof.` },
        { order: 2, title: "Visit an authorised store", description: "Avoid informal stalls. Ask Chidi or Fatima for the nearest recommended store." },
        { order: 3, title: "Complete KYC", description: "Staff will scan your passport. Keep at least 2 photocopies of every document." },
        { order: 4, title: "Activate and test", description: "Call your buddy or the university office to confirm the SIM is working." },
      ],
      tips: [
        "Some Nigerian students reported needing extra document copies. Bring at least 3 photocopies of your passport.",
        "If KYC is rejected, ask the store to contact their KYC helpline – don't leave without a resolution or a next step.",
        DISCLAIMER,
      ],
    },

    // ════ BANK – ALL ════
    {
      category: "bank", title: "[SAMPLE] Opening a Bank Account in India – General Guide",
      region: ["ALL"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-bank-guide", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Passport (original + photocopy)", "Valid student visa", "University admission letter", "Passport-size photos (3–4)", "Campus/hostel address proof"],
      providers: [
        { name: "Bank A (Sample)", notes: "On-campus branch. Accepts international student applications. Ask for the 'student savings' account." },
        { name: "Bank B (Sample)", notes: "Popular for zero-balance accounts. Requires FRRO receipt." },
        { name: "Bank C (Sample)", notes: "Useful if you need international transfers. Higher documentation threshold." },
      ],
      steps: [
        { order: 1, title: "Complete FRRO registration first", description: `${DISCLAIMER} Most banks require your FRRO receipt before opening an account.` },
        { order: 2, title: "Gather your documents", description: "Passport, visa, admission letter, photos, address proof. Ask your international office for a standard letter." },
        { order: 3, title: "Visit the bank branch", description: "On-campus bank branches are most familiar with international student requirements." },
        { order: 4, title: "Fill in the account opening form", description: "Ask for a zero-balance student account to avoid minimum balance penalties." },
        { order: 5, title: "Complete KYC & submit documents", description: "Documents are verified by the bank; this may take 1–3 working days." },
        { order: 6, title: "Receive your debit card & net-banking", description: "Card delivery takes 7–10 business days. Activate net-banking for fee payments." },
      ],
      tips: [
        "Complete your FRRO registration before visiting the bank – it is the most commonly missing document.",
        "On-campus branches are significantly more helpful for international students than off-campus ones.",
        DISCLAIMER,
      ],
    },

    // ════ BANK – Uganda ════
    {
      category: "bank", title: "[SAMPLE] Opening a Bank Account – Uganda Student Guide",
      region: ["Uganda"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-bank-uganda", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Ugandan passport + photocopy", "Student visa", "FRRO receipt", "Admission letter", "3 passport photos", "Warden letter for address proof"],
      providers: [
        { name: "Bank A (Sample)", notes: "On-campus branch familiar with Ugandan passports. Ask for the international student desk." },
        { name: "Bank B (Sample)", notes: "Requires FRRO before application. Faster processing for student accounts." },
      ],
      steps: [
        { order: 1, title: "Complete FRRO registration", description: `${DISCLAIMER} Do this within 14 days of arrival. Ugandan students need FRRO before most banks will accept them.` },
        { order: 2, title: "Get a warden or hostel letter", description: "Address proof from the hostel warden is typically required by banks for Ugandan passport holders." },
        { order: 3, title: "Visit the on-campus branch", description: "Ask David or Grace for the best branch to visit – they have been through this process." },
        { order: 4, title: "Open a zero-balance student account", description: "Specifically request a zero-balance account to avoid penalties while settling in." },
        { order: 5, title: "Activate net-banking", description: "Essential for paying university fees online. Enable it immediately upon account opening." },
      ],
      tips: [
        "Ugandan students: the FRRO receipt is non-negotiable for banks. Complete it first (within 14 days of arrival).",
        "Get 4–5 extra photocopies of your Ugandan passport – you will need them for FRRO, bank, SIM, and university ID.",
        DISCLAIMER,
      ],
    },

    // ════ BANK – Vietnam ════
    {
      category: "bank", title: "[SAMPLE] Opening a Bank Account – Vietnam Student Guide",
      region: ["Vietnam"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-bank-vietnam", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Vietnamese passport", "Student visa", "FRRO receipt", "Admission letter", "2 photos"],
      providers: [
        { name: "Bank A (Sample)", notes: "On-campus branch. Some staff speak basic English. Vietnamese students report smooth processing." },
        { name: "Bank C (Sample)", notes: "Good for receiving transfers from Vietnamese banks via SWIFT." },
      ],
      steps: [
        { order: 1, title: "Complete FRRO registration", description: `${DISCLAIMER} Required before the bank will process your application.` },
        { order: 2, title: "Prepare all documents", description: "Vietnamese passport, admission letter, FRRO, and photos. Have both originals and photocopies." },
        { order: 3, title: "Visit on-campus branch", description: "Go early in the week; bank queues for international students are shorter on Tuesday–Wednesday mornings." },
        { order: 4, title: "Open zero-balance account", description: "Ask specifically for 'SB student account'." },
        { order: 5, title: "Set up UPI and net-banking", description: "Useful for splitting rent, buying food, and paying fees." },
      ],
      tips: [
        "If you receive funds from Vietnam, ask about SWIFT/wire transfer details upfront.",
        "Vietnamese students found the university's international office letter very helpful when banks asked questions.",
        DISCLAIMER,
      ],
    },

    // ════ BANK – Nigeria ════
    {
      category: "bank", title: "[SAMPLE] Opening a Bank Account – Nigeria Student Guide",
      region: ["Nigeria"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-bank-nigeria", lastVerified: new Date("2024-11-01"),
      requiredDocs: ["Nigerian passport", "Student visa", "FRRO receipt", "Admission letter", "3 passport photos", "Warden or hostel letter"],
      providers: [
        { name: "Bank A (Sample)", notes: "Familiar with Nigerian passports. Some branches have dedicated international desks." },
        { name: "Bank B (Sample)", notes: "Zero-balance option available. Faster digital KYC." },
      ],
      steps: [
        { order: 1, title: "FRRO registration – mandatory first step", description: `${DISCLAIMER} Nigerian passport holders must register with FRRO within 14 days of arrival.` },
        { order: 2, title: "Get university support letter", description: "A letter from your international office confirming you are a bona-fide student helps significantly." },
        { order: 3, title: "Prepare 4+ passport copies", description: "Nigerian passport holders often find extra copies are requested at multiple stages." },
        { order: 4, title: "Visit on-campus branch", description: "Ask Chidi or Fatima for the specific branch officer who handles international students." },
        { order: 5, title: "Open account and get debit card", description: "Card arrives in 7–10 days. Use net-banking or UPI for immediate payments." },
      ],
      tips: [
        "Nigerian students: get a letter from the international office AND the hostel warden – some branches require both.",
        "If your application is delayed, escalate to the branch manager and mention your enrollment status.",
        DISCLAIMER,
      ],
    },

    // ════ LANGUAGE – ALL ════
    {
      category: "language", title: "[SAMPLE] Basic Hindi Phrases for Campus Life",
      region: ["ALL"], visaTypes: ["student"], isSample: true,
      sourceUrl: "https://example.com/sample-hindi-guide", lastVerified: new Date("2024-11-01"),
      requiredDocs: [],
      providers: [],
      steps: [
        { order: 1, title: "Greetings", description: "Namaste (Hello/Goodbye) · Shukriya / Dhanyavaad (Thank you) · Kripaya (Please)" },
        { order: 2, title: "Getting around", description: "Yahan kahan hai ___ ? (Where is ___?) · Kitna duur hai? (How far is it?) · Seedha jaayein (Go straight)" },
        { order: 3, title: "Food & shopping", description: "Yeh kitne ka hai? (How much does this cost?) · Mujhe ___ chahiye (I need ___) · Halal / Shakahari (Vegetarian)" },
        { order: 4, title: "Emergency phrases", description: "Mujhe madad chahiye (I need help) · Doctor ko bulao (Call a doctor) · Police station kahan hai? (Where is the police station?)" },
        { order: 5, title: "Campus phrases", description: "Library kahan hai? (Where is the library?) · Canteen kahan hai? (Where is the canteen?) · Hostel warden se milna hai (I need to meet the hostel warden)" },
      ],
      tips: [
        "[SAMPLE] Install a Hindi translation app on your phone for instant help.",
        "Most campus staff understand basic English; don't hesitate to ask slowly and clearly.",
        DISCLAIMER,
      ],
    },
  ];

  const guides = await Guide.insertMany(guidesData);
  console.log(`    ✓  ${guides.length} guides inserted\n`);

  // ── 5. CHECKLIST ITEMS ────────────────────────────────────────────────
  console.log("✅  Inserting ChecklistItems…");
  const checklistData = [
    // ALL
    { title: "[SAMPLE] University Enrollment & Registration",    description: "Complete your enrollment in the university system and collect your student ID.", region: ["ALL"], deadlineOffsetDays: 1,  order: 1,  isSample: true },
    { title: "[SAMPLE] FRRO / FRO Registration",                 description: "Foreign Regional Registration Office (FRRO) registration is mandatory for most student visa holders. Do this within 14 days of arrival.", region: ["ALL"], deadlineOffsetDays: 14, order: 2,  isSample: true },
    { title: "[SAMPLE] Get a SIM Card",                          description: "A local SIM card is essential for banking, campus apps, and staying connected.", region: ["ALL"], deadlineOffsetDays: 3,  order: 3,  isSample: true, guideCategory: "sim" },
    { title: "[SAMPLE] Open a Bank Account",                     description: "Required for receiving stipends, paying fees, and day-to-day expenses.", region: ["ALL"], deadlineOffsetDays: 21, order: 4,  isSample: true, guideCategory: "bank" },
    { title: "[SAMPLE] Obtain Student ID Card",                  description: "Collect your student ID from the registrar's office. Needed for library, lab, and discounts.", region: ["ALL"], deadlineOffsetDays: 5,  order: 5,  isSample: true },
    { title: "[SAMPLE] Submit Hostel / Address Proof",           description: "Submit your accommodation details to the university's international office.", region: ["ALL"], deadlineOffsetDays: 7,  order: 6,  isSample: true },
    { title: "[SAMPLE] Health Insurance or Medical Check",        description: "Confirm you have adequate health insurance and complete any mandatory medical screening.", region: ["ALL"], deadlineOffsetDays: 14, order: 7,  isSample: true },
    { title: "[SAMPLE] Attend Orientation Programme",             description: "Attend the international student orientation to meet peers and learn campus resources.", region: ["ALL"], deadlineOffsetDays: 2,  order: 8,  isSample: true },

    // Uganda-specific – proves region filtering
    { title: "[SAMPLE] Submit Ugandan Passport Copy to Warden",  description: "Uganda-specific: hostel wardens at Sample City University typically require a copy of your Ugandan passport for their records.", region: ["Uganda"], deadlineOffsetDays: 2,  order: 9,  isSample: true },
    { title: "[SAMPLE] Collect Uganda Students Association Card", description: "Uganda-specific: register with the Uganda Students Association on campus for peer support events and community meet-ups.", region: ["Uganda"], deadlineOffsetDays: 10, order: 10, isSample: true },
  ];

  const checklistItems = await ChecklistItem.insertMany(checklistData);
  console.log(`    ✓  ${checklistItems.length} checklist items inserted\n`);

  // ── 6. PLACES ─────────────────────────────────────────────────────────
  console.log("🍽   Inserting Places…");
  const placesData = [
    // ── Restaurants – African / Uganda / Nigeria ──
    {
      name: "[SAMPLE] African Spices Kitchen", type: "restaurant",
      cuisine: ["African", "East African"], dietTags: ["halal"],
      countryTags: ["Uganda", "Kenya", "Tanzania"],
      address: "12 Sample Market Road, Sample City",
      location: nearCampus(-0.005, 0.008), rating: 4.5, isSample: true,
      reviews: [
        { userName: "Moses K. (Sample)", rating: 5, comment: "[SAMPLE] Best matooke outside Kampala! Feels like home." },
        { userName: "David S. (Sample)", rating: 4, comment: "[SAMPLE] Good for halal meals. Try the groundnut soup." },
      ],
    },
    {
      name: "[SAMPLE] West African Kitchen", type: "restaurant",
      cuisine: ["African", "West African"], dietTags: ["halal"],
      countryTags: ["Nigeria", "Ghana"],
      address: "7 College Lane, Sample City",
      location: nearCampus(0.003, -0.012), rating: 4.3, isSample: true,
      reviews: [
        { userName: "Amina Y. (Sample)", rating: 5, comment: "[SAMPLE] The jollof rice is authentic! Egusi soup available on weekends." },
      ],
    },

    // ── Restaurants – Vietnamese / Southeast Asian ──
    {
      name: "[SAMPLE] Pho Garden", type: "restaurant",
      cuisine: ["Vietnamese", "Asian"], dietTags: ["none", "halal-on-request"],
      countryTags: ["Vietnam", "Southeast Asia"],
      address: "23 International Student Mall, Sample City",
      location: nearCampus(0.007, 0.005), rating: 4.6, isSample: true,
      reviews: [
        { userName: "Linh P. (Sample)", rating: 5, comment: "[SAMPLE] The pho is very close to Vietnamese style. Owners are from Vietnam!" },
      ],
    },
    {
      name: "[SAMPLE] Asian Bites", type: "restaurant",
      cuisine: ["Asian", "Pan-Asian"], dietTags: ["vegetarian"],
      countryTags: ["Vietnam", "China", "Thailand", "Southeast Asia"],
      address: "5 Campus Gate Road, Sample City",
      location: nearCampus(-0.002, 0.015), rating: 4.1, isSample: true,
      reviews: [],
    },

    // ── Restaurants – Indian / General ──
    {
      name: "[SAMPLE] Campus Canteen", type: "cafeteria",
      cuisine: ["Indian"], dietTags: ["vegetarian", "vegan"],
      countryTags: ["ALL"],
      address: `${CAMPUS_NAME}, Block A`,
      location: nearCampus(0.001, 0.001), rating: 3.8, isSample: true,
      reviews: [
        { userName: "Moses K. (Sample)", rating: 4, comment: "[SAMPLE] Good South Indian breakfast. Dal chawal is affordable." },
      ],
    },
    {
      name: "[SAMPLE] Halal Corner Café", type: "restaurant",
      cuisine: ["Indian", "Middle Eastern"], dietTags: ["halal"],
      countryTags: ["ALL"],
      address: "2 Hostel Road, Sample City",
      location: nearCampus(-0.004, -0.003), rating: 4.0, isSample: true,
      reviews: [],
    },
    {
      name: "[SAMPLE] South Indian Delight", type: "restaurant",
      cuisine: ["Indian", "South Indian"], dietTags: ["vegetarian", "vegan"],
      countryTags: ["ALL"],
      address: "15 University Avenue, Sample City",
      location: nearCampus(0.009, -0.006), rating: 4.4, isSample: true,
      reviews: [],
    },

    // ── Grocery stores ──
    {
      name: "[SAMPLE] African Grocery & Spices", type: "grocery",
      cuisine: [], dietTags: ["halal"],
      countryTags: ["Uganda", "Nigeria", "Kenya", "Ghana"],
      address: "88 Student Bazaar, Sample City",
      location: nearCampus(-0.010, 0.006), rating: 4.2, isSample: true,
      reviews: [
        { userName: "Grace N. (Sample)", rating: 4, comment: "[SAMPLE] Stocks cassava flour, plantains, and groundnut paste. Worth the walk!" },
      ],
    },
    {
      name: "[SAMPLE] Asian Food Mart", type: "grocery",
      cuisine: [], dietTags: ["none"],
      countryTags: ["Vietnam", "China", "Southeast Asia"],
      address: "3 New Market Street, Sample City",
      location: nearCampus(0.012, 0.009), rating: 4.3, isSample: true,
      reviews: [
        { userName: "Linh P. (Sample)", rating: 5, comment: "[SAMPLE] Has Vietnamese rice paper, fish sauce, and pho noodles!" },
      ],
    },
    {
      name: "[SAMPLE] International Supermart", type: "grocery",
      cuisine: [], dietTags: ["none"],
      countryTags: ["ALL"],
      address: "Campus Commercial Complex, Sample City",
      location: nearCampus(0.000, 0.012), rating: 3.9, isSample: true,
      reviews: [],
    },
    {
      name: "[SAMPLE] Halal Meat & Grocery", type: "grocery",
      cuisine: [], dietTags: ["halal"],
      countryTags: ["ALL"],
      address: "11 Mosque Road, Sample City",
      location: nearCampus(-0.008, -0.010), rating: 4.1, isSample: true,
      reviews: [],
    },
    {
      name: "[SAMPLE] Veggie World", type: "grocery",
      cuisine: [], dietTags: ["vegetarian", "vegan"],
      countryTags: ["ALL"],
      address: "7 Green Lane, Sample City",
      location: nearCampus(0.006, -0.008), rating: 4.0, isSample: true,
      reviews: [],
    },
  ];

  const places = await Place.insertMany(placesData);
  console.log(`    ✓  ${places.length} places inserted\n`);

  // ── 7. EVENTS ─────────────────────────────────────────────────────────
  console.log("📅  Inserting Events…");
  const eventsData = [
    {
      title: "[SAMPLE] International Student Welcome Meetup",
      description: "An informal welcome session for all new international students. Meet the student union, senior buddies, and the university's international office team.",
      date: daysFromNow(5), region: ["ALL"], isSample: true,
      location: `International Students Lounge, ${CAMPUS_NAME}`,
    },
    {
      title: "[SAMPLE] Uganda Students Community Meet",
      description: "An informal gathering for students from Uganda to share experiences, tips, and home-country food. All East African students welcome!",
      date: daysFromNow(10), region: ["Uganda"], isSample: true,
      location: `Room 204, Student Activity Centre, ${CAMPUS_NAME}`,
    },
    {
      title: "[SAMPLE] Vietnamese Food Night",
      description: "Celebrate Vietnamese culture with home-cooked food, music, and community. Open to all Southeast Asian students and food lovers.",
      date: daysFromNow(14), region: ["Vietnam"], isSample: true,
      location: `Community Hall, ${CAMPUS_NAME}`,
    },
    {
      title: "[SAMPLE] Nigerian Cultural Evening",
      description: "An evening of Nigerian music, food (jollof!), and culture. All West African students are especially welcome.",
      date: daysFromNow(18), region: ["Nigeria"], isSample: true,
      location: `Open Air Theatre, ${CAMPUS_NAME}`,
    },
    {
      title: "[SAMPLE] SIM & Bank Help Desk",
      description: "Senior buddies and university staff will assist new students with SIM card registration and bank account opening paperwork. Bring all your documents!",
      date: daysFromNow(3), region: ["ALL"], isSample: true,
      location: `International Office, ${CAMPUS_NAME}`,
    },
  ];

  const events = await Event.insertMany(eventsData);
  console.log(`    ✓  ${events.length} events inserted\n`);

  // ── 8. BUDDY MATCHES ──────────────────────────────────────────────────
  console.log("🤝  Inserting BuddyMatches…");
  const moses  = findUser("moses.kato@sample.test");
  const linh   = findUser("linh.pham@sample.test");
  const amina  = findUser("amina.yusuf@sample.test");
  const david  = findUser("david.ssekandi@sample.test");
  const grace  = findUser("grace.namukasa@sample.test");
  const samuel = findUser("samuel.mwangi@sample.test");
  const minhB  = findUser("minh.nguyen@sample.test");
  const chidi  = findUser("chidi.okonkwo@sample.test");

  function generatePairKey(idA, idB) {
    return [idA.toString(), idB.toString()].sort().join(":");
  }

  const buddyMatchesData = [
    {
      requesterId: moses._id,
      recipientId: david._id,
      pairKey: generatePairKey(moses._id, david._id),
      status: "accepted",
      message: "[SAMPLE] Hi David, I just arrived from Uganda!",
    },
    {
      requesterId: moses._id,
      recipientId: findUser("samuel.mwangi@sample.test")._id,
      pairKey: generatePairKey(moses._id, findUser("samuel.mwangi@sample.test")._id),
      status: "pending",
      message: "[SAMPLE] Hi Samuel, I heard you're from East Africa – looking forward to connecting.",
    },
    {
      requesterId: linh._id,
      recipientId: minhB._id,
      pairKey: generatePairKey(linh._id, minhB._id),
      status: "accepted",
      message: "[SAMPLE] Xin chào! Tôi mới đến.",
    },
    {
      requesterId: amina._id,
      recipientId: chidi._id,
      pairKey: generatePairKey(amina._id, chidi._id),
      status: "accepted",
      message: "[SAMPLE] Hi Chidi, fellow Nigerian here!",
    },
    {
      requesterId: linh._id,
      recipientId: moses._id,
      pairKey: generatePairKey(linh._id, moses._id),
      status: "pending",
      message: "[SAMPLE] Hi Moses! I saw we are both new students here, would love to connect!",
    },
  ];

  const buddyMatches = await BuddyMatch.insertMany(buddyMatchesData);
  console.log(`    ✓  ${buddyMatches.length} buddy matches inserted\n`);

  // ── 9. SAMPLE MESSAGES ────────────────────────────────────────────────
  console.log("💬  Inserting sample messages…");
  const mosesDavidMatch = buddyMatches.find(
    (bm) => bm.requesterId.toString() === moses._id.toString() && bm.recipientId.toString() === david._id.toString()
  );
  const linhMosesMatch = buddyMatches.find(
    (bm) => bm.requesterId.toString() === linh._id.toString() && bm.recipientId.toString() === moses._id.toString()
  );

  const sampleMessagesData = [
    // 1. Full date separator (> 6 days ago)
    {
      matchId:     mosesDavidMatch._id,
      senderId:    moses._id,
      recipientId: david._id,
      text:        "Hi David, thanks for accepting my request! I will be flying to campus next week.",
      createdAt:   daysAgo(10),
      readAt:      daysAgo(10),
    },
    // 2. Weekday separator (2 to 6 days ago)
    {
      matchId:     mosesDavidMatch._id,
      senderId:    david._id,
      recipientId: moses._id,
      text:        "Safe travels Moses! Pack warm clothes for the evenings.",
      createdAt:   daysAgo(4),
      readAt:      daysAgo(4),
    },
    // 3. Yesterday separator
    {
      matchId:     mosesDavidMatch._id,
      senderId:    moses._id,
      recipientId: david._id,
      text:        "I arrived yesterday and checked into my hostel room.",
      createdAt:   daysAgo(1),
      readAt:      daysAgo(1),
    },
    // 4. Today (read message from partner)
    {
      matchId:     mosesDavidMatch._id,
      senderId:    david._id,
      recipientId: moses._id,
      text:        "Welcome to campus Moses! Let me know if you need help with SIM or banking.",
      createdAt:   new Date(Date.now() - 3 * 3600000),
      readAt:      new Date(Date.now() - 2 * 3600000),
    },
    // 5. Today (sent message from Moses, unread by David -> two grey ticks)
    {
      matchId:     mosesDavidMatch._id,
      senderId:    moses._id,
      recipientId: david._id,
      text:        "Thank you! Which bank branch near Block A is best for international students?",
      createdAt:   new Date(Date.now() - 1800000), // 30 mins ago
      readAt:      null,
    },
  ];

  const messages = await Message.insertMany(sampleMessagesData);
  console.log(`    ✓  ${messages.length} messages inserted\n`);

  // ── 10. SAMPLE NOTIFICATIONS ──────────────────────────────────────────
  console.log("🔔  Inserting sample notifications…");
  const sampleNotificationsData = [
    // 3 notifications for Moses
    {
      recipientId: moses._id,
      actorId:     linh._id,
      type:        "buddy_request",
      matchId:     null,
      count:       1,
      readAt:      null,
      isSample:    true,
    },
    {
      recipientId: moses._id,
      actorId:     david._id,
      type:        "request_accepted",
      matchId:     mosesDavidMatch._id,
      count:       1,
      readAt:      daysAgo(2),
      isSample:    true,
    },
    {
      recipientId: moses._id,
      actorId:     david._id,
      type:        "new_message",
      matchId:     mosesDavidMatch._id,
      count:       2,
      readAt:      null,
      isSample:    true,
    },

    // 2 notifications for David
    {
      recipientId: david._id,
      actorId:     samuel._id,
      type:        "buddy_request",
      matchId:     null,
      count:       1,
      readAt:      null,
      isSample:    true,
    },
    {
      recipientId: david._id,
      actorId:     moses._id,
      type:        "request_accepted",
      matchId:     mosesDavidMatch._id,
      count:       1,
      readAt:      daysAgo(1),
      isSample:    true,
    },
  ];

  const notifications = await Notification.insertMany(sampleNotificationsData);
  console.log(`    ✓  ${notifications.length} notifications inserted\n`);

  // ── SUMMARY ───────────────────────────────────────────────────────────
  console.log("─".repeat(55));
  console.log("🎉  Seed complete!\n");
  console.log("   Document counts:");
  console.log(`     Users         : ${users.length}`);
  console.log(`     Guides        : ${guides.length}`);
  console.log(`     ChecklistItems: ${checklistItems.length}`);
  console.log(`     Places        : ${places.length}`);
  console.log(`     Events        : ${events.length}`);
  console.log(`     BuddyMatches  : ${buddyMatches.length}`);
  console.log(`     Messages      : ${messages.length}`);
  console.log(`     Notifications : ${notifications.length}`);
  console.log("\n   Sample user login (all):");
  console.log("     Email   : moses.kato@sample.test  (or any @sample.test address)");
  console.log(`     Password: ${SAMPLE_PASSWORD}`);
  console.log("─".repeat(55));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  console.error(err);
  process.exit(1);
});



