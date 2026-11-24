import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { reorderChecklist } from "@/lib/admin/checklist";

export async function POST(request) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const { orderedIds } = body || {};

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
    }

    const result = await reorderChecklist(orderedIds, guard.adminId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to reorder checklist:", error);
    return NextResponse.json({ error: error.message || "Failed to reorder checklist" }, { status: 400 });
  }
}
