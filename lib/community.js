// lib/community.js
// Shared queries and business rules for the Community module.

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

export const MAX_PENDING_INVITES_PER_USER = 3;
export const MAX_NEW_INVITES_PER_DAY = 10;
export const INVITE_EXPIRY_DAYS = 14;
export const DECLINE_COOLDOWN_DAYS = 30;
export const INVITE_NOTE_MAX = 150;

export function generatePairKey(idA, idB) {
  if (!idA || !idB) return "";
  return [idA.toString(), idB.toString()].sort().join(":");
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns scored connection suggestions for an onboarded user.
 * Default scope: "country" (same country only), falls back to "region" or "all".
 * Excludes blocked pairs both ways and respects openToConnect.
 *
 * @param {Object} user
 * @param {Object} [filters={}] - { scope, kind, country, search, limit, offset }
 * @returns {Promise<{ people, totalCount, hasMore, nextOffset, scopeUsed }>}
 */
export async function getPeopleSuggestions(user, filters = {}) {
  const userId = (user.id || user._id)?.toString();
  if (!userId) {
    return { people: [], totalCount: 0, hasMore: false, nextOffset: null, scopeUsed: "country" };
  }
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const {
    scope = "country",
    kind = "all",
    country = "",
    search = "",
    limit = 12,
    offset = 0,
  } = filters;

  const parsedLimit = Math.max(1, parseInt(limit, 10) || 12);
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  // Fetch all match records involving this user to build relation map
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
    if (m.status === "blocked") {
      blockedUserIds.add(otherId);
    }
  }

  const candidateFilter = {
    _id: { $ne: userObjId },
    onboardingDone: true,
    role: { $in: ["student", "buddy"] },
    isActive: { $ne: false },
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
  } else if (scope === "country" && user.country) {
    candidateFilter.country = user.country;
  } else if (scope === "all" && user.country) {
    candidateFilter.country = { $ne: user.country };
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    candidateFilter.name = { $regex: escaped, $options: "i" };
  }

  const rawCandidates = await User.find(candidateFilter)
    .select("name country regionGroup languages bio isSenior openToConnect")
    .lean();

  // Filter out openToConnect:false UNLESS there is an existing active chat
  const eligibleCandidates = rawCandidates.filter((person) => {
    const personId = person._id.toString();
    const existingMatch = matchMap.get(personId);
    if (person.openToConnect === false) {
      return existingMatch && existingMatch.status === "active";
    }
    return true;
  });

  const scoredCandidates = sortBuddiesByMatch(eligibleCandidates, user);

  const now = new Date();

  const people = scoredCandidates.map((person) => {
    const personId = person._id.toString();
    const existingMatch = matchMap.get(personId);
    const sharedLanguages =
      Array.isArray(person.languages) && Array.isArray(user.languages)
        ? person.languages.filter((l) => user.languages.includes(l))
        : [];

    let relation = "none";
    let matchId = null;

    if (existingMatch) {
      const isRequester = existingMatch.requesterId.toString() === userId;

      if (existingMatch.status === "active") {
        relation = "active";
        matchId = existingMatch._id.toString();
      } else if (existingMatch.status === "pending") {
        if (isRequester) {
          relation = "invited";
          matchId = existingMatch._id.toString();
        } else {
          relation = "received";
          matchId = existingMatch._id.toString();
        }
      } else if (
        existingMatch.status === "declined" &&
        isRequester &&
        existingMatch.cooldownUntil &&
        new Date(existingMatch.cooldownUntil) > now
      ) {
        relation = "unavailable";
      }
    }

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
      relation,
      matchId,
    };
  });

  const scopeUsed = scope;
  const totalCount = people.length;
  const paginatedPeople = people.slice(parsedOffset, parsedOffset + parsedLimit);
  const hasMore = parsedOffset + parsedLimit < totalCount;
  const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

  return { people: paginatedPeople, totalCount, hasMore, nextOffset, scopeUsed };
}

// Backward-compatible alias
export const getBuddySuggestions = getPeopleSuggestions;

/**
 * Returns active conversations (status=active, lastMessageAt not null) for the user.
 * Chats blocked by the other person are hidden.
 * Chats blocked by this user are returned in blockedChats.
 */
export async function getMyChats(user) {
  const userId = (user.id || user._id)?.toString();
  if (!userId) return { chats: [], blockedChats: [] };
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const matches = await BuddyMatch.find({
    $or: [{ requesterId: userObjId }, { recipientId: userObjId }],
    status: { $in: ["active", "blocked"] },
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

    // Hide chats blocked by the other person
    if (m.status === "blocked" && blockedById && blockedById !== userId) continue;

    const [lastMsgDoc, unread] = await Promise.all([
      Message.findOne({ matchId: m._id }).sort({ createdAt: -1 }).lean(),
      Message.countDocuments({ matchId: m._id, recipientId: userObjId, readAt: null }),
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

    const serialized = {
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
      blockedChats.push(serialized);
    } else if (m.status === "active") {
      activeChats.push(serialized);
    }
  }

  return { chats: activeChats, blockedChats };
}

export async function getMyMatches(user) {
  const { chats, blockedChats } = await getMyChats(user);
  return [...chats, ...blockedChats];
}

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
