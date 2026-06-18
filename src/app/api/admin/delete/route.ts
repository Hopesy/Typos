import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteAdminItem, isAdminContentType } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = asRecord(await request.json());
    const type = typeof body.type === "string" && isAdminContentType(body.type) ? body.type : null;
    const filename = typeof body.filename === "string" ? body.filename : "";

    if (!type || !filename) {
      const response = NextResponse.json({ error: "Missing type or filename" }, { status: 400 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    await deleteAdminItem(await getDatabase(), type, filename);

    const response = NextResponse.json({ success: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const response = NextResponse.json({ error: message }, { status: 500 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
