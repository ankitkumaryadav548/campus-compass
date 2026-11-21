import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { markAsRead } from "@/lib/notifications";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to update notification." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Please provide a valid notification ID." },
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

  if (typeof body?.read !== "boolean") {
    return NextResponse.json(
      { error: "Field 'read' must be a boolean." },
      { status: 400 }
    );
  }

  const userId = session.user.id || session.user._id;

  try {
    const updated = await markAsRead(userId, id, body.read);
    if (!updated) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (err) {
    console.error("PATCH /api/notifications/[id] error:", err);
    return NextResponse.json(
      { error: "Could not update notification. Please try again." },
      { status: 500 }
    );
  }
}
