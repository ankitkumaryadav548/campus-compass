// lib/presence.js
// Online presence and last seen tracking for WhatsApp-style chat.
// Updates lastSeenAt throttled at most once every 30s per user via existing poll routes.
// Online status is true if lastSeenAt is within 45s.
// Privacy rule: presence is visible ONLY to the other person of an ACCEPTED match.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";

// In-memory throttling cache: userId -> timestamp in ms of last DB update
const lastUpdateTimestamps = new Map();
const THROTTLE_MS = 30 * 1000; // 30 seconds
const ONLINE_WINDOW_MS = 45 * 1000; // 45 seconds

/**
 * Updates the user's lastSeenAt timestamp in the database.
 * Throttled to at most once every 30 seconds. Cheap, non-blocking, and never throws.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 */
export async function touchUserPresence(userId) {
  if (!userId) return;

  const idStr = userId.toString();
  const now = Date.now();
  const lastUpdated = lastUpdateTimestamps.get(idStr) || 0;

  if (now - lastUpdated < THROTTLE_MS) {
    return;
  }

  // Update in-memory timestamp immediately
  lastUpdateTimestamps.set(idStr, now);

  // Background update (safely caught)
  try {
    await connectDB();

    const userObjId = mongoose.Types.ObjectId.isValid(idStr)
      ? new mongoose.Types.ObjectId(idStr)
      : idStr;

    await User.updateOne(
      { _id: userObjId },
      { $set: { lastSeenAt: new Date(now) } }
    );
  } catch (err) {
    console.error("touchUserPresence error:", err.message);
  }
}

/**
 * Checks whether a given Date is considered online (within 45s of now).
 *
 * @param {Date|string|null} lastSeenAt
 * @returns {boolean}
 */
export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  const time = new Date(lastSeenAt).getTime();
  if (isNaN(time)) return false;
  return Date.now() - time <= ONLINE_WINDOW_MS;
}

/**
 * Returns presence object { online, lastSeenAt } for a given user.
 * Note: Only call this when caller has validated authorization.
 *
 * @param {string|mongoose.Types.ObjectId} targetUserId
 * @returns {Promise<{ online: boolean, lastSeenAt: string | null }>}
 */
export async function getUserPresence(targetUserId) {
  if (!targetUserId) {
    return { online: false, lastSeenAt: null };
  }

  try {
    const targetObjId = mongoose.Types.ObjectId.isValid(targetUserId)
      ? new mongoose.Types.ObjectId(targetUserId)
      : targetUserId;

    const user = await User.findById(targetObjId).select("lastSeenAt").lean();
    if (!user || !user.lastSeenAt) {
      return { online: false, lastSeenAt: null };
    }

    const online = isOnline(user.lastSeenAt);
    return {
      online,
      lastSeenAt: new Date(user.lastSeenAt).toISOString(),
    };
  } catch (err) {
    console.error("getUserPresence error:", err.message);
    return { online: false, lastSeenAt: null };
  }
}

/**
 * Securely retrieves partner presence for a specific match.
 * Enforces privacy: presence is visible ONLY to participants of an ACCEPTED match.
 *
 * @param {string|mongoose.Types.ObjectId} matchId
 * @param {string|mongoose.Types.ObjectId} viewerUserId
 * @returns {Promise<{ online: boolean, lastSeenAt: string | null }>}
 */
export async function getPartnerPresenceForMatch(matchId, viewerUserId) {
  if (!matchId || !viewerUserId) {
    return { online: false, lastSeenAt: null };
  }

  try {
    const matchObjId = mongoose.Types.ObjectId.isValid(matchId)
      ? new mongoose.Types.ObjectId(matchId)
      : matchId;

    const match = await BuddyMatch.findById(matchObjId)
      .select("requesterId recipientId status")
      .lean();

    if (!match || match.status !== "accepted") {
      return { online: false, lastSeenAt: null };
    }

    const viewerStr = viewerUserId.toString();
    const reqStr = match.requesterId?.toString();
    const recStr = match.recipientId?.toString();

    let partnerId = null;
    if (viewerStr === reqStr) {
      partnerId = recStr;
    } else if (viewerStr === recStr) {
      partnerId = reqStr;
    } else {
      // Viewer is not a participant
      return { online: false, lastSeenAt: null };
    }

    return await getUserPresence(partnerId);
  } catch (err) {
    console.error("getPartnerPresenceForMatch error:", err.message);
    return { online: false, lastSeenAt: null };
  }
}
