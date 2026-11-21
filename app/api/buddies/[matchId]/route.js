import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";
import { MAX_ACTIVE_STUDENTS_PER_BUDDY } from "@/lib/community";
import { notifyRequestResponse, clearRequestNotification } from "@/lib/notifications";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to respond to connection requests." },
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
  if (!["accept", "decline", "cancel"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Allowed actions are 'accept', 'decline', and 'cancel'." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const match = await BuddyMatch.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { error: "Connection request not found." },
        { status: 404 }
      );
    }

    if (match.status !== "pending") {
      return NextResponse.json(
        {
          error: `This request has already been ${match.status} and cannot be modified.`,
        },
        { status: 409 }
      );
    }

    const userId = (session.user.id || session.user._id).toString();
    const requesterId = (match.requesterId || match.studentId)?.toString();
    const recipientId = (match.recipientId || match.buddyId)?.toString();

    // Requester cancelling their own request
    if (action === "cancel") {
      if (requesterId !== userId) {
        return NextResponse.json(
          { error: "Only the person who initiated this request may cancel it." },
          { status: 403 }
        );
      }

      match.status = "cancelled";
      match.respondedAt = new Date();
      await match.save();

      try {
        await clearRequestNotification(match);
      } catch (notifErr) {
        console.error("clearRequestNotification failed:", notifErr);
      }

      return NextResponse.json({
        message: "Connection request cancelled.",
        status: "cancelled",
      });
    }

    // Recipient accepting or declining
    if (action === "accept" || action === "decline") {
      if (recipientId !== userId) {
        return NextResponse.json(
          { error: "Only the recipient may accept or decline this request." },
          { status: 403 }
        );
      }

      if (action === "accept") {
        // Enforce 5-connection limit ONLY when recipient is a senior
        const recipientUser = await User.findById(userId).select("isSenior").lean();
        if (recipientUser?.isSenior) {
          const currentActiveCount = await BuddyMatch.countDocuments({
            $or: [{ requesterId: userId }, { recipientId: userId }],
            status: "accepted",
          });

          if (currentActiveCount >= MAX_ACTIVE_STUDENTS_PER_BUDDY) {
            return NextResponse.json(
              {
                error: `You have reached your limit of ${MAX_ACTIVE_STUDENTS_PER_BUDDY} active connections.`,
              },
              { status: 400 }
            );
          }
        }

        match.status = "accepted";
      } else {
        match.status = "declined";
      }

      match.respondedAt = new Date();
      await match.save();

      try {
        await notifyRequestResponse(match, match.status === "accepted");
      } catch (notifErr) {
        console.error("notifyRequestResponse failed:", notifErr);
      }

      return NextResponse.json({
        message: `Connection request ${match.status}.`,
        status: match.status,
      });
    }
  } catch (err) {
    console.error("PATCH /api/buddies/[matchId]:", err);
    return NextResponse.json(
      { error: "Could not update connection request. Please try again." },
      { status: 500 }
    );
  }
}
