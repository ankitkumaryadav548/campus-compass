import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { setGuideStatus } from "@/lib/admin/guides";

export async function POST(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body || {};

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const guide = await setGuideStatus(id, action, guard.adminId);
    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Failed to change guide status:", error);
    return NextResponse.json({ error: error.message || "Failed to change guide status" }, { status: 400 });
  }
}
