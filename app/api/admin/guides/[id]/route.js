import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { getGuide, updateGuide } from "@/lib/admin/guides";
import { validateGuideInput } from "@/lib/admin/validators";

export async function GET(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const guide = await getGuide(id);
    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }
    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Failed to fetch guide:", error);
    return NextResponse.json({ error: "Failed to fetch guide" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateGuideInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const guide = await updateGuide(id, body, guard.adminId);
    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Failed to update guide:", error);
    return NextResponse.json({ error: error.message || "Failed to update guide" }, { status: 400 });
  }
}
