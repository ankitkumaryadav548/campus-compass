import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { regionQuery } from "@/lib/personalization";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to RSVP for events." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Please provide a valid event ID." },
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

  const { attending } = body;
  if (typeof attending !== "boolean") {
    return NextResponse.json(
      { error: "Field 'attending' must be a boolean (true or false)." },
      { status: 400 }
    );
  }

  const userId = session.user.id || session.user._id;

  try {
    await connectDB();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const event = await Event.findOne({
      _id: id,
      ...regionQuery(session.user),
      date: { $gte: startOfToday },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found, has already passed, or is not available for your region." },
        { status: 404 }
      );
    }

    const updateOperation = attending
      ? { $addToSet: { attendees: userId } }
      : { $pull: { attendees: userId } };

    const updatedEvent = await Event.findByIdAndUpdate(id, updateOperation, {
      new: true,
    }).lean();

    const attendeeCount = updatedEvent?.attendees?.length || 0;

    return NextResponse.json({
      message: attending ? "RSVP confirmed. See you there!" : "RSVP cancelled.",
      isAttending: attending,
      attendeeCount,
    });
  } catch (err) {
    console.error("POST /api/events/[id]/rsvp:", err);
    return NextResponse.json(
      { error: "Could not update RSVP status. Please try again." },
      { status: 500 }
    );
  }
}
