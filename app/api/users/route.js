import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { countries, dietOptions, visaOptions, languageOptions, getRegionGroup } from "@/lib/countries";

const validDietValues = new Set(dietOptions.map((item) => item.value));
const validVisaValues = new Set(visaOptions.map((item) => item.value));
const validLanguageValues = new Set(languageOptions);
const validCountryNames = new Set(countries.map((item) => item.name.toLowerCase()));

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json({ error: "Could not load user profile" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();

    // Support standalone update of openToConnect toggle
    if (typeof body.openToConnect === "boolean" && Object.keys(body).length === 1) {
      await connectDB();
      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { $set: { openToConnect: body.openToConnect } },
        { new: true }
      ).select("-password").lean();

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, user: updatedUser });
    }

    const { country, languages, diet, university, visaType, arrivalDate, bio, openToConnect } = body;

    // Validate country
    if (!country || typeof country !== "string") {
      return NextResponse.json({ error: "Country of origin is required" }, { status: 400 });
    }
    const trimmedCountry = country.trim();
    if (!validCountryNames.has(trimmedCountry.toLowerCase())) {
      return NextResponse.json({ error: "Please select a valid country from the list" }, { status: 400 });
    }

    // Validate languages
    if (!Array.isArray(languages) || languages.length < 1 || languages.length > 5) {
      return NextResponse.json({ error: "Please select between 1 and 5 languages" }, { status: 400 });
    }
    for (const lang of languages) {
      if (!validLanguageValues.has(lang)) {
        return NextResponse.json({ error: `Language '${lang}' is not supported` }, { status: 400 });
      }
    }

    // Validate diet
    if (!diet || !validDietValues.has(diet)) {
      return NextResponse.json({ error: "Please select a valid dietary preference" }, { status: 400 });
    }

    // Validate university
    if (!university || typeof university !== "string") {
      return NextResponse.json({ error: "University name is required" }, { status: 400 });
    }
    const trimmedUniversity = university.trim();
    if (trimmedUniversity.length < 2 || trimmedUniversity.length > 100) {
      return NextResponse.json({ error: "University name must be between 2 and 100 characters" }, { status: 400 });
    }

    // Validate visa type
    if (!visaType || !validVisaValues.has(visaType)) {
      return NextResponse.json({ error: "Please select a valid visa type" }, { status: 400 });
    }

    // Validate arrival date
    if (!arrivalDate) {
      return NextResponse.json({ error: "Arrival date is required" }, { status: 400 });
    }
    const parsedDate = new Date(arrivalDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Please provide a valid arrival date" }, { status: 400 });
    }

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const twoYearsFuture = new Date();
    twoYearsFuture.setFullYear(now.getFullYear() + 2);

    if (parsedDate < oneYearAgo || parsedDate > twoYearsFuture) {
      return NextResponse.json(
        { error: "Arrival date must be within one year in the past and two years in the future" },
        { status: 400 }
      );
    }

    // Compute regionGroup from authoritative lookup
    const regionGroup = getRegionGroup(trimmedCountry);

    // Whitelist only allowed fields
    const updateData = {
      country: trimmedCountry,
      regionGroup,
      languages,
      diet,
      university: trimmedUniversity,
      visaType,
      arrivalDate: parsedDate,
      bio: typeof bio === "string" ? bio.trim().slice(0, 300) : "",
      onboardingDone: true
    };

    if (typeof openToConnect === "boolean") {
      updateData.openToConnect = openToConnect;
    }

    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password").lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Failed to update profile during onboarding:", error);
    return NextResponse.json({ error: "Could not save onboarding profile" }, { status: 500 });
  }
}
