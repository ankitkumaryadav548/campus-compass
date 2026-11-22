"use strict";

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Create .env.local from .env.example.");
  process.exit(1);
}

const BuddyMatchSchema = new mongoose.Schema(
  {
    requesterId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pairKey:       { type: String, required: true },
    status:        { type: String, enum: ["pending", "active", "declined", "cancelled", "expired", "blocked"], default: "pending" },
    blockedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastMessageAt: { type: Date, default: null },
    inviteNote:    { type: String, maxLength: 150, default: "" },
    invitedAt:     { type: Date, default: null },
    respondedAt:   { type: Date, default: null },
    expiresAt:     { type: Date, default: null },
    cooldownUntil: { type: Date, default: null },
  },
  { timestamps: true }
);
BuddyMatchSchema.index({ pairKey: 1 }, { unique: true });

const NotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
  },
  { strict: false, timestamps: true }
);

const BuddyMatch = mongoose.models.BuddyMatch || mongoose.model("BuddyMatch", BuddyMatchSchema);
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

async function migrate() {
  console.log("\n🔄  Campus Compass – Invitation Migration");
  console.log("─".repeat(50));

  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✅  Connected to MongoDB\n");

  const allMatches = await BuddyMatch.find({}).lean();
  let updatedCount = 0;

  for (const match of allMatches) {
    const changes = {};

    // 1. Any leftover legacy status value is converted: "accepted" becomes "active"
    let currentStatus = match.status;
    if (currentStatus === "accepted") {
      changes.status = "active";
      currentStatus = "active";
    }

    // 2. Existing "active" and "blocked" matches stay as they are and get respondedAt = createdAt when it is missing
    if (["active", "blocked", "declined", "cancelled"].includes(currentStatus)) {
      if (!match.respondedAt) {
        changes.respondedAt = match.createdAt || new Date();
      }
    }

    // 3. "pending" stays "pending" with invitedAt and expiresAt filled
    if (currentStatus === "pending") {
      if (!match.invitedAt) {
        changes.invitedAt = match.createdAt || new Date();
      }
      if (!match.expiresAt) {
        const baseDate = match.invitedAt || match.createdAt || new Date();
        changes.expiresAt = new Date(new Date(baseDate).getTime() + 14 * 24 * 60 * 60 * 1000);
      }
    }

    if (Object.keys(changes).length > 0) {
      await BuddyMatch.updateOne({ _id: match._id }, { $set: changes });
      updatedCount++;
    }
  }

  console.log(`    BuddyMatch records updated: ${updatedCount} of ${allMatches.length}`);

  // Notification types become: "invitation_received", "invitation_accepted", "new_message". Remove any other type.
  const legacyNotifs = await Notification.deleteMany({
    type: { $nin: ["invitation_received", "invitation_accepted", "new_message"] },
  });
  console.log(`    Legacy notification types removed: ${legacyNotifs.deletedCount}`);

  console.log("\n✅  Migration complete.\n");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\n❌  Migration failed:", err.message);
  console.error(err);
  process.exit(1);
});
