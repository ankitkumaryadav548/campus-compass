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
      enum: ["new_message", "invitation_received", "invitation_accepted"],
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
    preview: {
      type: String,
      maxLength: 85,
      default: "",
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

NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 24 * 60 * 60 }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
