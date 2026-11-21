import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import { getMessagesForMatch, sendMessage } from "@/lib/messages";
import { touchUserPresence, getPartnerPresenceForMatch } from "@/lib/presence";
import { notifyNewMessage } from "@/lib/notifications";

// Rate limiting: max 30 messages per 5 minutes per user
const userMessageTimestamps = new Map();

function checkMessageRateLimit(userId) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const timestamps = userMessageTimestamps.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= 30) {
    return false;
  }

  recent.push(now);
  userMessageTimestamps.set(userId, recent);
  return true;
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to read messages." },
      { status: 401 }
    );
  }

  const { matchId } = await params;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Please provide a valid match ID." },
      { status: 400 }
    );
  }

  const userId = (session.user.id || session.user._id).toString();

  try {
    await connectDB();

    const match = await BuddyMatch.findById(matchId).lean();
    if (!match) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const requesterId = (match.requesterId || match.studentId)?.toString();
    const recipientId = (match.recipientId || match.buddyId)?.toString();
    const isParticipant = requesterId === userId || recipientId === userId;
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not authorized to access this conversation." },
        { status: 403 }
      );
    }

    if (match.status !== "accepted") {
      return NextResponse.json(
        { error: "Chat is only available for accepted connections." },
        { status: 403 }
      );
    }

    // Non-blocking throttled presence touch for the viewer
    touchUserPresence(userId).catch((e) => console.error("touchUserPresence error:", e));

    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before");
    const after = searchParams.get("after");

    const [messagesResult, partnerPresence] = await Promise.all([
      getMessagesForMatch({
        matchId,
        userId,
        before,
        after,
      }),
      getPartnerPresenceForMatch(matchId, userId),
    ]);

    return NextResponse.json({
      messages: messagesResult.messages,
      hasMore: messagesResult.hasMore,
      firstUnreadId: messagesResult.firstUnreadId,
      partnerPresence,
    });
  } catch (err) {
    console.error("GET /api/buddies/[matchId]/messages:", err);
    return NextResponse.json(
      { error: "Could not fetch messages. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to send messages." },
      { status: 401 }
    );
  }

  const { matchId } = await params;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Please provide a valid match ID." },
      { status: 400 }
    );
  }

  const userId = (session.user.id || session.user._id).toString();

  if (!checkMessageRateLimit(userId)) {
    return NextResponse.json(
      { error: "You are sending messages too quickly. Please slow down." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { text, clientId } = body;
  if (typeof text !== "string") {
    return NextResponse.json(
      { error: "Message text is required." },
      { status: 400 }
    );
  }

  const trimmedText = text.trim();
  if (trimmedText.length < 1 || trimmedText.length > 500) {
    return NextResponse.json(
      { error: "Message must be between 1 and 500 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const match = await BuddyMatch.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const requesterId = (match.requesterId || match.studentId)?.toString();
    const recipientId = (match.recipientId || match.buddyId)?.toString();
    const isParticipant = requesterId === userId || recipientId === userId;
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not authorized to post to this conversation." },
        { status: 403 }
      );
    }

    if (match.status !== "accepted") {
      return NextResponse.json(
        { error: "You can only message in accepted connections." },
        { status: 403 }
      );
    }

    // The other participant is the message recipient
    const otherParticipantId = requesterId === userId ? recipientId : requesterId;

    // Non-blocking throttled presence touch for the sender
    touchUserPresence(userId).catch((e) => console.error("touchUserPresence error:", e));

    const savedMessage = await sendMessage({
      matchId,
      senderId: userId,
      recipientId: otherParticipantId,
      text: trimmedText,
      clientId: typeof clientId === "string" ? clientId : null,
    });

    try {
      await notifyNewMessage(match, userId);
    } catch (notifErr) {
      console.error("notifyNewMessage failed:", notifErr);
    }

    return NextResponse.json(
      { message: savedMessage },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/buddies/[matchId]/messages:", err);
    return NextResponse.json(
      { error: "Could not send message. Please try again." },
      { status: 500 }
    );
  }
}
