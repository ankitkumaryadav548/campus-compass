import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listNearbyForLabelling } from "@/lib/admin/foodLabels";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const radius = searchParams.get("radius");
    const search = searchParams.get("search");
    const unlabelledOnly = searchParams.get("unlabelledOnly") === "true";

    const places = await listNearbyForLabelling({ radius, search, unlabelledOnly });
    return NextResponse.json({ places });
  } catch (error) {
    console.error("Failed to list food places for labelling:", error);
    return NextResponse.json({ error: error.message || "Failed to list food places" }, { status: 500 });
  }
}
