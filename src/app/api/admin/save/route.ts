import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/cloudflare";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminEditableType, saveAdminItem } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = asRecord(await request.json());
    const type = typeof body.type === "string" && isAdminEditableType(body.type) ? body.type : null;

    if (!type) {
      const response = NextResponse.json({ error: "Invalid content type" }, { status: 400 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    await saveAdminItem(await getDatabase(), type, body.data);

    const response = NextResponse.json({ success: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    console.error("Save error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const response = NextResponse.json({ error: message }, { status: 500 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
