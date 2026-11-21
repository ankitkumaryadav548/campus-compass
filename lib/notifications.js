// lib/notifications.js
// Sole module responsible for writing, updating, cleaning, and querying notifications.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { describeNotification } from "@/lib/notificationText";

/**
 * Creates an unread buddy_request notification for the designated buddy.
 */
export async function notifyBuddyRequest(match) {
  const recipient = match?.recipientId || match?.buddyId;
  const actor = match?.requesterId || match?.studentId;
  if (!recipient || !actor) return null;

  const recipientId = recipient.toString();
  const actorId = actor.toString();

  // Never notify a user about their own action
  if (recipientId === actorId) return null;

  await connectDB();

  return Notification.create({
    recipientId,
    actorId,
    type: "buddy_request",
    matchId: match._id,
    count: 1,
    readAt: null,
    isSample: Boolean(match.isSample),
  });
}

/**
 * Creates an unread request_accepted or request_declined notification for the student.
 */
export async function notifyRequestResponse(match, accepted) {
  const recipient = match?.requesterId || match?.studentId;
  const actor = match?.recipientId || match?.buddyId;
  if (!recipient || !actor) return null;

  const recipientId = recipient.toString();
  const actorId = actor.toString();

  if (recipientId === actorId) return null;

  await connectDB();

  return Notification.create({
    recipientId,
    actorId,
    type: accepted ? "request_accepted" : "request_declined",
    matchId: match._id,
    count: 1,
    readAt: null,
    isSample: Boolean(match.isSample),
  });
}

/**
 * Creates or groups an unread new_message notification for the chat recipient.
 */
export async function notifyNewMessage(match, senderId) {
  if (!match?._id || !senderId) return null;

  const requesterIdStr = (match.requesterId || match.studentId).toString();
  const recipientIdStr = (match.recipientId || match.buddyId).toString();
  const senderIdStr = senderId.toString();

  const recipientId = senderIdStr === requesterIdStr ? recipientIdStr : requesterIdStr;

  if (recipientId === senderIdStr) return null;

  await connectDB();

  // Grouping rule: if recipient already has an unread new_message for this match, increment count
  const existing = await Notification.findOne({
    recipientId,
    matchId: match._id,
    type: "new_message",
    readAt: null,
  });

  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.actorId = senderId;
    existing.updatedAt = new Date();
    return existing.save();
  }

  return Notification.create({
    recipientId,
    actorId: senderId,
    type: "new_message",
    matchId: match._id,
    count: 1,
    readAt: null,
    isSample: Boolean(match.isSample),
  });
}

/**
 * Clears the buddy's unread buddy_request notification when a student cancels their pending request.
 */
export async function clearRequestNotification(match) {
  const recipient = match?.recipientId || match?.buddyId;
  if (!match?._id || !recipient) return null;

  await connectDB();

  return Notification.deleteMany({
    recipientId: recipient,
    matchId: match._id,
    type: "buddy_request",
    readAt: null,
  });
}

/**
 * Marks a user's unread new_message notifications for a given match as read when they open the chat.
 */
export async function markMatchMessagesRead(userId, matchId) {
  if (!userId || !matchId) return null;

  await connectDB();

  return Notification.updateMany(
    {
      recipientId: userId,
      matchId,
      type: "new_message",
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );
}

/**
 * Fetches notifications for a user with cursor pagination and optional unread filter.
 * Returns plain, serializable objects with populated safe actor details and formatted text.
 */
export async function getNotifications(userId, { limit = 20, cursor, unreadOnly = false } = {}) {
  if (!userId) return { notifications: [], nextCursor: null };

  await connectDB();

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const query = { recipientId: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    } else if (mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: cursor };
    }
  }

  const rows = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit + 1)
    .populate("actorId", "name country")
    .lean();

  const hasMore = rows.length > parsedLimit;
  const slicedRows = hasMore ? rows.slice(0, parsedLimit) : rows;

  const notifications = slicedRows.map((doc) => {
    const plain = {
      _id: doc._id.toString(),
      type: doc.type,
      actor: doc.actorId
        ? {
            _id: (doc.actorId._id || doc.actorId).toString(),
            name: doc.actorId.name || "A student",
            country: doc.actorId.country || "",
          }
        : null,
      matchId: doc.matchId ? doc.matchId.toString() : null,
      count: doc.count || 1,
      readAt: doc.readAt ? doc.readAt.toISOString() : null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    };

    const details = describeNotification(plain);

    return {
      ...plain,
      title: details.title,
      body: details.body,
      href: details.href,
      iconName: details.iconName,
    };
  });

  const nextCursor =
    hasMore && slicedRows.length > 0
      ? slicedRows[slicedRows.length - 1].createdAt.toISOString()
      : null;

  return { notifications, nextCursor };
}

/**
 * Returns the count of unread notifications for a user.
 */
export async function countUnread(userId) {
  if (!userId) return 0;

  await connectDB();

  return Notification.countDocuments({
    recipientId: userId,
    readAt: null,
  });
}

/**
 * Marks a single notification as read or unread for a user.
 */
export async function markAsRead(userId, id, read = true) {
  if (!userId || !id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectDB();

  const updated = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { $set: { readAt: read ? new Date() : null } },
    { new: true }
  ).populate("actorId", "name country").lean();

  if (!updated) return null;

  const plain = {
    _id: updated._id.toString(),
    type: updated.type,
    actor: updated.actorId
      ? {
          _id: (updated.actorId._id || updated.actorId).toString(),
          name: updated.actorId.name || "A student",
          country: updated.actorId.country || "",
        }
      : null,
    matchId: updated.matchId ? updated.matchId.toString() : null,
    count: updated.count || 1,
    readAt: updated.readAt ? updated.readAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
  };

  const details = describeNotification(plain);
  return {
    ...plain,
    title: details.title,
    body: details.body,
    href: details.href,
    iconName: details.iconName,
  };
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(userId) {
  if (!userId) return 0;

  await connectDB();

  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return result.modifiedCount || 0;
}
