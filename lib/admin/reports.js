import { connectDB } from "@/lib/mongodb";
import Report from "@/models/Report";
import User from "@/models/User";
import { recordAudit } from "./audit";
import { deactivateUser } from "./users";
import { ADMIN_CONFIG } from "./config";

/**
 * List reports with filtering and pagination.
 * Excludes chat messages or private communications.
 */
export async function listReports({ status = "open", reason, page = 1 } = {}) {
  await connectDB();
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }
  if (reason && reason !== "all") {
    if (reason === "inappropriate" || reason === "inappropriate_behavior") {
      query.reason = { $in: ["inappropriate", "inappropriate_behavior"] };
    } else {
      query.reason = reason;
    }
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (safePage - 1) * ADMIN_CONFIG.PAGE_SIZE;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ADMIN_CONFIG.PAGE_SIZE)
      .populate("reporterId", "name email")
      .populate("reportedId", "name email country isSenior isActive")
      .populate("reportedUserId", "name email country isSenior isActive")
      .populate("reviewedBy", "name")
      .lean(),
    Report.countDocuments(query),
  ]);

  // Aggregate count of open and total reports for the reported users
  const reportedUserIds = reports
    .map((r) => r.reportedId?._id || r.reportedUserId?._id || r.reportedId || r.reportedUserId)
    .filter(Boolean);

  let userReportStats = {};
  if (reportedUserIds.length > 0) {
    try {
      const stats = await Report.aggregate([
        {
          $match: {
            $or: [
              { reportedId: { $in: reportedUserIds } },
              { reportedUserId: { $in: reportedUserIds } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$reportedId", "$reportedUserId"] },
            totalReports: { $sum: 1 },
            openReports: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
          },
        },
      ]);
      userReportStats = stats.reduce((acc, s) => {
        if (s && s._id) {
          acc[s._id.toString()] = {
            totalReports: s.totalReports,
            openReports: s.openReports,
          };
        }
        return acc;
      }, {});
    } catch (aggErr) {
      console.error("Warning: report stats aggregation failed, continuing with fallback:", aggErr);
    }
  }

  const items = reports.map((r) => {
    const targetUser = r.reportedId?._id ? r.reportedId : r.reportedUserId?._id ? r.reportedUserId : null;
    const userIdStr = targetUser?._id?.toString() || r.reportedId?.toString() || r.reportedUserId?.toString();
    const counts = userReportStats[userIdStr] || { totalReports: 1, openReports: r.status === "open" ? 1 : 0 };
    return {
      _id: r._id.toString(),
      reporter: r.reporterId
        ? { _id: r.reporterId._id?.toString() || r.reporterId.toString(), name: r.reporterId.name, email: r.reporterId.email }
        : null,
      reportedUser: targetUser
        ? {
            _id: targetUser._id.toString(),
            name: targetUser.name,
            email: targetUser.email,
            country: targetUser.country,
            isSenior: targetUser.isSenior,
            isActive: targetUser.isActive,
            totalReports: counts.totalReports,
            openReports: counts.openReports,
          }
        : null,
      reason: r.reason,
      details: r.details,
      status: r.status,
      resolution: r.resolution || null,
      adminNote: r.adminNote || "",
      reviewedBy: r.reviewedBy ? { _id: r.reviewedBy._id?.toString(), name: r.reviewedBy.name } : null,
      reviewedAt: r.reviewedAt || null,
      createdAt: r.createdAt,
    };
  });

  return {
    reports: items,
    pagination: {
      page: safePage,
      pageSize: ADMIN_CONFIG.PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / ADMIN_CONFIG.PAGE_SIZE) || 1,
    },
  };
}

/**
 * Update report status (dismiss, review, or deactivate reported user)
 */
export async function updateReport(reportId, action, adminNote = "", adminId) {
  await connectDB();
  const report = await Report.findById(reportId);
  if (!report) {
    throw new Error("Report not found");
  }

  const admin = await User.findById(adminId).lean();
  const adminName = admin ? admin.name : "Admin";

  const cleanNote = (adminNote || "").trim();

  const targetUserObjId = report.reportedId || report.reportedUserId;
  const targetUserStr = targetUserObjId ? targetUserObjId.toString() : "unknown";

  if (action === "dismiss") {
    report.status = "reviewed";
    report.resolution = "dismissed";
    report.adminNote = cleanNote;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    await report.save();

    await recordAudit({
      adminId,
      adminName,
      action: "report_dismissed",
      targetType: "Report",
      targetId: report._id.toString(),
      targetName: `Report against ${targetUserStr}`,
      details: { resolution: "dismissed", note: cleanNote },
    });

    return report.toObject();
  }

  if (action === "review") {
    report.status = "reviewed";
    report.resolution = "reviewed";
    report.adminNote = cleanNote;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    await report.save();

    await recordAudit({
      adminId,
      adminName,
      action: "report_reviewed",
      targetType: "Report",
      targetId: report._id.toString(),
      targetName: `Report against ${targetUserStr}`,
      details: { resolution: "reviewed", note: cleanNote },
    });

    return report.toObject();
  }

  if (action === "deactivate") {
    // Call deactivateUser on reported user
    if (!targetUserObjId) {
      throw new Error("Reported user does not exist");
    }
    await deactivateUser(targetUserObjId.toString(), adminId);

    report.status = "reviewed";
    report.resolution = "account_deactivated";
    report.adminNote = cleanNote;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    await report.save();

    await recordAudit({
      adminId,
      adminName,
      action: "report_reviewed",
      targetType: "Report",
      targetId: report._id.toString(),
      targetName: `Report against ${targetUserStr}`,
      details: { resolution: "account_deactivated", note: cleanNote },
    });

    return report.toObject();
  }

  throw new Error("Invalid report action");
}
