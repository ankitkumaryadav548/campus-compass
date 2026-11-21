import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getMyChats } from "@/lib/community";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view your chats." },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const { chats, blockedChats } = await getMyChats(session.user);
    return NextResponse.json({
      chats,
      blockedChats,
      matches: [...chats, ...blockedChats],
    });
  } catch (err) {
    console.error("GET /api/buddies/matches:", err);
    return NextResponse.json(
      { error: "Could not load chats. Please try again." },
      { status: 500 }
    );
  }
}
