import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";
import {
  MAX_PENDING_REQUESTS_PER_USER,
  MAX_ACTIVE_STUDENTS_PER_BUDDY,
  generatePairKey,
} from "@/lib/community";
import { notifyBuddyRequest } from "@/lib/notifications";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to send connection requests." },
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

  const recipientId = body.recipientId || body.buddyId;

  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return NextResponse.json(
      { error: "Please provide a valid recipient ID." },
      { status: 400 }
    );
  }

  const userId = (session.user.id || session.user._id).toString();

  if (userId === recipientId.toString()) {
    return NextResponse.json(
      { error: "You cannot send a connection request to yourself." },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 300) {
    return NextResponse.json(
      { error: "Message must be text under 300 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verify recipient exists, is onboarded, openToConnect, and not an admin
    const recipientUser = await User.findOne({
      _id: recipientId,
      onboardingDone: true,
      openToConnect: { $ne: false },
      role: { $in: ["student", "buddy"] },
    });

    if (!recipientUser) {
      return NextResponse.json(
        { error: "This person is not available to receive connection requests." },
        { status: 404 }
      );
    }

    const pairKey = generatePairKey(userId, recipientId);

    // Check existing match record for this pair using canonical pairKey
    const existingMatch = await BuddyMatch.findOne({ pairKey });

    if (existingMatch) {
      if (existingMatch.status === "pending") {
        if (existingMatch.requesterId.toString() === recipientId.toString()) {
          // The other person already sent a pending request to the sender
          return NextResponse.json(
            {
              error: `${recipientUser.name} has already sent you a connection request. Please accept their incoming request in My Connections.`,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "A connection request is already pending with this person." },
          { status: 400 }
        );
      }
      if (existingMatch.status === "accepted") {
        return NextResponse.json(
          { error: "You are already connected with this person." },
          { status: 400 }
        );
      }
    }

    // Check sender pending request limit
    const pendingCount = await BuddyMatch.countDocuments({
      requesterId: userId,
      status: "pending",
    });

    if (pendingCount >= MAX_PENDING_REQUESTS_PER_USER) {
      return NextResponse.json(
        {
          error: `You already have ${MAX_PENDING_REQUESTS_PER_USER} pending requests. Please wait for responses before sending more.`,
        },
        { status: 400 }
      );
    }

    // Capacity limit (5 accepted connections) applies ONLY when recipient is a senior
    if (recipientUser.isSenior) {
      const activeSeniorCount = await BuddyMatch.countDocuments({
        $or: [{ requesterId: recipientId }, { recipientId }],
        status: "accepted",
      });

      if (activeSeniorCount >= MAX_ACTIVE_STUDENTS_PER_BUDDY) {
        return NextResponse.json(
          {
            error: "This senior buddy has reached their maximum number of active student connections.",
          },
          { status: 400 }
        );
      }
    }

    let matchRecord;
    if (existingMatch) {
      // Reopen previously declined or cancelled record as pending
      existingMatch.requesterId = userId;
      existingMatch.recipientId = recipientId;
      existingMatch.pairKey = pairKey;
      existingMatch.status = "pending";
      existingMatch.message = message;
      existingMatch.respondedAt = null;
      matchRecord = await existingMatch.save();
    } else {
      matchRecord = await BuddyMatch.create({
        requesterId: userId,
        recipientId,
        pairKey,
        message,
        status: "pending",
      });
    }

    // Trigger notification asynchronously
    try {
      await notifyBuddyRequest(matchRecord);
    } catch (notifErr) {
      console.error("notifyBuddyRequest failed:", notifErr);
    }

    return NextResponse.json(
      {
        message: "Connection request sent successfully.",
        matchId: matchRecord._id.toString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/buddies/request:", err);
    return NextResponse.json(
      { error: "Could not send connection request. Please try again." },
      { status: 500 }
    );
  }
}
