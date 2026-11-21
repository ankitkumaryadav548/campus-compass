// lib/community.js
// Shared queries and business rules for the Community module:
// Direct chat matching between onboarded students and buddies, user suggestions, and campus events.

import mongoose from "mongoose";
import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";
import Message from "@/models/Message";
import Event from "@/models/Event";
import { isOnline } from "@/lib/presence";
import {
  regionQuery,
  sortBuddiesByMatch,
  getBuddyScore,
  getSpecificityLabel,
} from "@/lib/personalization";

export const MAX_NEW_CHATS_PER_DAY = 10;

/**
 * Generates the canonical, direction-independent pair key for two user IDs.
 */
export function generatePairKey(idA, idB) {
  if (!idA || !idB) return "";
  return [idA.toString(), idB.toString()].sort().join(":");
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns scored connection suggestions (seniors and peers) for an onboarded user.
 * Excludes users who have blocked or been blocked by the current user.
 * Respects openToConnect: false for new chats only (existing chats remain available).
 *
 * @param {Object} user - Session user
 * @param {Object} [filters={}] - Optional filters { kind, country, search, limit, offset }
 * @returns {Promise<{ people: Array, totalCount: number, hasMore: boolean, nextOffset: number|null }>}
 */
export async function getPeopleSuggestions(user, filters = {}) {
  const userId = (user.id || user._id)?.toString();
  if (!userId) {
    return { people: [], totalCount: 0, hasMore: false, nextOffset: null };
  }
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const { kind = "all", country = "", search = "", limit = 12, offset = 0 } = filters;
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 12);
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  // 1. Fetch all match records involving this user to check existing relations and blocks
  const userMatches = await BuddyMatch.find({
    $or: [{ requesterId: userObjId }, { recipientId: userObjId }],
  }).lean();

  const matchMap = new Map();
  const blockedUserIds = new Set();

  for (const m of userMatches) {
    const reqStr = m.requesterId.toString();
    const recStr = m.recipientId.toString();
    const otherId = reqStr === userId ? recStr : reqStr;
    matchMap.set(otherId, m);

    // If chat is blocked (by either party), exclude from people suggestions
    if (m.status === "blocked") {
      blockedUserIds.add(otherId);
    }
  }

  // 2. Build database filter for candidates
  const candidateFilter = {
    _id: { $ne: userObjId },
    onboardingDone: true,
    role: { $in: ["student", "buddy"] },
  };

  if (blockedUserIds.size > 0) {
    candidateFilter._id = {
      $nin: [userObjId, ...Array.from(blockedUserIds).map((id) => new mongoose.Types.ObjectId(id))],
    };
  }

  if (kind === "seniors") {
    candidateFilter.isSenior = true;
  } else if (kind === "peers") {
    candidateFilter.isSenior = false;
  }

  if (country && country.trim()) {
    candidateFilter.country = country.trim();
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    candidateFilter.name = { $regex: escaped, $options: "i" };
  }

  const rawCandidates = await User.find(candidateFilter)
    .select("name country regionGroup languages bio isSenior openToConnect")
    .lean();

  // 3. Filter out openToConnect: false users UNLESS there is already an existing active chat
  const eligibleCandidates = rawCandidates.filter((person) => {
    const personId = person._id.toString();
    const existingMatch = matchMap.get(personId);
    if (person.openToConnect === false) {
      return existingMatch && existingMatch.status === "active";
    }
    return true;
  });

  // 4. Score and sort candidates
  const scoredCandidates = sortBuddiesByMatch(eligibleCandidates, user);

  const people = scoredCandidates.map((person) => {
    const personId = person._id.toString();
    const existingMatch = matchMap.get(personId);
    const sharedLanguages =
      Array.isArray(person.languages) && Array.isArray(user.languages)
        ? person.languages.filter((l) => user.languages.includes(l))
        : [];

    const hasActiveMatch = existingMatch && existingMatch.status === "active";

    return {
      _id: personId,
      name: person.name,
      country: person.country || "",
      regionGroup: person.regionGroup || "",
      languages: person.languages || [],
      bio: person.bio || "",
      isSenior: Boolean(person.isSenior),
      matchScore: getBuddyScore(person, user),
      sharedLanguages,
      isSameCountry: Boolean(user.country && person.country === user.country),
      relation: hasActiveMatch ? "active" : "none",
      matchId: hasActiveMatch ? existingMatch._id.toString() : null,
    };
  });

  const totalCount = people.length;
  const paginatedPeople = people.slice(parsedOffset, parsedOffset + parsedLimit);
  const hasMore = parsedOffset + parsedLimit < totalCount;
  const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

  return {
    people: paginatedPeople,
    totalCount,
    hasMore,
    nextOffset,
  };
}

