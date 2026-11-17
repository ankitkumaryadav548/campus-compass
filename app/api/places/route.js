import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getPlacesForUser, getPlaceFilterOptions } from "@/lib/places";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to browse campus places." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  const forMyCountry = searchParams.get("forMyCountry") !== "false";
  const type = searchParams.get("type") || undefined;
  const cuisine = searchParams.get("cuisine") || undefined;
  const dietParam = searchParams.get("diet") || searchParams.get("dietTags");
  const dietTags = dietParam ? dietParam.split(",").map((d) => d.trim()).filter(Boolean) : undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || "best_match";

  try {
    await connectDB();

    const [places, filterOptions] = await Promise.all([
      getPlacesForUser(session.user, {
        forMyCountry,
        type,
        cuisine,
        dietTags,
        search,
        sort,
      }),
      getPlaceFilterOptions(),
    ]);

    return NextResponse.json({ places, filterOptions });
  } catch (err) {
    console.error("GET /api/places:", err);
    return NextResponse.json(
      { error: "Could not load campus places. Please try again." },
      { status: 500 }
    );
  }
}
