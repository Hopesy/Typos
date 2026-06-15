import { NextResponse } from "next/server";
import matter from "gray-matter";
import { getDatabase } from "@/lib/cloudflare";
import { extractBearerToken, verifyApiToken } from "@/lib/api-tokens";
import { saveAdminItem } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/** Normalize category from string or array into a comma-separated string. */
function normalizeCategory(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item).trim()).filter(Boolean).join(", ");
  }
  return stringValue(value);
}

type PostPayload = {
  title: string;
  date: string;
  description: string;
  category: string;
  slug: string;
  cover: string;
  content: string;
};

function deriveSlug(explicit: string, date: string) {
  if (explicit.trim()) return explicit.trim();
  const normalized = (date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  return normalized.slice(2) || "post";
}

function firstHeading(content: string) {
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const heading = line.match(/^#\s+(.+)$/);
    if (heading?.[1]) return heading[1].trim();
  }
  return "";
}

/** Build a post payload from a JSON request body. */
function payloadFromJson(body: Record<string, unknown>): PostPayload {
  const date = stringValue(body.date).split("T")[0] || new Date().toISOString().slice(0, 10);
  const content = stringValue(body.content);
  return {
    title: stringValue(body.title) || firstHeading(content) || "Untitled",
    date,
    description: stringValue(body.description),
    category: normalizeCategory(body.category),
    slug: deriveSlug(stringValue(body.slug), date),
    cover: stringValue(body.cover),
    content,
  };
}

/** Build a post payload from a raw Markdown document (with optional frontmatter). */
function payloadFromMarkdown(raw: string): PostPayload {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content;
  const date = stringValue(data.date).split("T")[0] || new Date().toISOString().slice(0, 10);
  return {
    title: stringValue(data.title) || firstHeading(content) || "Untitled",
    date,
    description: stringValue(data.description),
    category: normalizeCategory(data.category ?? data.categories),
    slug: deriveSlug(stringValue(data.slug), date),
    cover: stringValue(data.cover),
    content,
  };
}

export async function POST(request: Request) {
  const db = await getDatabase();
  if (!db) {
    return noStore(NextResponse.json({ error: "API uploads require a D1 database." }, { status: 503 }));
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
      payload = payloadFromJson(body as Record<string, unknown>);
    } else {
      const raw = await request.text();
      if (!raw.trim()) {
        return noStore(NextResponse.json({ error: "Empty request body." }, { status: 400 }));
      }
      payload = payloadFromMarkdown(raw);
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
