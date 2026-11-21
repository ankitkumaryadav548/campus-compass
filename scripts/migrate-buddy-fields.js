// scripts/migrate-buddy-fields.js
// Idempotent migration script: renames studentId -> requesterId and buddyId -> recipientId,
// computes canonical pairKey, drops old indexes, and sets openToConnect default on users.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment.");
  process.exit(1);
}

async function migrate() {
  console.log("Connecting to MongoDB for migration...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  const db = mongoose.connection.db;

  const buddyMatchesColl = db.collection("buddymatches");
  const usersColl = db.collection("users");

  // 1. Drop old index first before unsetting legacy fields to prevent duplicate null key errors
  try {
    const indexes = await buddyMatchesColl.indexes();
    const oldIndex = indexes.find((idx) => idx.name === "studentId_1_buddyId_1");
    if (oldIndex) {
      console.log("Dropping legacy studentId_1_buddyId_1 index...");
      await buddyMatchesColl.dropIndex("studentId_1_buddyId_1");
    }
  } catch (idxErr) {
    console.warn("Notice checking legacy indexes:", idxErr.message);
  }

  // 2. Migrate BuddyMatch documents
  const allMatches = await buddyMatchesColl.find({}).toArray();
  console.log(`Found ${allMatches.length} BuddyMatch documents to verify.`);

  let updatedCount = 0;
  for (const doc of allMatches) {
    const requesterId = doc.requesterId || doc.studentId;
    const recipientId = doc.recipientId || doc.buddyId;

    if (!requesterId || !recipientId) {
      console.warn(`Skipping match document ${doc._id}: missing user IDs.`);
      continue;
    }

    const pairKey = [requesterId.toString(), recipientId.toString()].sort().join(":");

    const updateFields = {};
    const unsetFields = {};

    if (!doc.requesterId || doc.studentId) {
      updateFields.requesterId = requesterId;
      unsetFields.studentId = "";
    }
    if (!doc.recipientId || doc.buddyId) {
      updateFields.recipientId = recipientId;
      unsetFields.buddyId = "";
    }
    if (doc.pairKey !== pairKey) {
      updateFields.pairKey = pairKey;
    }

    const updateOp = {};
    if (Object.keys(updateFields).length > 0) updateOp.$set = updateFields;
    if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;

    if (Object.keys(updateOp).length > 0) {
      await buddyMatchesColl.updateOne({ _id: doc._id }, updateOp);
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} BuddyMatch documents.`);

  // 3. Ensure pairKey unique index
  try {
    await buddyMatchesColl.createIndex({ pairKey: 1 }, { unique: true });
    console.log("Verified unique index on pairKey.");
  } catch (pairIdxErr) {
    console.warn("Notice creating pairKey index:", pairIdxErr.message);
  }

  // 4. Update users without openToConnect
  const userResult = await usersColl.updateMany(
    { openToConnect: { $exists: false } },
    { $set: { openToConnect: true } }
  );
  console.log(`Set openToConnect=true on ${userResult.modifiedCount} users.`);

  await mongoose.disconnect();
  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
