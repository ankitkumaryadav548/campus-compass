import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listGuides, createGuide } from "@/lib/admin/guides";
import { validateGuideInput } from "@/lib/admin/validators";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const guides = await listGuides({ category, status, search });
    return NextResponse.json({ guides });
  } catch (error) {
    console.error("Failed to list guides:", error);
    return NextResponse.json({ error: "Failed to list guides" }, { status: 500 });
  }
}

export async function POST(request) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const validation = validateGuideInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const guide = await createGuide(body, guard.adminId);
    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    console.error("Failed to create guide:", error);
    return NextResponse.json({ error: error.message || "Failed to create guide" }, { status: 400 });
  }
}
