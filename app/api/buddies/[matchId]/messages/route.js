import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import Message from "@/models/Message";

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

    const isParticipant =
      match.studentId.toString() === userId || match.buddyId.toString() === userId;
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not authorized to access this conversation." },
        { status: 403 }
      );
    }

    if (match.status !== "accepted") {
      return NextResponse.json(
        { error: "Chat is only available for accepted buddy connections." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");

    const messageQuery = { matchId };
    if (after) {
      const parsedDate = new Date(after);
      if (!isNaN(parsedDate.getTime())) {
        messageQuery.createdAt = { $gt: parsedDate };
      }
    }

    const messages = await Message.find(messageQuery)
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages sent by the other person as read
    const unreadMessageIds = messages
      .filter((m) => m.senderId.toString() !== userId && !m.readAt)
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $set: { readAt: new Date() } }
      );
    }

    return NextResponse.json({
      messages: messages.map((m) => ({
        _id: m._id.toString(),
        matchId: m.matchId.toString(),
        senderId: m.senderId.toString(),
        isMine: m.senderId.toString() === userId,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt ? m.readAt.toISOString() : null,
      })),
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

  const { text } = body;
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

    const isParticipant =
      match.studentId.toString() === userId || match.buddyId.toString() === userId;
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

    const message = await Message.create({
      matchId,
      senderId: userId,
      text: trimmedText,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: {
          _id: message._id.toString(),
          matchId: message.matchId.toString(),
          senderId: message.senderId.toString(),
          isMine: true,
          text: message.text,
          createdAt: message.createdAt.toISOString(),
          readAt: null,
        },
      },
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
