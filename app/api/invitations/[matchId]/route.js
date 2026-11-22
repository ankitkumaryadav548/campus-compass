import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { respondToInvitation } from "@/lib/invitations";

const ALLOWED_ACTIONS = ["accept", "decline", "cancel", "block"];

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { matchId } = await params;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json({ error: "Invalid invitation ID." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { action } = body;
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "Action must be one of: accept, decline, cancel, block." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    let user = session.user;
    if (session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
      if (dbUser) user = { ...session.user, id: dbUser._id.toString() };
    }

    const result = await respondToInvitation(user, matchId, action);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, matchId: result.matchId || matchId });
  } catch (err) {
    console.error(`PATCH /api/invitations/${matchId} error:`, err);
    return NextResponse.json({ error: "Could not update invitation. Please try again." }, { status: 500 });
  }
}
