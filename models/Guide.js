// models/Guide.js
// Step-by-step guide for SIM, bank account, or language help.

import mongoose from "mongoose";

const { Schema } = mongoose;

const ProviderSchema = new Schema({
  name:  { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: "" },
}, { _id: false });

const StepSchema = new Schema({
  order:       { type: Number, required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
}, { _id: false });

const GuideSchema = new Schema(
  {
    category:     { type: String, enum: ["sim", "bank", "language"], required: true },
    title:        { type: String, required: true, trim: true },
    // region[] uses the fallback chain: country → regionGroup → "ALL"
    region:       [{ type: String, trim: true }],
    visaTypes:    [{ type: String, trim: true }],
    requiredDocs: [{ type: String, trim: true }],
    providers:    [ProviderSchema],
    steps:        [StepSchema],
    tips:         [{ type: String, trim: true }],
    sourceUrl:    { type: String, trim: true, default: "" },
    lastVerified: { type: Date },
    // Disclaimer is always shown in the UI; not stored per guide
    isSample:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
GuideSchema.index({ region: 1 });
GuideSchema.index({ category: 1 });
GuideSchema.index({ category: 1, region: 1 });

const Guide = mongoose.models.Guide || mongoose.model("Guide", GuideSchema);
export default Guide;
