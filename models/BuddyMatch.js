// models/BuddyMatch.js
// Tracks connection requests between students and buddies (seniors and peers).

import mongoose from "mongoose";

const { Schema } = mongoose;

const BuddyMatchSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pairKey:     { type: String, required: true },
    status:      {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
    message:     { type: String, trim: true, default: "" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
BuddyMatchSchema.index({ requesterId: 1 });
BuddyMatchSchema.index({ recipientId: 1 });
BuddyMatchSchema.index({ status: 1 });
// Direction-safe canonical pair key index ensuring exactly one record per user pair
BuddyMatchSchema.index({ pairKey: 1 }, { unique: true });

const BuddyMatch =
  mongoose.models.BuddyMatch ||
  mongoose.model("BuddyMatch", BuddyMatchSchema);

export default BuddyMatch;
