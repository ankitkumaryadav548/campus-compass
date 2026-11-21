// models/Report.js
// Safety reporting tool allowing a chat participant to report another user.

import mongoose from "mongoose";

const { Schema } = mongoose;

const ReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "BuddyMatch",
      required: true,
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "inappropriate", "fake_profile", "other"],
      required: true,
    },
    details: {
      type: String,
      maxlength: 300,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "reviewed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup of open reports and preventing duplicate reports per match
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, matchId: 1 });

const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

export default Report;
