// app/api/dev/skip-onboarding/route.js
// Dev-only helper endpoint to toggle onboardingDone for quick testing.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  // Only accessible in development mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      onboardingDone: true,
      // Provide default country/regionGroup if empty so dashboard looks populated
      ...(session.user.country ? {} : { country: "Uganda", regionGroup: "East Africa" }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Skip onboarding dev error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

