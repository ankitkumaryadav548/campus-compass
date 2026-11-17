import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getGuidesForUser } from "@/lib/guides";

export async function GET(request, { params }) {
  const { category } = await params;

  if (category !== "sim" && category !== "bank") {
    return NextResponse.json(
      { error: "Guide category not found. Allowed categories are 'sim' and 'bank'." },
      { status: 404 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view your guides." },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const guides = await getGuidesForUser(session.user, category);
    return NextResponse.json({ guides });
  } catch (err) {
    console.error("GET /api/guides/[category]:", err);
    return NextResponse.json(
      { error: "Could not load guides. Please try again." },
      { status: 500 }
    );
  }
}
