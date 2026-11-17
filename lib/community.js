// lib/community.js
// Shared queries and business rules for the Community module:
// Buddy matching, connection management, chat authorization, and event RSVP.

import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";
import Message from "@/models/Message";
import Event from "@/models/Event";
import {
  regionQuery,
  sortBuddiesByMatch,
  getBuddyScore,
  getSpecificityLabel,
} from "@/lib/personalization";

export const MAX_ACTIVE_STUDENTS_PER_BUDDY = 5;
export const MAX_PENDING_REQUESTS_PER_STUDENT = 3;

/**
 * Returns scored buddy suggestions (seniors) for a student.
 * Never exposes passwords or private emails. Hides buddies at full capacity
 * unless already connected with this user.
 *
 * @param {Object} user - Session user
 * @returns {Promise<Array>}
 */
export async function getBuddySuggestions(user) {
  const userId = user.id || user._id;

  // 1. Fetch seniors except the user themselves
  const candidateSeniors = await User.find({
    isSenior: true,
    _id: { $ne: userId },
  })
    .select("name country regionGroup languages bio isSenior")
    .lean();

  // 2. Fetch existing match requests involving this user
  const userMatches = await BuddyMatch.find({
    $or: [{ studentId: userId }, { buddyId: userId }],
  }).lean();

  const matchMap = new Map();
  for (const m of userMatches) {
    const otherId = m.studentId.toString() === userId.toString()
      ? m.buddyId.toString()
      : m.studentId.toString();
    matchMap.set(otherId, m);
  }

  // 3. Count accepted students per senior to enforce capacity
  const activeCounts = await BuddyMatch.aggregate([
    { $match: { status: "accepted" } },
    { $group: { _id: "$buddyId", count: { $sum: 1 } } },
  ]);

  const capacityMap = new Map(
    activeCounts.map((item) => [item._id.toString(), item.count])
  );

  // 4. Score and filter
  const scoredSeniors = sortBuddiesByMatch(candidateSeniors, user);

  const suggestions = [];
  for (const senior of scoredSeniors) {
    const seniorId = senior._id.toString();
    const existingMatch = matchMap.get(seniorId);
    const acceptedCount = capacityMap.get(seniorId) || 0;

    // Hide if senior is at max capacity and not already connected with this student
    if (acceptedCount >= MAX_ACTIVE_STUDENTS_PER_BUDDY && existingMatch?.status !== "accepted") {
      continue;
    }

    const sharedLanguages = Array.isArray(senior.languages) && Array.isArray(user.languages)
      ? senior.languages.filter((l) => user.languages.includes(l))
      : [];

    suggestions.push({
      _id: seniorId,
      name: senior.name,
      country: senior.country || "",
      regionGroup: senior.regionGroup || "",
      languages: senior.languages || [],
      bio: senior.bio || "",
      matchScore: getBuddyScore(senior, user),
      sharedLanguages,
      isSameCountry: Boolean(user.country && senior.country === user.country),
      requestStatus: existingMatch ? existingMatch.status : "none",
      matchId: existingMatch ? existingMatch._id.toString() : null,
    });
  }

  return suggestions;
}

/**
 * Returns all connections/requests involving the user (incoming and outgoing).
 * Includes last message preview and unread counts for accepted matches.
 *
 * @param {Object} user - Session user
 * @returns {Promise<Array>}
 */
export async function getMyMatches(user) {
  const userId = user.id || user._id;

  const matches = await BuddyMatch.find({
    $or: [{ studentId: userId }, { buddyId: userId }],
  })
    .populate("studentId", "name country regionGroup languages bio isSenior")
    .populate("buddyId", "name country regionGroup languages bio isSenior")
    .sort({ updatedAt: -1 })
    .lean();

  const enrichedMatches = await Promise.all(
    matches.map(async (m) => {
      const matchId = m._id.toString();
      const isStudent = m.studentId?._id?.toString() === userId.toString();
      const partner = isStudent ? m.buddyId : m.studentId;

      let lastMessage = null;
      let unreadCount = 0;

      if (m.status === "accepted") {
        const [lastMsgDoc, unread] = await Promise.all([
          Message.findOne({ matchId: m._id }).sort({ createdAt: -1 }).lean(),
          Message.countDocuments({
            matchId: m._id,
            senderId: { $ne: userId },
            readAt: null,
          }),
        ]);

        if (lastMsgDoc) {
          lastMessage = {
            text: lastMsgDoc.text,
            createdAt: lastMsgDoc.createdAt.toISOString(),
            senderId: lastMsgDoc.senderId.toString(),
            isMine: lastMsgDoc.senderId.toString() === userId.toString(),
          };
        }
        unreadCount = unread;
      }

      return {
        _id: matchId,
        status: m.status,
        message: m.message || "",
        respondedAt: m.respondedAt ? new Date(m.respondedAt).toISOString() : null,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
        myRole: isStudent ? "student" : "buddy",
        partner: partner
          ? {
              _id: partner._id.toString(),
              name: partner.name,
              country: partner.country || "",
              regionGroup: partner.regionGroup || "",
              languages: partner.languages || [],
              bio: partner.bio || "",
              isSenior: Boolean(partner.isSenior),
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
 * Dates are compared strictly by calendar day.
 *
 * @param {Object} user - Session user
 * @returns {Promise<Array>}
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
