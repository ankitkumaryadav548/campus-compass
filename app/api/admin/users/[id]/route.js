import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { setSenior, removeSenior, deactivateUser, reactivateUser } from "@/lib/admin/users";
import { validateUserActionInput } from "@/lib/admin/validators";

export async function PATCH(request, { params }) {
  const guard = await assertAdminApi(request, { requireMutation: true });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateUserActionInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    let user;
    if (body.action === "set_senior") {
      user = await setSenior(id, guard.adminId);
    } else if (body.action === "unset_senior") {
      user = await removeSenior(id, guard.adminId);
    } else if (body.action === "deactivate") {
      user = await deactivateUser(id, guard.adminId);
    } else if (body.action === "reactivate") {
      user = await reactivateUser(id, guard.adminId);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return NextResponse.json({ error: error.message || "Failed to update user status" }, { status: 400 });
  }
}
