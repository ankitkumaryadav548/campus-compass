// app/api/buddies/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getPeopleSuggestions } from "@/lib/community";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to view people." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") === "all" ? "all" : "country";
  const kind = searchParams.get("kind") || "all";
  const country = searchParams.get("country") || "";
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    await connectDB();

    let user = session.user;
    if (session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email })
        .select("_id name country regionGroup languages isSenior")
        .lean();
      if (dbUser) {
        user = {
          ...session.user,
          id: dbUser._id.toString(),
          _id: dbUser._id.toString(),
          country: dbUser.country || "",
          regionGroup: dbUser.regionGroup || "",
          languages: dbUser.languages || [],
          isSenior: Boolean(dbUser.isSenior),
        };
      }
    }

    const result = await getPeopleSuggestions(user, {
      scope,
      kind,
      country,
      search,
      limit,
      offset,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/buddies:", err);
    return NextResponse.json(
      { error: "Could not load people suggestions." },
      { status: 500 }
    );
  }
}
