import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listEvents, createEvent } from "@/lib/admin/events";
import { validateEventInput } from "@/lib/admin/validators";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const events = await listEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to list events:", error);
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 });
  }
}

export async function POST(request) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const validation = validateEventInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const event = await createEvent(body, guard.adminId);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 400 });
  }
}
