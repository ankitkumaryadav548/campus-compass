// app/api/geocode/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { OSM_CONFIG } from "@/lib/osm/config";
import { geocode, reverseGeocode } from "@/lib/osm/nominatim";
import { isValidCoord } from "@/lib/geo";

// In-memory per-user rate limiting: 10 requests per minute
const userGeocodeRequests = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (userGeocodeRequests.get(userId) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= OSM_CONFIG.rateLimits.geocodeSearchesPerMin) {
    return false;
  }
  timestamps.push(now);
  userGeocodeRequests.set(userId, timestamps);
  return true;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to search addresses." }, { status: 401 });
  }

  const userId = session.user.id || session.user._id;
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many address searches. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const q = (searchParams.get("q") || "").trim();

  // Reverse geocode when coordinates are provided
  if (lat != null && lng != null) {
    if (!isValidCoord(lat, lng)) {
      return NextResponse.json({ error: "Invalid coordinates for reverse geocoding." }, { status: 400 });
    }
    try {
      await connectDB();
      const result = await reverseGeocode(Number(lat), Number(lng));
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ label: "My location" });
    }
  }

  if (q.length < 3 || q.length > 100) {
    return NextResponse.json(
      { error: "Search query must be between 3 and 100 characters." },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const results = await geocode(q);
    return NextResponse.json({ query: q, candidates: results });
  } catch (err) {
    if (err.code === "geocode_busy") {
      return NextResponse.json(
        { error: "Address search is currently busy. Please try dropping a pin on the map.", code: "geocode_busy" },
        { status: 503 }
      );
    }
    console.error("GET /api/geocode error:", err);
    return NextResponse.json(
      { error: "Could not complete address search. Please try again.", code: "geocode_busy" },
      { status: 503 }
    );
  }
}
