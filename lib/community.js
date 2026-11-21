// lib/community.js
// Shared queries and business rules for the Community module:
// Connection matching between any onboarded users, chat authorization, and event RSVP.

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

export const MAX_ACTIVE_STUDENTS_PER_BUDDY = 5;
export const MAX_PENDING_REQUESTS_PER_USER = 3;

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
 * Hides seniors at max capacity (unless already connected). Filters by kind, country, and search.
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

  // 1. Build database filter for candidates
  const candidateFilter = {
    _id: { $ne: userObjId },
    onboardingDone: true,
    openToConnect: { $ne: false },
    role: { $in: ["student", "buddy"] },
  };

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

  const candidates = await User.find(candidateFilter)
    .select("name country regionGroup languages bio isSenior openToConnect")
    .lean();

  // 2. Fetch existing match records involving this user
  const userMatches = await BuddyMatch.find({
    $or: [{ requesterId: userObjId }, { recipientId: userObjId }],
  }).lean();

  const matchMap = new Map();
  for (const m of userMatches) {
    const reqStr = m.requesterId.toString();
    const recStr = m.recipientId.toString();
    const otherId = reqStr === userId ? recStr : reqStr;
    matchMap.set(otherId, m);
  }

  // 3. Count accepted connections to enforce senior capacity limit
  const activeMatches = await BuddyMatch.find({ status: "accepted" })
    .select("requesterId recipientId")
    .lean();

  const capacityMap = new Map();
  for (const m of activeMatches) {
    const reqStr = m.requesterId.toString();
    const recStr = m.recipientId.toString();
    capacityMap.set(reqStr, (capacityMap.get(reqStr) || 0) + 1);
    capacityMap.set(recStr, (capacityMap.get(recStr) || 0) + 1);
  }

  // 4. Score and filter candidates
  const scoredCandidates = sortBuddiesByMatch(candidates, user);

  const eligiblePeople = [];
  for (const person of scoredCandidates) {
    const personId = person._id.toString();
    const existingMatch = matchMap.get(personId);
    const acceptedCount = capacityMap.get(personId) || 0;

    // Seniors at max capacity are hidden unless already connected with current user
    if (
      person.isSenior &&
      acceptedCount >= MAX_ACTIVE_STUDENTS_PER_BUDDY &&
      existingMatch?.status !== "accepted"
    ) {
      continue;
    }

    const sharedLanguages =
      Array.isArray(person.languages) && Array.isArray(user.languages)
        ? person.languages.filter((l) => user.languages.includes(l))
        : [];

    let requestStatus = "none";
    if (existingMatch) {
      if (existingMatch.status === "pending") {
        requestStatus =
          existingMatch.requesterId.toString() === userId
            ? "pending_sent"
            : "pending_received";
      } else {
        requestStatus = existingMatch.status; // "accepted" | "declined" | "cancelled"
      }
    }

    eligiblePeople.push({
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
      requestStatus,
      matchId: existingMatch ? existingMatch._id.toString() : null,
    });
  }

  const totalCount = eligiblePeople.length;
  const paginatedPeople = eligiblePeople.slice(parsedOffset, parsedOffset + parsedLimit);
  const hasMore = parsedOffset + parsedLimit < totalCount;
  const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

  return {
    people: paginatedPeople,
    totalCount,
    hasMore,
    nextOffset,
  };
}

// Backward-compatible alias for existing callers
export const getBuddySuggestions = getPeopleSuggestions;

/**
 * Returns all connections/requests involving the user, categorized into
 * incomingRequests, sentRequests, and connected.
 *
 * @param {Object} user - Session user
 * @returns {Promise<Array>}
 */
export async function getMyMatches(user) {
  const userId = (user.id || user._id)?.toString();
  if (!userId) return [];
  const userObjId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const matches = await BuddyMatch.find({
    $or: [{ requesterId: userObjId }, { recipientId: userObjId }],
  })
    .populate("requesterId", "name country regionGroup languages bio isSenior lastSeenAt")
    .populate("recipientId", "name country regionGroup languages bio isSenior lastSeenAt")
    .sort({ updatedAt: -1 })
    .lean();

  const enrichedMatches = await Promise.all(
    matches.map(async (m) => {
      const matchId = m._id.toString();
      const isRequester = m.requesterId?._id?.toString() === userId;
      const partner = isRequester ? m.recipientId : m.requesterId;

      let lastMessage = null;
      let unreadCount = 0;

      if (m.status === "accepted") {
        const [lastMsgDoc, unread] = await Promise.all([
          Message.findOne({ matchId: m._id }).sort({ createdAt: -1 }).lean(),
          Message.countDocuments({
            matchId: m._id,
            recipientId: userObjId,
            readAt: null,
          }),
        ]);

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
        unreadCount = unread;
      }

      const partnerOnline = partner?.lastSeenAt ? isOnline(partner.lastSeenAt) : false;

      return {
        _id: matchId,
        status: m.status,
        message: m.message || "",
        respondedAt: m.respondedAt ? new Date(m.respondedAt).toISOString() : null,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
        direction: isRequester ? "sent" : "incoming",
        isRequester,
        partner: partner
          ? {
              _id: partner._id.toString(),
              name: partner.name,
              country: partner.country || "",
              regionGroup: partner.regionGroup || "",
              languages: partner.languages || [],
              bio: partner.bio || "",
              isSenior: Boolean(partner.isSenior),
              lastSeenAt: partner.lastSeenAt ? new Date(partner.lastSeenAt).toISOString() : null,
              online: partnerOnline,
            }
          : null,
        lastMessage,
        unreadCount,
      };
    })
  );

  return enrichedMatches;
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
