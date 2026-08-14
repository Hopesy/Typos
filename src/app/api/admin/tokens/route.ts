import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";
import { createApiToken, deleteApiToken, listApiTokens } from "@/lib/api-tokens";
import { adminApiError } from "@/lib/admin-api-errors";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError("TOKEN_DATABASE_UNAVAILABLE"), { status: 503 }));
  }

  try {
    const tokens = await listApiTokens(db);
    return noStore(NextResponse.json({ tokens }));
  } catch (error: unknown) {
    console.error("List API tokens error:", error);
    return noStore(NextResponse.json(adminApiError("TOKEN_LIST_FAILED"), { status: 500 }));
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError("TOKEN_DATABASE_UNAVAILABLE"), { status: 503 }));
  }

  try {
    const body = asRecord(await request.json());
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return noStore(NextResponse.json(adminApiError("TOKEN_NAME_REQUIRED"), { status: 400 }));
    }

    const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
    const { token, record } = await createApiToken(db, name, expiresInDays);

    return noStore(NextResponse.json({ success: true, token, id: record.id }));
  } catch (error: unknown) {
    console.error("Create API token error:", error);
    return noStore(NextResponse.json(adminApiError("TOKEN_CREATE_FAILED"), { status: 500 }));
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json(adminApiError("TOKEN_DATABASE_UNAVAILABLE"), { status: 503 }));
  }

  try {
    const body = asRecord(await request.json());
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return noStore(NextResponse.json(adminApiError("TOKEN_ID_REQUIRED"), { status: 400 }));
    }

    await deleteApiToken(db, id);
    return noStore(NextResponse.json({ success: true }));
  } catch (error: unknown) {
    console.error("Delete API token error:", error);
    return noStore(NextResponse.json(adminApiError("TOKEN_DELETE_FAILED"), { status: 500 }));
  }
}
