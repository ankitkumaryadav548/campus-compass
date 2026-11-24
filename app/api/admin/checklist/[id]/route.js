import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { updateChecklistItem, deleteChecklistItem } from "@/lib/admin/checklist";
import { validateChecklistInput } from "@/lib/admin/validators";

export async function PATCH(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateChecklistInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const item = await updateChecklistItem(id, body, guard.adminId);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to update checklist item:", error);
    return NextResponse.json({ error: error.message || "Failed to update checklist item" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const result = await deleteChecklistItem(id, guard.adminId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete checklist item:", error);
    return NextResponse.json({ error: error.message || "Failed to delete checklist item" }, { status: 400 });
  }
}
