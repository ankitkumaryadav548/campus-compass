import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { createReport } from "@/lib/reports";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to submit a report." },
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

  const { matchId, reason, details, alsoBlock } = body;
  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json(
      { error: "Please provide a valid conversation ID." },
      { status: 400 }
    );
  }

  await connectDB();

  let userId = (session.user.id || session.user._id)?.toString();
  if (session.user.email) {
    const dbUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    if (dbUser) {
      userId = dbUser._id.toString();
    }
  }

  const result = await createReport({
    reporterId: userId,
    matchId,
    reason,
    details,
    alsoBlock: Boolean(alsoBlock),
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Thank you for letting us know. Your report has been submitted for review.",
      blocked: result.blocked,
    },
    { status: 201 }
  );
}
