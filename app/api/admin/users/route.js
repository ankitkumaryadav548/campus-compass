import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/guard";
import { listUsers } from "@/lib/admin/users";

export async function GET(request) {
  const guard = await assertAdminApi(request, { requireMutation: false });
  if (guard.error) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const senior = searchParams.get("senior");
    const status = searchParams.get("status");
    const country = searchParams.get("country");
    const page = searchParams.get("page") || 1;

    const result = await listUsers({ search, role, senior, status, country, page });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list users:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