export const getBuddySuggestions = getPeopleSuggestions;

/**
 * Returns conversations involving the user with lastMessageAt not null.
 * Chats blocked by the OTHER person are hidden.
 * Chats blocked by THIS user are returned in a separate blockedChats list.
 *
 * @param {Object} user - Session user
 * @returns {Promise<{ chats: Array, blockedChats: Array }>}
 */
export async function getMyChats(user) {
  const userId = (user.id || user._id)?.toString();
  if (!userId) return { chats: [], blockedChats: [] };
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const matches = await BuddyMatch.find({
    $or: [{ requesterId: userObjId }, { recipientId: userObjId }],
    lastMessageAt: { $ne: null },
  })
    .populate("requesterId", "name country regionGroup languages bio isSenior lastSeenAt")
    .populate("recipientId", "name country regionGroup languages bio isSenior lastSeenAt")
    .sort({ lastMessageAt: -1 })
    .lean();

  const activeChats = [];
  const blockedChats = [];

  for (const m of matches) {
    const matchId = m._id.toString();
    const isRequester = m.requesterId?._id?.toString() === userId;
    const partner = isRequester ? m.recipientId : m.requesterId;
    if (!partner) continue;

    const blockedById = m.blockedBy ? m.blockedBy.toString() : null;

    // If chat is blocked by the other person, hide it completely
    if (m.status === "blocked" && blockedById && blockedById !== userId) {
      continue;
    }

    // Fetch latest message and unread count
    const [lastMsgDoc, unread] = await Promise.all([
      Message.findOne({ matchId: m._id }).sort({ createdAt: -1 }).lean(),
      Message.countDocuments({
        matchId: m._id,
        recipientId: userObjId,
        readAt: null,
      }),
    ]);

    let lastMessage = null;
    if (lastMsgDoc) {
      lastMessage = {
        id: lastMsgDoc._id.toString(),
        text: lastMsgDoc.text,
        createdAt: lastMsgDoc.createdAt.toISOString(),
        senderId: lastMsgDoc.senderId.toString(),
        isMine: lastMsgDoc.senderId.toString() === userId,
        status: lastMsgDoc.readAt ? "read" : "sent",
        clientId: lastMsgDoc.clientId || null,
      };
    }

    const partnerOnline = partner.lastSeenAt ? isOnline(partner.lastSeenAt) : false;

    const serializedChat = {
      _id: matchId,
      status: m.status,
      blockedBy: blockedById,
      lastMessageAt: m.lastMessageAt ? new Date(m.lastMessageAt).toISOString() : null,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      direction: isRequester ? "sent" : "incoming",
      isRequester,
      partner: {
        _id: partner._id.toString(),
        name: partner.name,
        country: partner.country || "",
        regionGroup: partner.regionGroup || "",
        languages: partner.languages || [],
        bio: partner.bio || "",
        isSenior: Boolean(partner.isSenior),
        lastSeenAt: partner.lastSeenAt ? new Date(partner.lastSeenAt).toISOString() : null,
        online: partnerOnline,
      },
      lastMessage,
      unreadCount: unread,
    };

    if (m.status === "blocked" && blockedById === userId) {
      blockedChats.push(serializedChat);
    } else if (m.status === "active") {
      activeChats.push(serializedChat);
    }
  }

  return { chats: activeChats, blockedChats };
}

// Backward-compatible alias for existing callers
export async function getMyMatches(user) {
  const { chats, blockedChats } = await getMyChats(user);
  return [...chats, ...blockedChats];
}

/**
 * Returns upcoming events from today onward matching the student's region.
 */
export async function getUpcomingEvents(user) {
  const userId = (user.id || user._id)?.toString();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const events = await Event.find({
    ...regionQuery(user),
    date: { $gte: startOfToday },
  })
    .sort({ date: 1 })
    .lean();

  return events.map((event) => {
    const attendeeIds = (event.attendees || []).map((id) => id.toString());
    const isAttending = Boolean(userId && attendeeIds.includes(userId));
    const specificity = getSpecificityLabel(event, user);

    return {
      _id: event._id.toString(),
      title: event.title,
      description: event.description || "",
      date: event.date ? new Date(event.date).toISOString() : new Date().toISOString(),
      location: event.location || "",
      region: event.region || [],
      attendeeCount: attendeeIds.length,
      isAttending,
      isCountrySpecific: specificity === "country",
      countryLabel: user.country,
      isSample: Boolean(event.isSample),
    };
  });
}
