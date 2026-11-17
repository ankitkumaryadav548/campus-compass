import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";
import GuideProgress from "@/models/GuideProgress";
import { regionQuery } from "@/lib/personalization";

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Please sign in to update your progress." },
      { status: 401 }
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

  const { guideId, step, done } = body;

  if (!guideId || !mongoose.Types.ObjectId.isValid(guideId)) {
    return NextResponse.json(
      { error: "Please provide a valid guide ID." },
      { status: 400 }
    );
  }

  if (typeof step !== "number" || !Number.isInteger(step) || step < 1) {
    return NextResponse.json(
      { error: "Step must be a positive integer." },
      { status: 400 }
    );
  }

  if (typeof done !== "boolean") {
    return NextResponse.json(
      { error: "Done must be a boolean (true or false)." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const visaFilter = session.user.visaType
      ? {
          $or: [
            { visaTypes: session.user.visaType },
            { visaTypes: "ALL" },
            { visaTypes: { $size: 0 } },
            { visaTypes: { $exists: false } },
          ],
        }
      : {};

    const guide = await Guide.findOne({
      _id: guideId,
      ...regionQuery(session.user),
      ...visaFilter,
    }).lean();

    if (!guide) {
      return NextResponse.json(
        { error: "Guide not found or not accessible for your region." },
        { status: 404 }
      );
    }

    const stepExists = guide.steps && guide.steps.some((s) => s.order === step);
    if (!stepExists) {
      return NextResponse.json(
        { error: "Step number does not exist in this guide." },
        { status: 400 }
      );
    }

    const userId = session.user.id || session.user._id;
    const updateOperation = done
      ? { $addToSet: { completedSteps: step } }
      : { $pull: { completedSteps: step } };

    const updatedProgress = await GuideProgress.findOneAndUpdate(
      { userId, guideId },
      updateOperation,
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      completedSteps: updatedProgress?.completedSteps || [],
      totalSteps: guide.steps.length,
    });
  } catch (err) {
    console.error("PATCH /api/guides/progress:", err);
    return NextResponse.json(
      { error: "Could not update guide progress. Please try again." },
      { status: 500 }
    );
  }
}
