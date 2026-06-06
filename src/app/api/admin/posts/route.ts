import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminItems } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const posts = await listAdminItems(await getDatabase(), "post");
    const response = NextResponse.json({ posts });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    console.error("List posts error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
