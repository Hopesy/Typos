import { NextRequest, NextResponse } from "next/server";
import { getDatabase, getTyposEnv, readOptionalRuntimeEnv } from "@/lib/database";
import { isAdminRequest } from "@/lib/admin-auth";
import { consumeCommentRateLimit, getRequestAddress } from "@/lib/request-security";

export const dynamic = "force-dynamic";

type CommentBody = {
  slug?: unknown;
  pageTitle?: unknown;
  nickname?: unknown;
  contact?: unknown;
  content?: unknown;
  parent_id?: unknown;
  hp_check?: unknown;
};

type CommentRow = {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  is_admin: number;
  parent_id: string | null;
};

function asRecord(value: unknown): CommentBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as CommentBody;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ comments: [] });
  }

  try {
    const { results } = await db
      .prepare(
        "SELECT id, nickname, content, created_at, is_admin, parent_id FROM comments WHERE slug = ? ORDER BY created_at ASC",
      )
      .bind(slug)
      .all<CommentRow>();

    return NextResponse.json({ comments: results });
  } catch (error: unknown) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const env = await getTyposEnv();
    const db = await getDatabase();

    if (!db) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
    }

    const body = asRecord(await req.json());
    const slug = stringValue(body.slug);
    const pageTitle = stringValue(body.pageTitle);
    const nickname = stringValue(body.nickname);
    const contact = stringValue(body.contact);
    const content = stringValue(body.content);
    const parentId = stringValue(body.parent_id) || null;

    if (stringValue(body.hp_check)) {
      return NextResponse.json({ success: true });
    }

    if (!slug || !nickname || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (nickname.length > 80 || contact.length > 160) {
      return NextResponse.json({ error: "Identity fields are too long" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Comment too long" }, { status: 400 });
    }

    const post = await db
      .prepare("SELECT slug FROM posts WHERE slug = ?")
      .bind(slug)
      .first<{ slug: string }>();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = await isAdminRequest(req);

    if (!isAdmin) {
      const limit = await consumeCommentRateLimit(db, getRequestAddress(req));
      if (!limit.allowed) {
        const response = NextResponse.json(
          { error: `Too many comments. Please wait ${limit.retryAfterSeconds}s.` },
          { status: 429 },
        );
        response.headers.set("Retry-After", String(limit.retryAfterSeconds));
        return response;
      }
    }

    if (parentId) {
      const parent = await db
        .prepare("SELECT id FROM comments WHERE id = ? AND slug = ?")
        .bind(parentId, slug)
        .first<{ id: string }>();

      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO comments (id, slug, nickname, contact, content, parent_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, slug, nickname, contact, content, parentId, isAdmin ? 1 : 0)
      .run();

    const tgPrefix = ["TELEGRAM", "_"];
    const tgToken = readOptionalRuntimeEnv(env, [...tgPrefix, "BOT", "_", "TOKEN"]);
    const tgChatId = readOptionalRuntimeEnv(env, [...tgPrefix, "CHAT", "_", "ID"]);

    if (tgToken && tgChatId) {
      try {
        const { sendTelegramNotification } = await import("@/lib/telegram");
        const siteUrl = (readOptionalRuntimeEnv(env, ["SITE", "_", "URL"]) || new URL(req.url).origin).replace(/\/+$/, "");
        const title = pageTitle || slug;
        const message =
          `<b>New comment</b>\n\n` +
          `<b>Page:</b> <code>${escapeTelegramHtml(title)}</code>\n` +
          `<b>From:</b> ${escapeTelegramHtml(nickname)}${isAdmin ? " (admin)" : ""}\n` +
          `<b>Contact:</b> ${escapeTelegramHtml(contact || "-")}\n` +
          `<b>Content:</b>\n${escapeTelegramHtml(content)}\n\n` +
          `<a href="${siteUrl}/posts/${encodeURIComponent(slug)}">Open page</a>`;

        await sendTelegramNotification(tgToken, tgChatId, message);
      } catch (error) {
        console.error("Failed to send Telegram notification:", error);
      }
    }

    return NextResponse.json({ success: true, comment: { id } });
  } catch (error: unknown) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
