import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to manage chat settings." },
      { status: 401 }
    );
  }

  const { matchId } = await params;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Please provide a valid conversation ID." },
      { status: 400 }
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

  const { action } = body;
  if (!["block", "unblock"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Allowed actions are 'block' and 'unblock'." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    let userId = (session.user.id || session.user._id)?.toString();
    if (session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
      if (dbUser) {
        userId = dbUser._id.toString();
      }
    }

    const match = await BuddyMatch.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const requesterId = match.requesterId?.toString();
    const recipientId = match.recipientId?.toString();
    const isParticipant = requesterId === userId || recipientId === userId;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not authorized to modify this chat." },
        { status: 403 }
      );
    }

    if (action === "block") {
      match.status = "blocked";
      match.blockedBy = new mongoose.Types.ObjectId(userId);
      await match.save();

      return NextResponse.json({
        success: true,
        status: "blocked",
        message: "User blocked.",
      });
    }

    if (action === "unblock") {
      if (match.status === "blocked") {
        const blockerId = match.blockedBy ? match.blockedBy.toString() : null;
        if (blockerId && blockerId !== userId) {
          return NextResponse.json(
            { error: "Only the user who blocked this chat can unblock it." },
            { status: 403 }
          );
        }
      }

      match.status = "active";
      match.blockedBy = null;
      await match.save();

      return NextResponse.json({
        success: true,
        status: "active",
        message: "User unblocked.",
      });
    }
  } catch (err) {
    console.error("PATCH /api/buddies/[matchId] error:", err);
    return NextResponse.json(
      { error: "Could not update chat status. Please try again." },
      { status: 500 }
    );
  }
}
