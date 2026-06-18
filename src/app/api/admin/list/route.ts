import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminContentType, listAdminItems } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const typeParam = request.nextUrl.searchParams.get("type") || "post";
    const type = isAdminContentType(typeParam) ? typeParam : "post";
    const items = await listAdminItems(await getDatabase(), type);
    const response = NextResponse.json({ items });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    console.error("List error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
