import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listReports } from "@/lib/admin/reports";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const reason = searchParams.get("reason");
    const page = searchParams.get("page") || 1;

    const result = await listReports({ status, reason, page });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list reports:", error);
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
  }
}
