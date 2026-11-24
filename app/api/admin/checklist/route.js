import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listChecklistItems, createChecklistItem } from "@/lib/admin/checklist";
import { validateChecklistInput } from "@/lib/admin/validators";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const items = await listChecklistItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to list checklist items:", error);
    return NextResponse.json({ error: "Failed to list checklist items" }, { status: 500 });
  }
}

export async function POST(request) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const validation = validateChecklistInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const item = await createChecklistItem(body, guard.adminId);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to create checklist item:", error);
    return NextResponse.json({ error: error.message || "Failed to create checklist item" }, { status: 400 });
  }
}
