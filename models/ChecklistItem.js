// models/ChecklistItem.js
// A single item in the arrival documentation checklist.
// deadlineOffsetDays is relative to the student's arrivalDate.

import mongoose from "mongoose";

const { Schema } = mongoose;

const ChecklistItemSchema = new Schema(
  {
    title:              { type: String, required: true, trim: true },
    description:        { type: String, trim: true, default: "" },
    // region[] – same fallback chain as Guide
    region:             [{ type: String, trim: true }],
    // Days after arrival when this item should ideally be done (0 = day of arrival)
    deadlineOffsetDays: { type: Number, default: 30 },
    // Display order in the checklist UI
    order:              { type: Number, default: 0 },
    isSample:           { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
ChecklistItemSchema.index({ region: 1 });
ChecklistItemSchema.index({ order: 1 });

const ChecklistItem =
  mongoose.models.ChecklistItem ||
  mongoose.model("ChecklistItem", ChecklistItemSchema);
export default ChecklistItem;
