import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getNotifications, markAllAsRead } from "@/lib/notifications";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view notifications." },
      { status: 401 }
    );
  }

  const userId = session.user.id || session.user._id;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getNotifications(userId, {
      limit,
      cursor,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Could not fetch notifications. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to update notifications." },
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

  if (body?.action !== "markAllRead") {
    return NextResponse.json(
      { error: "Invalid action. Supported action is 'markAllRead'." },
      { status: 400 }
    );
  }

  const userId = session.user.id || session.user._id;

  try {
    const count = await markAllAsRead(userId);
    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { error: "Could not mark notifications as read. Please try again." },
      { status: 500 }
    );
  }
}
