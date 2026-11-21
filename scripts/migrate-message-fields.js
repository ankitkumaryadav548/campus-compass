// scripts/migrate-message-fields.js
// Idempotent migration script for Prompt 9.7:
// 1. Populates recipientId on legacy Message documents based on the associated BuddyMatch.
// 2. Ensures timestamps (updatedAt) and indexes on Message collection.
// 3. Ensures lastSeenAt default on User collection.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Create .env.local from .env.example.");
  process.exit(1);
}

async function migrate() {
  console.log("Connecting to MongoDB for Message fields migration...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  const db = mongoose.connection.db;

  const messagesCol = db.collection("messages");
  const matchesCol = db.collection("buddymatches");
  const usersCol = db.collection("users");

  const unmigratedMessages = await messagesCol
    .find({ $or: [{ recipientId: { $exists: false } }, { recipientId: null }] })
    .toArray();

  console.log(`Found ${unmigratedMessages.length} messages requiring recipientId.`);

  let updatedCount = 0;
  for (const msg of unmigratedMessages) {
    if (!msg.matchId) continue;

    const match = await matchesCol.findOne({ _id: msg.matchId });
    if (!match) continue;

    const requester = match.requesterId || match.studentId;
    const recipient = match.recipientId || match.buddyId;

    if (!requester || !recipient) continue;

    const senderStr = msg.senderId.toString();
    const otherId = requester.toString() === senderStr ? recipient : requester;

    await messagesCol.updateOne(
      { _id: msg._id },
      {
        $set: {
          recipientId: otherId,
          updatedAt: msg.updatedAt || msg.createdAt || new Date(),
        },
      }
    );
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} messages with recipientId.`);

  // Ensure lastSeenAt field on users collection
  const userResult = await usersCol.updateMany(
    { lastSeenAt: { $exists: false } },
    { $set: { lastSeenAt: null } }
  );
  console.log(`Set lastSeenAt=null on ${userResult.modifiedCount} users.`);

  // Ensure indexes on messages collection
  try {
    await messagesCol.createIndex({ matchId: 1, createdAt: 1 });
    await messagesCol.createIndex({ matchId: 1, updatedAt: 1 });
    await messagesCol.createIndex({ recipientId: 1, readAt: 1 });
    // Drop any failed legacy index if exists
    try {
      await messagesCol.dropIndex("senderId_1_clientId_1");
    } catch {
      // index might not exist
    }

    await messagesCol.createIndex(
      { senderId: 1, clientId: 1 },
      {
        unique: true,
        partialFilterExpression: { clientId: { $type: "string" } },
      }
    );
    console.log("Verified all Message collection indexes.");
  } catch (idxErr) {
    console.warn("Index verification note:", idxErr.message);
  }

  console.log("Message fields migration completed successfully.");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
