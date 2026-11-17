import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import BuddyMatch from "@/models/BuddyMatch";
import {
  MAX_PENDING_REQUESTS_PER_STUDENT,
  MAX_ACTIVE_STUDENTS_PER_BUDDY,
} from "@/lib/community";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to send buddy requests." },
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

  const { buddyId, message = "" } = body;

  if (!buddyId || !mongoose.Types.ObjectId.isValid(buddyId)) {
    return NextResponse.json(
      { error: "Please provide a valid buddy ID." },
      { status: 400 }
    );
  }

  const userId = session.user.id || session.user._id;

  if (userId.toString() === buddyId.toString()) {
    return NextResponse.json(
      { error: "You cannot send a connection request to yourself." },
      { status: 400 }
    );
  }

  if (typeof message !== "string" || message.trim().length > 300) {
    return NextResponse.json(
      { error: "Message must be text under 300 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verify buddy exists and is a senior volunteer
    const buddyUser = await User.findOne({ _id: buddyId, isSenior: true });
    if (!buddyUser) {
      return NextResponse.json(
        { error: "The requested user was not found or is not registered as a senior buddy." },
        { status: 404 }
      );
    }

    // Check existing match record for this pair
    const existingMatch = await BuddyMatch.findOne({
      studentId: userId,
      buddyId,
    });

    if (existingMatch) {
      if (existingMatch.status === "pending") {
        return NextResponse.json(
          { error: "A connection request is already pending with this senior." },
          { status: 400 }
        );
      }
      if (existingMatch.status === "accepted") {
        return NextResponse.json(
          { error: "You are already connected with this senior." },
          { status: 400 }
        );
      }
    }

    // Check student pending request limit
    const pendingCount = await BuddyMatch.countDocuments({
      studentId: userId,
      status: "pending",
    });

    if (pendingCount >= MAX_PENDING_REQUESTS_PER_STUDENT) {
      return NextResponse.json(
        {
          error: `You already have ${MAX_PENDING_REQUESTS_PER_STUDENT} pending requests. Please wait for a response before requesting more buddies.`,
        },
        { status: 400 }
      );
    }

    // Check senior buddy capacity
    const acceptedCount = await BuddyMatch.countDocuments({
      buddyId,
      status: "accepted",
    });

    if (acceptedCount >= MAX_ACTIVE_STUDENTS_PER_BUDDY) {
      return NextResponse.json(
        {
          error: "This senior buddy has reached their maximum number of active student connections.",
        },
        { status: 400 }
      );
    }

    let matchRecord;
    if (existingMatch) {
      // Reopen previously declined or cancelled request
      existingMatch.status = "pending";
      existingMatch.message = message.trim();
      existingMatch.respondedAt = null;
      matchRecord = await existingMatch.save();
    } else {
      matchRecord = await BuddyMatch.create({
        studentId: userId,
        buddyId,
        message: message.trim(),
        status: "pending",
      });
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
