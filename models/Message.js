// models/Message.js
// One-to-one chat messages exchanged between accepted student-buddy matches.

import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    matchId:     { type: Schema.Types.ObjectId, ref: "BuddyMatch", required: true },
    senderId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId:    { type: String, default: null },
    text:        {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 500,
    },
    readAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
MessageSchema.index({ matchId: 1, createdAt: 1 });
MessageSchema.index({ matchId: 1, updatedAt: 1 });
MessageSchema.index({ recipientId: 1, readAt: 1 });
// Deduplication: prevent retried requests with same clientId from creating duplicate records
MessageSchema.index(
  { senderId: 1, clientId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientId: { $type: "string" } },
  }
);

const Message =
  mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);

export default Message;
