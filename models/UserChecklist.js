// models/UserChecklist.js
// Per-student completion status of each ChecklistItem.

import mongoose from "mongoose";

const { Schema } = mongoose;

const UserChecklistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User",          required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "ChecklistItem", required: true },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
  },
  { timestamps: true }
);

// ── Unique compound index – one status doc per (user, item) pair ───────────
UserChecklistSchema.index({ userId: 1, itemId: 1 }, { unique: true });

const UserChecklist =
  mongoose.models.UserChecklist ||
  mongoose.model("UserChecklist", UserChecklistSchema);
export default UserChecklist;
