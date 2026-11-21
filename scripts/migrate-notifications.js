// scripts/migrate-notifications.js
// Migration script for Prompt 9.9.
// Deletes notifications where the recipient has already written in the chat,
// and fills preview on remaining unread notifications from latest message text.
// Safe to run multiple times.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is missing.");
  process.exit(1);
}

function buildPreview(text, maxLength = 80) {
  if (!text || typeof text !== "string") return "";
  const plain = text.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 3).trimEnd() + "...";
}

async function migrate() {
  console.log("Starting notification migration (Prompt 9.9)...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const notificationsCol = db.collection("notifications");
  const messagesCol = db.collection("messages");

  // 1. Remove any legacy request notifications
  const legacyDelete = await notificationsCol.deleteMany({
    type: { $in: ["buddy_request", "request_accepted", "request_declined"] },
  });

  // 2. Process all new_message notifications
  const messageNotifications = await notificationsCol
    .find({ type: "new_message" })
    .toArray();

  let notificationsDeleted = legacyDelete.deletedCount || 0;
  let previewsFilled = 0;

  for (const notif of messageNotifications) {
    if (!notif.matchId || !notif.recipientId) {
      await notificationsCol.deleteOne({ _id: notif._id });
      notificationsDeleted++;
      continue;
    }

    // Check if recipient has already sent any message in this match
    const recipientSentCount = await messagesCol.countDocuments({
      matchId: notif.matchId,
      senderId: notif.recipientId,
    });

    if (recipientSentCount > 0) {
      // Recipient has already replied, delete the notification
      await notificationsCol.deleteOne({ _id: notif._id });
      notificationsDeleted++;
    } else if (!notif.preview) {
      // Backfill preview from latest message to this recipient
      const latestMessage = await messagesCol
        .find({
          matchId: notif.matchId,
          recipientId: notif.recipientId,
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

      if (latestMessage.length > 0) {
        const previewText = buildPreview(latestMessage[0].text);
        await notificationsCol.updateOne(
          { _id: notif._id },
          { $set: { preview: previewText } }
        );
        previewsFilled++;
      }
    }
  }

  console.log("Notification migration complete.");
  console.log(`Notifications deleted: ${notificationsDeleted}`);
  console.log(`Previews filled: ${previewsFilled}`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
