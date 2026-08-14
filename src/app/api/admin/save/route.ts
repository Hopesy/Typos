import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminContentError, isAdminEditableType, saveAdminItem } from "@/lib/admin-content";
import { adminApiError } from "@/lib/admin-api-errors";

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
      const response = NextResponse.json(adminApiError("INVALID_CONTENT_TYPE"), { status: 400 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    await saveAdminItem(await getDatabase(), type, body.data);

    const response = NextResponse.json({ success: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    const knownError = error instanceof AdminContentError;
    if (!knownError) console.error("Save error:", error);
    const response = NextResponse.json(
      knownError ? adminApiError(error.code) : adminApiError("SAVE_FAILED"),
      { status: knownError ? error.status : 500 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
