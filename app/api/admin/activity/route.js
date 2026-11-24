import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { ADMIN_CONFIG } from "@/lib/admin/config";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const skip = (page - 1) * ADMIN_CONFIG.PAGE_SIZE;

    await connectDB();
    const query = {};
    if (action && action !== "all") {
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ADMIN_CONFIG.PAGE_SIZE)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const formattedLogs = logs.map((log) => ({
      _id: log._id.toString(),
      adminId: log.adminId?.toString(),
      adminName: log.adminName,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetName: log.targetName,
      details: log.details || {},
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        pageSize: ADMIN_CONFIG.PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / ADMIN_CONFIG.PAGE_SIZE) || 1,
      },
    });
  } catch (error) {
    console.error("Failed to list activity logs:", error);
    return NextResponse.json({ error: "Failed to list activity logs" }, { status: 500 });
  }
}
