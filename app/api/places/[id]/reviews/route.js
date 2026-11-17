import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Place from "@/models/Place";

// In-memory rate limiting: max 10 reviews per hour per user
const userReviewTimestamps = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const timestamps = userReviewTimestamps.get(userId) || [];
  const recent = timestamps.filter((time) => now - time < oneHour);

  if (recent.length >= 10) {
    return false;
  }

  recent.push(now);
  userReviewTimestamps.set(userId, recent);
  return true;
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to write a review." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Please provide a valid place ID." },
      { status: 400 }
    );
  }

  const userId = session.user.id || session.user._id;
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "You have submitted too many reviews recently. Please wait a while before posting again." },
      { status: 429 }
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

  const { rating, comment } = body;

  const numericRating = Number(rating);
  if (
    !numericRating ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5 stars." },
      { status: 400 }
    );
  }

  if (typeof comment !== "string") {
    return NextResponse.json(
      { error: "Comment must be a text string." },
      { status: 400 }
    );
  }

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 5 || trimmedComment.length > 300) {
    return NextResponse.json(
      { error: "Review comment must be between 5 and 300 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const place = await Place.findById(id);
    if (!place) {
      return NextResponse.json(
        { error: "Place not found." },
        { status: 404 }
      );
    }

    const userName = session.user.name || "Anonymous Student";
    const existingIndex = (place.reviews || []).findIndex(
      (r) => r.userId && r.userId.toString() === userId.toString()
    );

    if (existingIndex >= 0) {
      // Update existing review by this student
      place.reviews[existingIndex].rating = numericRating;
      place.reviews[existingIndex].comment = trimmedComment;
      place.reviews[existingIndex].userName = userName;
      place.reviews[existingIndex].createdAt = new Date();
    } else {
      // Add new review
      place.reviews.push({
        userId,
        userName,
        rating: numericRating,
        comment: trimmedComment,
        createdAt: new Date(),
      });
    }

    // Safely recalculate average rating
    const totalRating = place.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const newAverage = place.reviews.length > 0
      ? Math.round((totalRating / place.reviews.length) * 10) / 10
      : 0;

    place.rating = newAverage;
    await place.save();

    return NextResponse.json({
      message: existingIndex >= 0 ? "Review updated successfully." : "Review submitted successfully.",
      rating: place.rating,
      reviewCount: place.reviews.length,
      reviews: place.reviews.map((r) => ({
        userId: r.userId ? r.userId.toString() : null,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("POST /api/places/[id]/reviews:", err);
    return NextResponse.json(
      { error: "Could not submit review. Please try again." },
      { status: 500 }
    );
  }
}
