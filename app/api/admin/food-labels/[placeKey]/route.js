import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { setDietLabel } from "@/lib/admin/foodLabels";
import { validateFoodLabelInput } from "@/lib/admin/validators";

export async function PUT(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { placeKey } = await params;
    const body = await request.json();
    const validation = validateFoodLabelInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const updated = await setDietLabel(placeKey, body.label, guard.adminId);
    return NextResponse.json({ place: updated });
  } catch (error) {
    console.error("Failed to set diet label:", error);
    return NextResponse.json({ error: error.message || "Failed to set diet label" }, { status: 400 });
  }
}
