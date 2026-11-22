// app/api/places/nearby/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isValidCoord } from "@/lib/geo";
import { OSM_CONFIG } from "@/lib/osm/config";
import { getNearbyPlaces } from "@/lib/places";

// In-memory per-user rate limiting: 20 requests per minute
const userRequests = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (userRequests.get(userId) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= OSM_CONFIG.rateLimits.nearbySearchesPerMin) {
    return false;
  }
  timestamps.push(now);
  userRequests.set(userId, timestamps);
  return true;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to find nearby places." }, { status: 401 });
  }

  const userId = session.user.id || session.user._id;
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many place searches. Please wait a minute before searching again." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = parseInt(searchParams.get("radius") || String(OSM_CONFIG.defaultRadiusMeters), 10);

  if (!isValidCoord(lat, lng)) {
    return NextResponse.json(
      { error: "Please provide valid latitude and longitude coordinates.", code: "invalid_location" },
      { status: 400 }
    );
  }

  if (!OSM_CONFIG.radiusOptions.includes(radius)) {
    return NextResponse.json(
      { error: "Invalid search radius. Supported options: 1 km, 2 km, 5 km.", code: "invalid_radius" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const result = await getNearbyPlaces(
      { lat: Number(lat), lng: Number(lng), label: searchParams.get("label") || "Selected location" },
      radius
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err.code === "places_unavailable") {
      return NextResponse.json(
        { error: "Places are temporarily unavailable. Please try again shortly.", code: "places_unavailable" },
        { status: 503 }
      );
    }
    console.error("GET /api/places/nearby error:", err);
    return NextResponse.json(
      { error: "Could not load nearby places. Please try again.", code: "places_unavailable" },
      { status: 503 }
    );
  }
}
