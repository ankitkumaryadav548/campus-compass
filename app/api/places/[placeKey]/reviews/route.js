// app/api/places/[placeKey]/reviews/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { OSM_CONFIG } from "@/lib/osm/config";
import { getPlaceReviews, addOrUpdateReview } from "@/lib/places";

// In-memory per-user rate limiting: 10 reviews per hour
const userReviewTimestamps = new Map();

function checkReviewRateLimit(userId) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const timestamps = (userReviewTimestamps.get(userId) || []).filter((t) => now - t < oneHour);
  if (timestamps.length >= OSM_CONFIG.rateLimits.reviewsPerHour) {
    return false;
  }
  timestamps.push(now);
  userReviewTimestamps.set(userId, timestamps);
  return true;
}

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to view reviews." }, { status: 401 });
  }

  const resolvedParams = await params;
  const placeKey = resolvedParams.placeKey;

  if (!/^(node|way|relation)-\d+$/.test(placeKey)) {
    return NextResponse.json({ error: "Invalid place identifier." }, { status: 400 });
  }

  try {
    await connectDB();
    const data = await getPlaceReviews(placeKey);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET place reviews error:", err);
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
  }

  const resolvedParams = await params;
  const placeKey = resolvedParams.placeKey;

  if (!/^(node|way|relation)-\d+$/.test(placeKey)) {
    return NextResponse.json({ error: "Invalid place identifier." }, { status: 400 });
  }

  const userId = session.user.id || session.user._id;
  if (!checkReviewRateLimit(userId)) {
    return NextResponse.json(
      { error: "You have submitted too many reviews recently. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const rating = parseInt(body.rating, 10);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
  }

  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (comment.length < 5 || comment.length > 300) {
    return NextResponse.json(
      { error: "Review comment must be between 5 and 300 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const result = await addOrUpdateReview(placeKey, session.user, { rating, comment });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST place review error:", err);
    return NextResponse.json({ error: "Could not save your review. Please try again." }, { status: 500 });
  }
}
