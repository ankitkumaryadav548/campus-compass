import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { previewVisibility } from "@/lib/admin/guides";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const visaType = searchParams.get("visaType");

    if (!country) {
      return NextResponse.json({ error: "Country parameter is required" }, { status: 400 });
    }

    const result = await previewVisibility({ country, visaType });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to preview visibility:", error);
    return NextResponse.json({ error: error.message || "Failed to preview visibility" }, { status: 500 });
  }
}
