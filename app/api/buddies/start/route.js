import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";
import { generatePairKey, MAX_NEW_CHATS_PER_DAY } from "@/lib/community";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to start a chat." },
      { status: 401 }
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

  const { recipientId } = body;
  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return NextResponse.json(
      { error: "Please select a valid user to message." },
      { status: 400 }
    );
  }

  await connectDB();

  // Resolve current user ID, syncing with DB by email to prevent stale session IDs
  let userId = (session.user.id || session.user._id)?.toString();
  if (session.user.email) {
    const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    if (dbUser) {
      userId = dbUser._id.toString();
    }
  }

  if (userId === recipientId) {
    return NextResponse.json(
      { error: "You cannot start a chat with yourself." },
      { status: 400 }
    );
  }

  const senderObjId = new mongoose.Types.ObjectId(userId);
  const recipientObjId = new mongoose.Types.ObjectId(recipientId);
  const pairKey = generatePairKey(userId, recipientId);

  // 1. Check if a conversation already exists
  const existingMatch = await BuddyMatch.findOne({ pairKey });
  if (existingMatch) {
    if (existingMatch.status === "blocked") {
      return NextResponse.json(
        { error: "You cannot chat with this user." },
        { status: 403 }
      );
    }
    return NextResponse.json({
      matchId: existingMatch._id.toString(),
      isNew: false,
    });
  }

  // 2. Validate recipient eligibility for new chats
  const recipient = await User.findById(recipientObjId)
    .select("role onboardingDone openToConnect")
    .lean();

  if (!recipient || !recipient.onboardingDone) {
    return NextResponse.json(
      { error: "This student is not available to chat right now." },
      { status: 404 }
    );
  }

  if (recipient.role === "admin") {
    return NextResponse.json(
      { error: "Cannot start a student chat with an administrator." },
      { status: 403 }
    );
  }

  if (recipient.openToConnect === false) {
    return NextResponse.json(
      { error: "This user is currently not accepting new chats." },
      { status: 403 }
    );
  }

  // 3. Rate limiting: enforce MAX_NEW_CHATS_PER_DAY = 10 on newly created chats
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newChatsCount = await BuddyMatch.countDocuments({
    requesterId: senderObjId,
    createdAt: { $gte: oneDayAgo },
  });

  if (newChatsCount >= MAX_NEW_CHATS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have reached your daily limit of ${MAX_NEW_CHATS_PER_DAY} new chats. Please try again tomorrow.`,
      },
      { status: 429 }
    );
  }

  // 4. Create new active chat (NO notification is sent here; notified on first message)
  try {
    const newMatch = await BuddyMatch.create({
      requesterId: senderObjId,
      recipientId: recipientObjId,
      pairKey,
      status: "active",
      blockedBy: null,
      lastMessageAt: null,
    });

    return NextResponse.json(
      {
        matchId: newMatch._id.toString(),
        isNew: true,
      },
      { status: 201 }
    );
  } catch (err) {
    // In case of race conditions with duplicate pairKey
    if (err.code === 11000) {
      const match = await BuddyMatch.findOne({ pairKey });
      if (match) {
        if (match.status === "blocked") {
          return NextResponse.json(
            { error: "You cannot chat with this user." },
            { status: 403 }
          );
        }
        return NextResponse.json({ matchId: match._id.toString(), isNew: false });
      }
    }
    console.error("POST /api/buddies/start error:", err);
    return NextResponse.json(
      { error: "Could not start chat. Please try again." },
      { status: 500 }
    );
  }
}
