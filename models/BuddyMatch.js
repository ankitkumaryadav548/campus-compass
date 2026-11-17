// models/BuddyMatch.js
// Tracks buddy match requests between students and senior buddies.

import mongoose from "mongoose";

const { Schema } = mongoose;

const BuddyMatchSchema = new Schema(
  {
    studentId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    buddyId:     { type: Schema.Types.ObjectId, ref: "User", required: true },
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
BuddyMatchSchema.index({ studentId: 1 });
BuddyMatchSchema.index({ buddyId: 1 });
// Compound unique index ensuring only one match record exists per student-buddy pair
BuddyMatchSchema.index({ studentId: 1, buddyId: 1 }, { unique: true });

const BuddyMatch =
  mongoose.models.BuddyMatch ||
  mongoose.model("BuddyMatch", BuddyMatchSchema);
export default BuddyMatch;
