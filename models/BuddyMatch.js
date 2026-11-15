// models/BuddyMatch.js
// Tracks buddy match requests between students and senior buddies.

import mongoose from "mongoose";

const { Schema } = mongoose;

const BuddyMatchSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buddyId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    status:    { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    message:   { type: String, trim: true, default: "" },  // optional note from student
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
BuddyMatchSchema.index({ studentId: 1 });
BuddyMatchSchema.index({ buddyId: 1 });
BuddyMatchSchema.index({ studentId: 1, buddyId: 1 });

const BuddyMatch =
  mongoose.models.BuddyMatch ||
  mongoose.model("BuddyMatch", BuddyMatchSchema);
export default BuddyMatch;
