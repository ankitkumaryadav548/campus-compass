import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { updateReport } from "@/lib/admin/reports";
import { validateReportActionInput } from "@/lib/admin/validators";

export async function PATCH(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateReportActionInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const report = await updateReport(id, body.action, body.adminNote, guard.adminId);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Failed to update report:", error);
    return NextResponse.json({ error: error.message || "Failed to update report" }, { status: 400 });
  }
}
