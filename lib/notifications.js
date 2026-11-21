// lib/notifications.js
// Sole module responsible for writing, updating, cleaning, and querying notifications.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { describeNotification, buildMessagePreview } from "@/lib/notificationText";
import { hasUserSentMessage } from "@/lib/messages";

/**
 * Creates or groups an unread new_message notification for the chat recipient.
 * Created ONLY when the recipient has not sent any message in this match yet.
 */
export async function notifyNewMessage(match, message) {
  if (!match?._id || !message) return null;

  let senderId = null;
  let messageText = "";

  if (typeof message === "object" && message !== null) {
    senderId = message.senderId;
    messageText = message.text || "";
  } else {
    senderId = message;
  }

  if (!senderId) return null;

  const requesterIdStr = (match.requesterId || match.studentId).toString();
  const recipientIdStr = (match.recipientId || match.buddyId).toString();
  const senderIdStr = senderId.toString();

  const recipientId = senderIdStr === requesterIdStr ? recipientIdStr : requesterIdStr;

  if (recipientId === senderIdStr) return null;

  await connectDB();

  // Rule: once the receiving person has sent at least one message in that chat,
  // no notification is created for any further message.
  const recipientHasSent = await hasUserSentMessage(match._id, recipientId);
  if (recipientHasSent) {
    return null;
  }

  const preview = buildMessagePreview(messageText);

  // Grouping rule: if recipient already has an unread new_message for this match, increment count
  const existing = await Notification.findOne({
    recipientId,
    matchId: match._id,
    type: "new_message",
    readAt: null,
  });

  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.preview = preview;
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
    preview,
    readAt: null,
    isSample: Boolean(match.isSample),
  });
}

/**
 * Marks a user's own unread new_message notification for a match as read when they send a reply.
 */
export async function markMatchNotificationReadForUser(matchId, userId) {
  if (!matchId || !userId) return { modifiedCount: 0 };

  await connectDB();

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const res = await Notification.updateMany(
    {
      recipientId: userObjId,
      matchId: matchObjId,
      type: "new_message",
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );

  return { modifiedCount: res.modifiedCount };
}

/**
 * Marks all unread new_message notifications for a specific match as read when the user views the chat.
 */
export async function markMatchMessagesRead(userId, matchId) {
  if (!userId || !matchId) return { modifiedCount: 0 };

  await connectDB();

  const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
    ? new mongoose.Types.ObjectId(matchId)
    : matchId;

  const res = await Notification.updateMany(
    {
      recipientId: userId,
      matchId: matchObjId,
      type: "new_message",
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    }
  );

  return { modifiedCount: res.modifiedCount };
}

/**
 * Marks a single notification as read or unread for the owning user.
 */
export async function markNotificationRead(notificationId, userId, read = true) {
  if (!notificationId || !userId) return null;

  await connectDB();

  const notifObjId = mongoose.Types.ObjectId.isValid(notificationId)
    ? new mongoose.Types.ObjectId(notificationId)
    : notificationId;

  return Notification.findOneAndUpdate(
    { _id: notifObjId, recipientId: userId },
    { $set: { readAt: read ? new Date() : null } },
    { new: true }
  ).lean();
}

/**
 * Marks all notifications as read for the recipient user.
 */
export async function markAllNotificationsRead(userId) {
  if (!userId) return { modifiedCount: 0 };

  await connectDB();

  const res = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return { modifiedCount: res.modifiedCount };
}

/**
 * Returns the count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0;

  await connectDB();

  return Notification.countDocuments({
    recipientId: userId,
    readAt: null,
  });
}

export const countUnread = getUnreadNotificationCount;

/**
 * Retrieves paginated notifications for the user, enriched with user-facing display text and icons.
 */
export async function getNotifications(arg1, arg2 = {}) {
  const options =
    typeof arg1 === "object" &&
    arg1 !== null &&
    !mongoose.Types.ObjectId.isValid(arg1) &&
    !arg1._id &&
    !arg1.toHexString
      ? arg1
      : { userId: arg1, ...arg2 };

  const {
    userId,
    limit = 20,
    before = options.cursor || null,
    cursor = before,
    unreadOnly = false,
  } = options;

  if (!userId) return { notifications: [], hasMore: false, unreadCount: 0 };

  await connectDB();

  const query = { recipientId: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const effectiveCursor = before || cursor;
  if (effectiveCursor) {
    const cursorDate = new Date(effectiveCursor);
    if (!isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }
  }

  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

  const [rawNotifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate("actorId", "name country regionGroup isSenior")
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1)
      .lean(),
    Notification.countDocuments({ recipientId: userId, readAt: null }),
  ]);

  const hasMore = rawNotifications.length > parsedLimit;
  const list = hasMore ? rawNotifications.slice(0, parsedLimit) : rawNotifications;

  const enriched = list.map((doc) => {
    const actor = doc.actorId
      ? {
          _id: doc.actorId._id.toString(),
          name: doc.actorId.name,
          country: doc.actorId.country || "",
          regionGroup: doc.actorId.regionGroup || "",
          isSenior: Boolean(doc.actorId.isSenior),
        }
      : null;

    const baseObj = {
      _id: doc._id.toString(),
      recipientId: doc.recipientId.toString(),
      actorId: doc.actorId?._id?.toString() || null,
      type: doc.type,
      matchId: doc.matchId ? doc.matchId.toString() : null,
      count: doc.count || 1,
      preview: doc.preview || "",
      readAt: doc.readAt ? doc.readAt.toISOString() : null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      actor,
    };

    const displayAttrs = describeNotification(baseObj);

    return {
      ...baseObj,
      ...displayAttrs,
    };
  });

  return {
    notifications: enriched,
    hasMore,
    nextCursor: hasMore && list.length > 0 ? list[list.length - 1].createdAt.toISOString() : null,
    unreadCount,
  };
}
