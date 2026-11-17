import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getChecklistForUser } from "@/lib/checklist";
import ChecklistItem from "@/models/ChecklistItem";
import UserChecklist from "@/models/UserChecklist";
import { regionQuery } from "@/lib/personalization";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to view your checklist." }, { status: 401 });
  }

  try {
    await connectDB();
    const items = await getChecklistForUser(session.user);
    const done = items.filter((i) => i.status === "done").length;
    return NextResponse.json({ items, done, total: items.length });
  } catch (err) {
    console.error("GET /api/checklist:", err);
    return NextResponse.json({ error: "Could not load your checklist. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to update your checklist." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { itemId, status } = body;

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: "Please provide a valid checklist item ID." }, { status: 400 });
  }

  if (status !== "pending" && status !== "done") {
    return NextResponse.json(
      { error: 'Status must be either "pending" or "done".' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Verify item exists AND is visible to this user's region
    const item = await ChecklistItem.findOne({
      _id: itemId,
      ...regionQuery(session.user),
    }).lean();

    if (!item) {
      return NextResponse.json(
        { error: "Checklist item not found or not available for your region." },
        { status: 404 }
      );
    }

    await UserChecklist.findOneAndUpdate(
      { userId: session.user.id, itemId },
      { status },
      { upsert: true, new: true }
    );

    // Return updated counts so the client can sync the progress bar
    const allItems = await getChecklistForUser(session.user);
    const done = allItems.filter((i) => i.status === "done").length;

    return NextResponse.json({ status, done, total: allItems.length });
  } catch (err) {
    console.error("PATCH /api/checklist:", err);
    return NextResponse.json({ error: "Could not update your checklist. Please try again." }, { status: 500 });
  }
}
