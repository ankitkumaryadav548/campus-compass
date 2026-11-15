// models/Place.js
// A food-related place (restaurant, grocery store, cafeteria) near campus.

import mongoose from "mongoose";

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User" },
    userName:  { type: String, trim: true, default: "Anonymous" },
    rating:    { type: Number, min: 1, max: 5 },
    comment:   { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PlaceSchema = new Schema(
  {
    name:        { type: String, required: true, trim: true },
    type:        { type: String, enum: ["grocery", "restaurant", "cafeteria"], required: true },
    // e.g. ["African", "Indian", "Vietnamese"]
    cuisine:     [{ type: String, trim: true }],
    // e.g. ["halal", "vegetarian", "vegan"]
    dietTags:    [{ type: String, trim: true }],
    // e.g. ["Uganda", "Nigeria", "ALL"] – same fallback chain
    countryTags: [{ type: String, trim: true }],
    address:     { type: String, trim: true, default: "" },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    // Average rating (updated manually or via aggregation)
    rating:      { type: Number, min: 0, max: 5, default: 0 },
    reviews:     [ReviewSchema],
    isSample:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
PlaceSchema.index({ countryTags: 1 });
PlaceSchema.index({ cuisine: 1 });
PlaceSchema.index({ dietTags: 1 });
PlaceSchema.index({ "location.lat": 1, "location.lng": 1 });

const Place = mongoose.models.Place || mongoose.model("Place", PlaceSchema);
export default Place;
