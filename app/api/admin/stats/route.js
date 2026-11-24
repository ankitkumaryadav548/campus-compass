import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { getOverviewStats, getAttentionItems } from "@/lib/admin/stats";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const [stats, attention] = await Promise.all([
      getOverviewStats(),
      getAttentionItems(),
    ]);

    return NextResponse.json({ stats, attention });
  } catch (error) {
    console.error("Failed to load admin stats:", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
