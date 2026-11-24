import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { updateEvent, deleteEvent } from "@/lib/admin/events";
import { validateEventInput } from "@/lib/admin/validators";

export async function PATCH(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateEventInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const event = await updateEvent(id, body, guard.adminId);
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: error.message || "Failed to update event" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const result = await deleteEvent(id, guard.adminId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 400 });
  }
}
