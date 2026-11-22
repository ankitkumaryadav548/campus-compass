// models/BuddyMatch.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const BuddyMatchSchema = new Schema(
  {
    requesterId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    pairKey:       { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "declined", "cancelled", "expired", "blocked"],
      default: "pending",
    },
    blockedBy:     { type: Schema.Types.ObjectId, ref: "User", default: null },
    lastMessageAt: { type: Date, default: null },
    inviteNote:    { type: String, maxLength: 150, default: "" },
    invitedAt:     { type: Date, default: null },
    respondedAt:   { type: Date, default: null },
    expiresAt:     { type: Date, default: null },
    cooldownUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

BuddyMatchSchema.index({ requesterId: 1 });
BuddyMatchSchema.index({ recipientId: 1 });
BuddyMatchSchema.index({ status: 1 });
BuddyMatchSchema.index({ lastMessageAt: -1 });
BuddyMatchSchema.index({ pairKey: 1 }, { unique: true });

const BuddyMatch =
  mongoose.models.BuddyMatch ||
  mongoose.model("BuddyMatch", BuddyMatchSchema);

export default BuddyMatch;
