import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdmin } from "@/lib/admin-auth";
import { createApiToken, deleteApiToken, listApiTokens } from "@/lib/api-tokens";

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
    return noStore(NextResponse.json({ error: "API tokens require a configured database." }, { status: 503 }));
  }

  try {
    const tokens = await listApiTokens(db);
    return noStore(NextResponse.json({ tokens }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json({ error: "API tokens require a configured database." }, { status: 503 }));
  }

  try {
    const body = asRecord(await request.json());
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return noStore(NextResponse.json({ error: "Token name is required." }, { status: 400 }));
    }

    const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
    const { token, record } = await createApiToken(db, name, expiresInDays);

    return noStore(NextResponse.json({ success: true, token, id: record.id }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json({ error: "API tokens require a configured database." }, { status: 503 }));
  }

  try {
    const body = asRecord(await request.json());
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return noStore(NextResponse.json({ error: "Token id is required." }, { status: 400 }));
    }

    await deleteApiToken(db, id);
    return noStore(NextResponse.json({ success: true }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
