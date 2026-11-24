// lib/admin/stats.js
// Statistical aggregations and attention items for the Admin Overview dashboard.
// Strictly avoids external OpenStreetMap calls.

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Guide from "@/models/Guide";
import Event from "@/models/Event";
import Report from "@/models/Report";
import { ADMIN_CONFIG } from "./config";

/**
 * Returns top-level metrics for overview statistics cards.
 */
export async function getOverviewStats() {
  await connectDB();
  const now = new Date();

  const [studentsCount, seniorsCount, openReportsCount, publishedGuidesCount, draftGuidesCount, upcomingEventsCount] =
    await Promise.all([
      User.countDocuments({ role: { $in: ["student", "buddy"] } }),
      User.countDocuments({ isSenior: true, role: { $in: ["student", "buddy"] } }),
      Report.countDocuments({ status: "open" }),
      Guide.countDocuments({ status: "published" }),
      Guide.countDocuments({ status: "draft" }),
      Event.countDocuments({ date: { $gte: now } }),
    ]);

  return {
    studentsCount,
    seniorsCount,
    openReportsCount,
    publishedGuidesCount,
    draftGuidesCount,
    upcomingEventsCount,
  };
}

/**
 * Returns prioritized items requiring administrative review:
 * - Up to 3 open reports
 * - Up to 3 stale published guides (>90 days since last verification)
 * - Count of draft guides
 */
export async function getAttentionItems() {
  await connectDB();
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - ADMIN_CONFIG.staleGuideDays * 24 * 60 * 60 * 1000);

  const [openReports, staleGuides, draftGuidesCount] = await Promise.all([
    Report.find({ status: "open" })
      .populate("reporterId", "name")
      .populate("reportedId", "name country")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Guide.find({
      status: "published",
      $or: [
        { lastVerified: { $lt: staleThreshold } },
        { lastVerified: null },
        { lastVerified: { $exists: false } },
      ],
    })
      .sort({ lastVerified: 1 })
      .limit(3)
      .lean(),
    Guide.countDocuments({ status: "draft" }),
  ]);

  const cleanReports = openReports.map((r) => ({
    _id: r._id.toString(),
    reason: r.reason,
    details: r.details || "",
    reporterName: r.reporterId?.name || "Anonymous Student",
    reportedName: r.reportedId?.name || "Student",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  const cleanStaleGuides = staleGuides.map((g) => {
    const verifiedDate = g.lastVerified ? new Date(g.lastVerified) : null;
    const daysSince = verifiedDate ? Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      _id: g._id.toString(),
      title: g.title,
      category: g.category,
      lastVerified: verifiedDate ? verifiedDate.toISOString() : null,
      daysSince,
      isSample: Boolean(g.isSample),
    };
  });

  return {
    openReports: cleanReports,
    staleGuides: cleanStaleGuides,
    draftGuidesCount,
  };
}
