// scripts/migrate-admin.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin Migration Script
// 1. Backfills `status: "published"` on guides that lack a status field.
// 2. Backfills `isActive: true` on users that lack an isActive field.
// 3. Builds and syncs required indexes for Admin, AuditLog, and Place models.
// Idempotent: safe to run multiple times.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Run with --env-file=.env.local");
  process.exit(1);
}

async function migrateAdmin() {
  console.log("🚀 Starting Admin Migration...\n");

  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;

  // 1. Backfill Guide status
  const guidesCollection = db.collection("guides");
  const guideResult = await guidesCollection.updateMany(
    { status: { $exists: false } },
    { $set: { status: "published" } }
  );
  console.log(`📚 Guides updated with status='published': ${guideResult.modifiedCount}`);

  // 2. Backfill User isActive
  const usersCollection = db.collection("users");
  const userResult = await usersCollection.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  console.log(`👤 Users updated with isActive=true: ${userResult.modifiedCount}`);

  // 3. Ensure indexes
  console.log("\n⚡ Creating/Verifying indexes...");

  // Guide indexes
  try {
    await guidesCollection.createIndex({ status: 1, category: 1 });
    console.log("  ✓ Guide index: { status: 1, category: 1 }");
  } catch (err) {
    console.warn("  Guide index error:", err.message);
  }

  // User indexes
  try {
    await usersCollection.createIndex({ isActive: 1 });
    console.log("  ✓ User index: { isActive: 1 }");
  } catch (err) {
    console.warn("  User index error:", err.message);
  }

  // Place indexes
  try {
    const placesCollection = db.collection("places");
    await placesCollection.createIndex({ dietLabel: 1 });
    console.log("  ✓ Place index: { dietLabel: 1 }");
  } catch (err) {
    console.warn("  Place index error:", err.message);
  }

  // AuditLog collection and indexes
  try {
    const auditCollection = db.collection("auditlogs");
    await auditCollection.createIndex({ action: 1, createdAt: -1 });
    await auditCollection.createIndex({ targetType: 1, targetId: 1 });
    console.log("  ✓ AuditLog indexes: { action: 1, createdAt: -1 } and { targetType: 1, targetId: 1 }");
  } catch (err) {
    console.warn("  AuditLog index error:", err.message);
  }

  // Report index for admin queries
  try {
    const reportsCollection = db.collection("reports");
    await reportsCollection.createIndex({ status: 1, createdAt: -1 });
    console.log("  ✓ Report index: { status: 1, createdAt: -1 }");
  } catch (err) {
    console.warn("  Report index error:", err.message);
  }

  console.log("\n🎉 Admin Migration completed successfully!");
  await mongoose.disconnect();
}

migrateAdmin().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
