import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";
import { markMessagesRead } from "@/lib/messages";
import { touchUserPresence } from "@/lib/presence";
import { markMatchMessagesRead } from "@/lib/notifications";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to update read status." },
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { upTo } = body;
  if (!upTo) {
    return NextResponse.json(
      { error: "Field 'upTo' is required." },
      { status: 400 }
    );
  }

  const upToDate = new Date(upTo);
  if (isNaN(upToDate.getTime())) {
    return NextResponse.json(
      { error: "Field 'upTo' must be a valid ISO date string." },
      { status: 400 }
    );
  }

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
    let effectiveUserId = userId;
    let isParticipant = requesterId === effectiveUserId || recipientId === effectiveUserId;

    if (!isParticipant && session.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
      if (dbUser) {
        const freshId = dbUser._id.toString();
        if (requesterId === freshId || recipientId === freshId) {
          effectiveUserId = freshId;
          isParticipant = true;
        }
      }
    }

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

    // Non-blocking throttled presence touch
    touchUserPresence(effectiveUserId).catch((e) => console.error("touchUserPresence error:", e));

    const markedCount = await markMessagesRead({
      matchId,
      userId: effectiveUserId,
      upTo: upToDate,
    });

    // Clear unread message notifications for this match
    try {
      await markMatchMessagesRead(effectiveUserId, matchId);
    } catch (notifErr) {
      console.error("markMatchMessagesRead failed:", notifErr);
    }

    return NextResponse.json({
      markedCount,
    });
  } catch (err) {
    console.error("POST /api/buddies/[matchId]/read:", err);
    return NextResponse.json(
      { error: "Could not mark messages as read. Please try again." },
      { status: 500 }
    );
  }
}
