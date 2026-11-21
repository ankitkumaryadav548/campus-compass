// models/BuddyMatch.js
// Direct chat conversation records between onboarded students and buddies.

import mongoose from "mongoose";

const { Schema } = mongoose;

const BuddyMatchSchema = new Schema(
  {
    requesterId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    pairKey:       { type: String, required: true },
    status:        {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    blockedBy:     { type: Schema.Types.ObjectId, ref: "User", default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
BuddyMatchSchema.index({ requesterId: 1 });
BuddyMatchSchema.index({ recipientId: 1 });
BuddyMatchSchema.index({ status: 1 });
BuddyMatchSchema.index({ lastMessageAt: -1 });
// Direction-safe canonical pair key index ensuring exactly one record per user pair
BuddyMatchSchema.index({ pairKey: 1 }, { unique: true });

const BuddyMatch =
  mongoose.models.BuddyMatch ||
  mongoose.model("BuddyMatch", BuddyMatchSchema);

export default BuddyMatch;
