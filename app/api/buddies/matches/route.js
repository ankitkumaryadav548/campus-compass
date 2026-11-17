import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getMyMatches } from "@/lib/community";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view your connections." },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const matches = await getMyMatches(session.user);
    return NextResponse.json({ matches });
  } catch (err) {
    console.error("GET /api/buddies/matches:", err);
    return NextResponse.json(
      { error: "Could not load connections. Please try again." },
      { status: 500 }
    );
  }
}
