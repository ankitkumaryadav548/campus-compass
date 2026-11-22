import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendInvitation, getInvitations } from "@/lib/invitations";
import { INVITE_NOTE_MAX } from "@/lib/community";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to send an invitation." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { recipientId, note } = body;
  if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return NextResponse.json({ error: "Please select a valid person to invite." }, { status: 400 });
  }

  if (typeof note === "string" && note.trim().length > INVITE_NOTE_MAX) {
    return NextResponse.json(
      { error: `Note must be ${INVITE_NOTE_MAX} characters or less.` },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    let sender = session.user;
    if (session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email })
        .select("_id name country regionGroup languages")
        .lean();
      if (dbUser) sender = { ...session.user, id: dbUser._id.toString() };
    }

    const result = await sendInvitation(sender, recipientId, note || "");

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ matchId: result.matchId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/invitations error:", err);
    return NextResponse.json({ error: "Could not send invitation. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to view invitations." }, { status: 401 });
  }

  try {
    await connectDB();

    let user = session.user;
    if (session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
      if (dbUser) user = { ...session.user, id: dbUser._id.toString() };
    }

    const data = await getInvitations(user);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/invitations error:", err);
    return NextResponse.json({ error: "Could not load invitations." }, { status: 500 });
  }
}
