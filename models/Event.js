// models/Event.js
// Campus or community event for international students.

import mongoose from "mongoose";

const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    date:        { type: Date, required: true },
    // region[] – same fallback chain: country → regionGroup → "ALL"
    region:      [{ type: String, trim: true }],
    location:    { type: String, trim: true, default: "" },
    attendees:   [{ type: Schema.Types.ObjectId, ref: "User" }],
    isSample:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
EventSchema.index({ region: 1 });
EventSchema.index({ date: 1 });

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);
export default Event;
