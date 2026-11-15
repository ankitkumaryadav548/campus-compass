// models/GuideProgress.js
// Tracks which steps a student has completed for a given guide.

import mongoose from "mongoose";

const { Schema } = mongoose;

const GuideProgressSchema = new Schema(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User",  required: true },
    guideId:        { type: Schema.Types.ObjectId, ref: "Guide", required: true },
    completedSteps: [{ type: Number }],  // array of step.order numbers
  },
  { timestamps: true }
);

// ── Unique compound index – one progress doc per (user, guide) pair ────────
GuideProgressSchema.index({ userId: 1, guideId: 1 }, { unique: true });

const GuideProgress =
  mongoose.models.GuideProgress ||
  mongoose.model("GuideProgress", GuideProgressSchema);
export default GuideProgress;
