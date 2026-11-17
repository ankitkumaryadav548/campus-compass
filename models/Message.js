// models/Message.js
// One-to-one chat messages exchanged between accepted student-buddy matches.

import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    matchId:   { type: Schema.Types.ObjectId, ref: "BuddyMatch", required: true },
    senderId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    text:      {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 500,
    },
    createdAt: { type: Date, default: Date.now },
    readAt:    { type: Date, default: null },
  },
  { timestamps: false }
);

// ── Compound index for fast chronological conversation retrieval ───────────
MessageSchema.index({ matchId: 1, createdAt: 1 });

const Message =
  mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
export default Message;
