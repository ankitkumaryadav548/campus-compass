// lib/messages.js
// Centralized database logic for messages:
// Send with clientId deduplication, pagination (latest 50, older before, incremental updates after),
// read marking, unread counts, and last message previews.
// Routes and components never query the Message model directly.

import mongoose from "mongoose";
import Message from "@/models/Message";

function serializeMessage(m) {
  if (!m) return null;
  return {
    id: m._id.toString(),
    text: m.text,
    senderId: m.senderId.toString(),
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    status: m.readAt ? "read" : "sent",
    clientId: m.clientId || null,
  };
}

/**
 * Retrieves messages for an accepted match with pagination or incremental updates.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.matchId
 * @param {string} options.userId - Logged in viewer ID
 * @param {string} [options.before] - ISO timestamp to fetch 50 messages before (older history)
 * @param {string} [options.after] - ISO timestamp to fetch messages whose updatedAt > after
 * @param {number} [options.limit=50]
 * @returns {Promise<{ messages: Array, hasMore: boolean, firstUnreadId: string|null }>}
 */
export async function getMessagesForMatch({
  matchId,
  userId,
  before,
  after,
  limit = 50,
}) {
  if (!matchId) {
    return { messages: [], hasMore: false, firstUnreadId: null };
  }

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;

  // 1. Incremental polling update using `after` (checks updatedAt to detect newly sent & read status changes)
  if (after) {
    const afterDate = new Date(after);
    if (!isNaN(afterDate.getTime())) {
      const updatedMessages = await Message.find({
        matchId: matchObjId,
        updatedAt: { $gt: afterDate },
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      return {
        messages: updatedMessages.map(serializeMessage),
        hasMore: false,
        firstUnreadId: null,
      };
    }
  }

  // 2. Older history pagination using `before`
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) {
      const olderDocs = await Message.find({
        matchId: matchObjId,
        createdAt: { $lt: beforeDate },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const chronological = olderDocs.reverse();
      const oldestDoc = chronological[0];

      let hasMore = false;
      if (oldestDoc) {
        const remainingCount = await Message.countDocuments({
          matchId: matchObjId,
          createdAt: { $lt: oldestDoc.createdAt },
        });
        hasMore = remainingCount > 0;
      }

      return {
        messages: chronological.map(serializeMessage),
        hasMore,
        firstUnreadId: null,
      };
    }
  }

  // 3. Default: latest 50 messages in chronological order
  const latestDocs = await Message.find({ matchId: matchObjId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const chronological = latestDocs.reverse();
  const oldestDoc = chronological[0];

  let hasMore = false;
  if (oldestDoc) {
    const remainingCount = await Message.countDocuments({
      matchId: matchObjId,
      createdAt: { $lt: oldestDoc.createdAt },
    });
    hasMore = remainingCount > 0;
  }

  // Find id of the first unread message sent by the other person
  let firstUnreadId = null;
  if (userId) {
    const userStr = userId.toString();
    const firstUnread = chronological.find(
      (m) => m.senderId.toString() !== userStr && !m.readAt
    );
    if (firstUnread) {
      firstUnreadId = firstUnread._id.toString();
    }
  }

  return {
    messages: chronological.map(serializeMessage),
    hasMore,
    firstUnreadId,
  };
}

/**
 * Sends a message with clientId deduplication.
 *
 * @param {Object} data
 * @param {string|mongoose.Types.ObjectId} data.matchId
 * @param {string|mongoose.Types.ObjectId} data.senderId
 * @param {string|mongoose.Types.ObjectId} data.recipientId
 * @param {string} data.text
 * @param {string} [data.clientId]
 * @returns {Promise<Object>} Serialized message
 */
export async function sendMessage({
  matchId,
  senderId,
  recipientId,
  text,
  clientId,
}) {
  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;
  const senderObjId = mongoose.Types.ObjectId.isValid(senderId)
    ? new mongoose.Types.ObjectId(senderId)
    : senderId;
  const recipientObjId = mongoose.Types.ObjectId.isValid(recipientId)
    ? new mongoose.Types.ObjectId(recipientId)
    : recipientId;

  const trimmedText = typeof text === "string" ? text.trim() : "";

  // Deduplication check if clientId provided
  if (clientId) {
    const existing = await Message.findOne({
      senderId: senderObjId,
      clientId,
    }).lean();

    if (existing) {
      return serializeMessage(existing);
    }
  }

  const created = await Message.create({
    matchId: matchObjId,
    senderId: senderObjId,
    recipientId: recipientObjId,
    clientId: clientId || null,
    text: trimmedText,
    readAt: null,
  });

  return serializeMessage(created);
}

/**
 * Marks messages in a match as read up to a specified timestamp.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.matchId
 * @param {string|mongoose.Types.ObjectId} options.userId - Recipient of the unread messages
 * @param {Date|string} options.upTo - ISO date string or Date object
 * @returns {Promise<number>} Number of messages marked
 */
export async function markMessagesRead({ matchId, userId, upTo }) {
  if (!matchId || !userId || !upTo) return 0;

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const upToDate = new Date(upTo);
  if (isNaN(upToDate.getTime())) return 0;

  const now = new Date();
  const result = await Message.updateMany(
    {
      matchId: matchObjId,
      recipientId: userObjId,
      readAt: null,
      createdAt: { $lte: upToDate },
    },
    {
      $set: {
        readAt: now,
      },
    }
  );

  return result.modifiedCount || 0;
}

/**
 * Returns the number of unread messages for a recipient in a match.
 */
export async function getUnreadCount(matchId, recipientId) {
  if (!matchId || !recipientId) return 0;

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;
  const recipientObjId = mongoose.Types.ObjectId.isValid(recipientId)
    ? new mongoose.Types.ObjectId(recipientId)
    : recipientId;

  return await Message.countDocuments({
    matchId: matchObjId,
    recipientId: recipientObjId,
    readAt: null,
  });
}

/**
 * Checks whether a user has sent at least one message in a match.
 */
export async function hasUserSentMessage(matchId, userId) {
  if (!matchId || !userId) return false;

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const count = await Message.countDocuments({
    matchId: matchObjId,
    senderId: userObjId,
  });

  return count > 0;
}

/**
 * Returns total unread chat messages count across all matches for a recipient.
 */
export async function getTotalUnreadMessagesCount(userId) {
  if (!userId) return 0;

  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  return await Message.countDocuments({
    recipientId: userObjId,
    readAt: null,
  });
}

/**
 * Returns the latest message preview for a match.
 */
export async function getLastMessage(matchId) {
  if (!matchId) return null;

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;

  const latest = await Message.findOne({ matchId: matchObjId })
    .sort({ createdAt: -1 })
    .lean();

  return serializeMessage(latest);
}
