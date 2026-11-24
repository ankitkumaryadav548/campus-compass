// models/Place.js
// Stores student reviews, ratings, and verified diet labels for OpenStreetMap places.

import mongoose from "mongoose";

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, trim: true, default: "Anonymous Student" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PlaceSchema = new Schema(
  {
    osmType: {
      type: String,
      enum: ["node", "way", "relation"],
      required: true,
    },
    osmId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    reviews: [ReviewSchema],

    // Admin verified diet labeling
    dietLabel: {
      type: String,
      enum: ["pure_veg", "veg_and_nonveg", "nonveg_only", null],
      default: null,
    },
    dietLabelBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dietLabelAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique compound index on OSM element identifier
PlaceSchema.index({ osmType: 1, osmId: 1 }, { unique: true });

const Place = mongoose.models.Place || mongoose.model("Place", PlaceSchema);
export default Place;
