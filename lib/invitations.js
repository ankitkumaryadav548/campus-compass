// lib/invitations.js
// Single source of truth for invitation status transitions.
// All invitation state changes happen here — routes call these functions.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";
import { generatePairKey } from "@/lib/community";
import {
  MAX_PENDING_INVITES_PER_USER,
  MAX_NEW_INVITES_PER_DAY,
  INVITE_EXPIRY_DAYS,
  DECLINE_COOLDOWN_DAYS,
  INVITE_NOTE_MAX,
} from "@/lib/community";
import {
  notifyInvitationReceived,
  notifyInvitationAccepted,
  removePendingInvitationNotification,
} from "@/lib/notifications";

function toObjId(id) {
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
}

function safeProfile(user) {
  if (!user) return null;
  return {
    _id: user._id.toString(),
    name: user.name,
    country: user.country || "",
    regionGroup: user.regionGroup || "",
    languages: user.languages || [],
    bio: user.bio || "",
    isSenior: Boolean(user.isSenior),
  };
}

/**
 * Marks pending invitations whose expiresAt has passed as "expired".
 * Called lazily at the start of list operations — no cron job needed.
 */
export async function expireStaleInvitations() {
  await connectDB();
  await BuddyMatch.updateMany(
    { status: "pending", expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );
}

/**
 * Sends an invitation from sender to recipient with an optional note.
 * Enforces all business rules and creates an invitation_received notification.
 *
 * @returns {{ matchId: string } | { error: string, status: number }}
 */
export async function sendInvitation(sender, recipientId, note = "") {
  await connectDB();

  const senderId = (sender.id || sender._id)?.toString();
  if (!senderId) return { error: "Session error. Please sign in again.", status: 401 };
  if (senderId === recipientId) return { error: "You cannot invite yourself.", status: 400 };

  const trimmedNote = typeof note === "string" ? note.trim().slice(0, INVITE_NOTE_MAX) : "";

  const senderObjId = toObjId(senderId);
  const recipientObjId = toObjId(recipientId);

  const recipient = await User.findById(recipientObjId)
    .select("name country regionGroup languages bio isSenior role onboardingDone openToConnect isActive")
    .lean();

  if (sender.isActive === false) {
    return { error: "This account is inactive.", status: 403 };
  }

  if (!recipient || recipient.isActive === false || !recipient.onboardingDone) {
    return { error: "This student is not available right now.", status: 404 };
  }
  if (recipient.role === "admin") {
    return { error: "You cannot invite an administrator.", status: 403 };
  }
  if (recipient.openToConnect === false) {
    return { error: "This person is not accepting new invitations right now.", status: 403 };
  }

  const pairKey = generatePairKey(senderId, recipientId);
  const existing = await BuddyMatch.findOne({ pairKey });

  if (existing) {
    // If the OTHER person already has a pending invitation to this sender, tell them to accept it
    if (
      existing.status === "pending" &&
      existing.requesterId.toString() === recipientId
    ) {
      return {
        error: "This person already sent you an invitation. Check your Invitations tab to accept it.",
        status: 409,
      };
    }

    if (existing.status === "active") {
      return { error: "You already have an active chat with this person.", status: 409 };
    }

    if (existing.status === "pending") {
      return { error: "You already have a pending invitation to this person.", status: 409 };
    }

    if (existing.status === "blocked") {
      // Never reveal who blocked whom
      return { error: "This person is not available right now.", status: 403 };
    }

    // Check if sender is under a cooldown (declined with unexpired cooldown)
    if (
      existing.status === "declined" &&
      existing.requesterId.toString() === senderId &&
      existing.cooldownUntil &&
      new Date(existing.cooldownUntil) > new Date()
    ) {
      return { error: "This person is not available right now.", status: 403 };
    }

    // Reopen: cancelled, expired, or cooldown elapsed
    const canReopen = ["cancelled", "expired"].includes(existing.status) ||
      (existing.status === "declined" && existing.requesterId.toString() === senderId &&
        (!existing.cooldownUntil || new Date(existing.cooldownUntil) <= new Date()));

    if (!canReopen) {
      return { error: "This person is not available right now.", status: 403 };
    }

    // Enforce pending limit before reopening
    const pendingCount = await BuddyMatch.countDocuments({
      requesterId: senderObjId,
      status: "pending",
    });
    if (pendingCount >= MAX_PENDING_INVITES_PER_USER) {
      return {
        error: `You can have at most ${MAX_PENDING_INVITES_PER_USER} pending invitations at a time. Cancel one to send a new one.`,
        status: 429,
      };
    }

    // Enforce daily limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await BuddyMatch.countDocuments({
      requesterId: senderObjId,
      invitedAt: { $gte: oneDayAgo },
    });
    if (dailyCount >= MAX_NEW_INVITES_PER_DAY) {
      return {
        error: `You have sent ${MAX_NEW_INVITES_PER_DAY} invitations today. Please wait until tomorrow.`,
        status: 429,
      };
    }

    const now = new Date();
    await BuddyMatch.updateOne(
      { _id: existing._id },
      {
        $set: {
          status: "pending",
          inviteNote: trimmedNote,
          invitedAt: now,
          expiresAt: new Date(now.getTime() + INVITE_EXPIRY_DAYS * 86400000),
          respondedAt: null,
          cooldownUntil: null,
        },
      }
    );

    await notifyInvitationReceived({
      matchId: existing._id,
      actorId: senderId,
      recipientId,
      note: trimmedNote,
    });

    return { matchId: existing._id.toString() };
  }

  // New pair — enforce limits
  const [pendingCount, dailyCount] = await Promise.all([
    BuddyMatch.countDocuments({ requesterId: senderObjId, status: "pending" }),
    BuddyMatch.countDocuments({
      requesterId: senderObjId,
      invitedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);

  if (pendingCount >= MAX_PENDING_INVITES_PER_USER) {
    return {
      error: `You can have at most ${MAX_PENDING_INVITES_PER_USER} pending invitations at a time. Cancel one to send a new one.`,
      status: 429,
    };
  }
  if (dailyCount >= MAX_NEW_INVITES_PER_DAY) {
    return {
      error: `You have sent ${MAX_NEW_INVITES_PER_DAY} invitations today. Please wait until tomorrow.`,
      status: 429,
    };
  }

  const now = new Date();
  let newMatch;
  try {
    newMatch = await BuddyMatch.create({
      requesterId: senderObjId,
      recipientId: recipientObjId,
      pairKey,
      status: "pending",
      inviteNote: trimmedNote,
      invitedAt: now,
      expiresAt: new Date(now.getTime() + INVITE_EXPIRY_DAYS * 86400000),
    });
  } catch (err) {
    if (err.code === 11000) {
      return { error: "You already have a connection with this person.", status: 409 };
    }
    throw err;
  }

  await notifyInvitationReceived({
    matchId: newMatch._id,
    actorId: senderId,
    recipientId,
    note: trimmedNote,
  });

  return { matchId: newMatch._id.toString() };
}

/**
 * Responds to an invitation or cancels one's own sent invitation.
 * Actions: "accept", "decline", "cancel", "block"
 * Uses an atomic findOneAndUpdate to prevent double-clicks applying twice.
 *
 * @returns {{ success: boolean } | { error: string, status: number }}
 */
export async function respondToInvitation(user, matchId, action) {
  await connectDB();

  const userId = (user.id || user._id)?.toString();
  if (!userId) return { error: "Session error.", status: 401 };

  const matchObjId = toObjId(matchId);
  const match = await BuddyMatch.findById(matchObjId);
  if (!match) return { error: "Invitation not found.", status: 404 };

  const requesterId = match.requesterId.toString();
  const recipientId = match.recipientId.toString();

  if (userId !== requesterId && userId !== recipientId) {
    return { error: "You are not part of this invitation.", status: 403 };
  }

  const isRequester = userId === requesterId;
  const isRecipient = userId === recipientId;

  // Check stale expiry before action
  if (match.status === "pending" && match.expiresAt && new Date(match.expiresAt) < new Date()) {
    await BuddyMatch.updateOne({ _id: matchObjId }, { $set: { status: "expired" } });
    return { error: "This invitation has expired.", status: 410 };
  }

  if (action === "cancel") {
    if (!isRequester) return { error: "Only the sender can cancel an invitation.", status: 403 };

    // Atomic update that only succeeds if status is still "pending"
    const updated = await BuddyMatch.findOneAndUpdate(
      { _id: matchObjId, status: "pending" },
      { $set: { status: "cancelled", respondedAt: new Date() } },
      { new: true }
    );
    if (!updated) return { error: "This invitation is no longer pending.", status: 409 };

    // Remove the recipient's unread invitation_received notification
    await removePendingInvitationNotification(matchId, recipientId);

    return { success: true };
  }

  if (action === "accept") {
    if (!isRecipient) return { error: "Only the recipient can accept an invitation.", status: 403 };

    const requesterUser = await User.findById(match.requesterId).select("isActive").lean();
    if (requesterUser?.isActive === false) {
      return { error: "This account is inactive.", status: 403 };
    }

    const updated = await BuddyMatch.findOneAndUpdate(
      { _id: matchObjId, status: "pending" },
      { $set: { status: "active", respondedAt: new Date() } },
      { new: true }
    );
    if (!updated) return { error: "This invitation is no longer pending.", status: 409 };

    await notifyInvitationAccepted({
      matchId,
      actorId: recipientId,
      recipientId: requesterId,
    });

    return { success: true, matchId: matchId.toString() };
  }

  if (action === "decline") {
    if (!isRecipient) return { error: "Only the recipient can decline an invitation.", status: 403 };

    const cooldownUntil = new Date(Date.now() + DECLINE_COOLDOWN_DAYS * 86400000);
    const updated = await BuddyMatch.findOneAndUpdate(
      { _id: matchObjId, status: "pending" },
      { $set: { status: "declined", respondedAt: new Date(), cooldownUntil } },
      { new: true }
    );
    if (!updated) return { error: "This invitation is no longer pending.", status: 409 };

    // No notification to sender on decline

    return { success: true };
  }

  if (action === "block") {
    if (!isRecipient) return { error: "Only the recipient can block from an invitation.", status: 403 };

    const updated = await BuddyMatch.findOneAndUpdate(
      { _id: matchObjId, status: "pending" },
      {
        $set: {
          status: "blocked",
          blockedBy: toObjId(userId),
          respondedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!updated) return { error: "This invitation is no longer pending.", status: 409 };

    // Remove the sender's pending notification silently
    await removePendingInvitationNotification(matchId, recipientId);

    return { success: true };
  }

  return { error: "Invalid action. Use accept, decline, cancel or block.", status: 400 };
}

/**
 * Returns pending received and sent invitations for a user, with the other person's safe profile.
 *
 * @returns {{ received: Array, sent: Array }}
 */
export async function getInvitations(user) {
  await expireStaleInvitations();
  await connectDB();

  const userId = (user.id || user._id)?.toString();
  if (!userId) return { received: [], sent: [] };

  const userObjId = toObjId(userId);

  const [received, sent] = await Promise.all([
    BuddyMatch.find({ recipientId: userObjId, status: "pending" })
      .populate("requesterId", "name country regionGroup languages bio isSenior isActive")
      .sort({ invitedAt: -1 })
      .lean(),
    BuddyMatch.find({
      requesterId: userObjId,
      status: { $in: ["pending", "declined", "cancelled", "expired"] },
    })
      .populate("recipientId", "name country regionGroup languages bio isSenior isActive")
      .sort({ invitedAt: -1 })
      .lean(),
  ]);

  // Filter out pending invitations where the other account is inactive
  const activeReceived = received.filter((m) => m.requesterId && m.requesterId.isActive !== false);
  const activeSent = sent.filter((m) => {
    if (m.status === "pending") {
      return m.recipientId && m.recipientId.isActive !== false;
    }
    return true;
  });

  const serializeReceived = activeReceived.map((m) => ({
    _id: m._id.toString(),
    requester: safeProfile(m.requesterId),
    note: m.inviteNote || "",
    invitedAt: m.invitedAt ? new Date(m.invitedAt).toISOString() : new Date(m.createdAt).toISOString(),
    expiresAt: m.expiresAt ? new Date(m.expiresAt).toISOString() : null,
    status: m.status,
  }));

  const serializeSent = activeSent.map((m) => {
    // Show "not available" label for declined within cooldown
    const isDeclinedCooldown =
      m.status === "declined" &&
      m.cooldownUntil &&
      new Date(m.cooldownUntil) > new Date();

    return {
      _id: m._id.toString(),
      recipient: safeProfile(m.recipientId),
      note: m.inviteNote || "",
      invitedAt: m.invitedAt ? new Date(m.invitedAt).toISOString() : new Date(m.createdAt).toISOString(),
      status: m.status,
      displayStatus: isDeclinedCooldown ? "unavailable" : m.status,
    };
  });

  return { received: serializeReceived, sent: serializeSent };
}

/**
 * Returns the count of pending received invitations for a user.
 */
export async function countPendingReceived(user) {
  await connectDB();
  const userId = (user.id || user._id)?.toString();
  if (!userId) return 0;
  const matches = await BuddyMatch.find({ recipientId: toObjId(userId), status: "pending" })
    .populate("requesterId", "isActive")
    .lean();
  return matches.filter((m) => m.requesterId && m.requesterId.isActive !== false).length;
}
