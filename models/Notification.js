// models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["buddy_request", "request_accepted", "request_declined", "new_message"],
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuddyMatch",
      default: null,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isSample: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries: unread first or newest by recipient
NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

// TTL index to automatically prune notifications older than 60 days (60 * 24 * 60 * 60 seconds)
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 5184000 }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
