import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { extractBearerToken, verifyApiToken } from "@/lib/api-tokens";
import { saveAdminItem } from "@/lib/admin-content";
import { postPayloadFromJson, postPayloadFromMarkdown, type PostPayload } from "@/lib/post-payload";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json({ error: "API uploads require a configured database." }, { status: 503 }));
  }

  const token = extractBearerToken(request);
  if (!token) {
    return noStore(NextResponse.json({ error: "Missing Bearer token." }, { status: 401 }));
  }

  const record = await verifyApiToken(db, token);
  if (!record) {
    return noStore(NextResponse.json({ error: "Invalid or expired token." }, { status: 401 }));
  }

  try {
    const contentType = request.headers.get("Content-Type") ?? "";
    let payload: PostPayload;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return noStore(NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }));
      }
      payload = postPayloadFromJson(body as Record<string, unknown>);
    } else {
      const raw = await request.text();
      if (!raw.trim()) {
        return noStore(NextResponse.json({ error: "Empty request body." }, { status: 400 }));
      }
      payload = postPayloadFromMarkdown(raw);
    }

    if (!payload.content.trim()) {
      return noStore(NextResponse.json({ error: "Post content is required." }, { status: 400 }));
    }

    await saveAdminItem(db, "post", payload);

    return noStore(NextResponse.json({ success: true, slug: payload.slug }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
