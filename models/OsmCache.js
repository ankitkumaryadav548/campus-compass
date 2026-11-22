// models/OsmCache.js
// Single cache model for OpenStreetMap Overpass places and Nominatim geocoding.

import mongoose from "mongoose";

const OsmCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["places", "geocode"],
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

const OsmCache = mongoose.models.OsmCache || mongoose.model("OsmCache", OsmCacheSchema);
export default OsmCache;
