import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { countUnread } from "@/lib/notifications";
import { touchUserPresence } from "@/lib/presence";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view notification count." },
      { status: 401 }
    );
  }

  const userId = session.user.id || session.user._id;

  try {
    // Throttled presence update for the session user
    touchUserPresence(userId).catch((e) => console.error("touchUserPresence error:", e));

    const count = await countUnread(userId);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("GET /api/notifications/unread-count error:", err);
    return NextResponse.json(
      { error: "Could not fetch unread count." },
      { status: 500 }
    );
  }
}
