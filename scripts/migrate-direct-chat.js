// scripts/migrate-direct-chat.js
// Migration script for Prompt 9.8 (Direct Messaging & Safety Tools).
// Idempotent and safe to run multiple times.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is missing.");
  process.exit(1);
}

async function migrate() {
  console.log("Starting Direct Chat migration (Prompt 9.8)...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const matchesCol = db.collection("buddymatches");
  const messagesCol = db.collection("messages");
  const notifsCol = db.collection("notifications");

  // 1. Delete declined and cancelled matches
  const deleteResult = await matchesCol.deleteMany({
    status: { $in: ["declined", "cancelled"] },
  });
  const matchesDeleted = deleteResult.deletedCount;

  // 2. Pending matches: if intro text exists and no message yet, create first Message
  const pendingMatches = await matchesCol.find({ status: "pending" }).toArray();
  let messagesCreated = 0;

  for (const match of pendingMatches) {
    const introText = typeof match.message === "string" ? match.message.trim() : "";
    if (introText) {
      const existingMessage = await messagesCol.findOne({ matchId: match._id });
      if (!existingMessage) {
        const msgTimestamp = match.createdAt || new Date();
        await messagesCol.insertOne({
          matchId: match._id,
          senderId: match.requesterId,
          recipientId: match.recipientId,
          clientId: null,
          text: introText,
          readAt: null,
          createdAt: msgTimestamp,
          updatedAt: msgTimestamp,
        });
        messagesCreated++;
      }
    }
  }

  // 3. Convert accepted and pending matches to "active"
  const convertResult = await matchesCol.updateMany(
    { status: { $in: ["accepted", "pending"] } },
    { $set: { status: "active" } }
  );
  const matchesConverted = convertResult.modifiedCount;

  // 4. Remove obsolete fields (message, respondedAt) from all matches
  await matchesCol.updateMany(
    {},
    { $unset: { message: "", respondedAt: "" } }
  );

  // 5. Set lastMessageAt to the latest Message time, or null when there is none
  const allMatches = await matchesCol.find({}).toArray();
  for (const match of allMatches) {
    const latestMsg = await messagesCol
      .find({ matchId: match._id })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const latestTime = latestMsg.length > 0 ? latestMsg[0].createdAt : null;
    const currentTs = match.lastMessageAt ? new Date(match.lastMessageAt).getTime() : null;
    const targetTs = latestTime ? new Date(latestTime).getTime() : null;

    if (currentTs !== targetTs || match.lastMessageAt === undefined) {
      await matchesCol.updateOne(
        { _id: match._id },
        { $set: { lastMessageAt: latestTime } }
      );
    }
  }

  // 6. Delete obsolete notification types
  const notifDeleteResult = await notifsCol.deleteMany({
    type: { $in: ["buddy_request", "request_accepted", "request_declined"] },
  });

  console.log("Direct Chat migration complete.");
  console.log(`Matches converted: ${matchesConverted}`);
  console.log(`Created as messages: ${messagesCreated}`);
  console.log(`Matches deleted: ${matchesDeleted}`);
  console.log(`Notifications deleted: ${notifDeleteResult.deletedCount}`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
