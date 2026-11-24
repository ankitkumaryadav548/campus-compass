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
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "BuddyMatch",
      required: true,
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "inappropriate", "inappropriate_behavior", "fake_profile", "safety_concern", "other"],
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
    resolution: {
      type: String,
      enum: ["dismissed", "reviewed", "account_deactivated"],
      default: null,
    },
    adminNote: {
      type: String,
      maxlength: 500,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup of open reports and preventing duplicate reports per match
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, matchId: 1 });

const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

export default Report;
