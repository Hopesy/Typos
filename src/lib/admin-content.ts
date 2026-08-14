import type { D1DatabaseLike } from "@/lib/database";
import { warmPostRenderCache, type TocItem } from "@/lib/content";
import { currentPostDate } from "@/lib/post-payload";
import { ADMIN_API_ERROR_MESSAGES, type AdminApiErrorCode } from "@/lib/admin-api-errors";

export type AdminContentType = "post" | "daily" | "moment" | "comment";
export type AdminEditableType = Exclude<AdminContentType, "comment">;

type AdminContentErrorCode = Extract<
  AdminApiErrorCode,
  "DATABASE_UNAVAILABLE" | "POST_SLUG_REQUIRED" | "POST_SLUG_EXISTS" | "POST_TARGET_SLUG_EXISTS"
>;

export class AdminContentError extends Error {
  constructor(
    readonly code: AdminContentErrorCode,
    readonly status: 400 | 409 | 503,
  ) {
    super(ADMIN_API_ERROR_MESSAGES[code]);
    this.name = "AdminContentError";
  }
}

export class AdminContentConflictError extends AdminContentError {
  constructor(code: "POST_SLUG_EXISTS" | "POST_TARGET_SLUG_EXISTS") {
    super(code, 409);
    this.name = "AdminContentConflictError";
  }
}

export type AdminItem = {
  filename: string;
  date: string;
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  slug?: string;
  imageUrl?: string;
  category?: string;
  cover?: string;
  nickname?: string;
  contact?: string;
  articleTitle?: string;
  created_at?: string;
  parent_id?: string | null;
  is_admin?: number;
};

type PostRow = {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  content: string;
  cover?: string;
};

type DailyRow = {
  filename: string;
  date: string;
  title?: string;
  content: string;
  image_url?: string;
  created_at?: string;
};

type MomentRow = {
  filename: string;
  title: string;
  date: string;
  image_url?: string;
  content: string;
};

type CommentRow = {
  id: string;
  slug: string;
  nickname: string;
  contact?: string;
  content: string;
  parent_id?: string | null;
  is_admin?: number;
  created_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function categoryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((category) => stringValue(category).trim())
      .filter(Boolean)
      .join(",");
  }
  return stringValue(value).trim();
}

function normalizeDate(value: unknown) {
  return stringValue(value).split("T")[0];
}

function safeSegment(value: string, fallback: string) {
  const segment = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return segment || fallback;
}

function safeMarkdownFilename(filename: string) {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? "";
  if (!base.endsWith(".md") || base.startsWith(".")) return "";
  return base;
}

function requireDatabase(db: D1DatabaseLike | null): D1DatabaseLike {
  if (!db) throw new AdminContentError("DATABASE_UNAVAILABLE", 503);
  return db;
}

export function isAdminContentType(value: string): value is AdminContentType {
  return value === "post" || value === "daily" || value === "moment" || value === "comment";
}

export function isAdminEditableType(value: string): value is AdminEditableType {
  return value === "post" || value === "daily" || value === "moment";
}

async function listDatabaseItems(db: D1DatabaseLike, type: AdminContentType): Promise<AdminItem[]> {
  if (type === "post") {
    const { results } = await db
      .prepare(
        "SELECT slug, title, date, description, category, content, cover FROM posts ORDER BY updated_at DESC, created_at DESC, slug DESC",
      )
      .all<PostRow>();
    return results.map((row) => ({ ...row, cover: row.cover || "", filename: `${row.slug}.md` }));
  }

  if (type === "daily") {
    const { results } = await db
      .prepare("SELECT filename, date, title, content, image_url, created_at FROM daily ORDER BY created_at DESC, date DESC")
      .all<DailyRow>();
    return results.map((row) => ({
      filename: row.filename,
      title: row.title || "",
      date: row.date,
      content: row.content,
      imageUrl: row.image_url || "",
      created_at: row.created_at,
    }));
  }

  if (type === "moment") {
    const { results } = await db
      .prepare("SELECT filename, title, date, image_url, content FROM moments ORDER BY date DESC")
      .all<MomentRow>();
    return results.map((row) => ({
      filename: row.filename,
      title: row.title || "",
      date: row.date,
      content: row.content,
      imageUrl: row.image_url || "",
    }));
  }

  const [{ results: comments }, { results: posts }, { results: daily }, { results: moments }] =
    await Promise.all([
      db
        .prepare(
          "SELECT id, slug, nickname, contact, content, parent_id, is_admin, created_at FROM comments ORDER BY created_at DESC",
        )
        .all<CommentRow>(),
      db.prepare("SELECT slug, title FROM posts").all<{ slug: string; title: string }>(),
      db.prepare("SELECT filename, date, title FROM daily").all<{ filename: string; date: string; title?: string }>(),
      db.prepare("SELECT filename, title FROM moments").all<{ filename: string; title: string }>(),
    ]);

  const titleMap: Record<string, string> = {};
  for (const row of posts) titleMap[row.slug] = row.title;
  for (const row of daily) titleMap[row.filename.replace(/\.md$/, "")] = row.title || row.date;
  for (const row of moments) titleMap[row.filename.replace(/\.md$/, "")] = row.title;

  return comments.map((row) => ({
    id: row.id,
    filename: row.id,
    slug: row.slug,
    nickname: row.nickname,
    contact: row.contact || "",
    content: row.content,
    parent_id: row.parent_id ?? null,
    is_admin: row.is_admin ? 1 : 0,
    created_at: row.created_at,
    date: row.created_at,
    articleTitle: titleMap[row.slug.replace(/\.md$/, "")] || row.slug,
  }));
}

export async function listAdminItems(db: D1DatabaseLike | null, type: AdminContentType) {
  return listDatabaseItems(requireDatabase(db), type);
}

export type SaveAdminItemOptions = {
  allowPostUpsert?: boolean;
};

async function saveDatabaseItem(
  db: D1DatabaseLike,
  type: AdminEditableType,
  data: unknown,
  options: SaveAdminItemOptions = {},
) {
  const payload = isRecord(data) ? data : {};

  if (type === "post") {
    const slug = safeSegment(stringValue(payload.slug) || stringValue(payload.filename).replace(/\.md$/, ""), "");
    if (!slug) throw new AdminContentError("POST_SLUG_REQUIRED", 400);

    const content = stringValue(payload.content);
    const originalSlug = safeSegment(stringValue(payload.filename).replace(/\.md$/, ""), "");
    const originalPost = originalSlug
      ? await db
          .prepare("SELECT date FROM posts WHERE slug = ?")
          .bind(originalSlug)
          .first<{ date: string }>()
      : null;
    const submittedDate = normalizeDate(payload.date);
    const originalDate = normalizeDate(originalPost?.date);
    const postDate = submittedDate || originalDate || currentPostDate();

    const values = [
      slug,
      stringValue(payload.title, slug),
      postDate,
      stringValue(payload.description),
      categoryValue(payload.category),
      content,
      stringValue(payload.cover),
    ];
    const isNewAdminPost = !originalSlug && !options.allowPostUpsert;
    const isSlugChange = Boolean(originalSlug && originalSlug !== slug);

    if (isNewAdminPost || isSlugChange) {
      const inserted = await db
        .prepare(
          `INSERT INTO posts (slug, title, date, description, category, content, cover, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))
           ON CONFLICT(slug) DO NOTHING
           RETURNING slug`,
        )
        .bind(...values)
        .first<{ slug: string }>();
      if (!inserted) {
        throw new AdminContentConflictError(
          isSlugChange ? "POST_TARGET_SLUG_EXISTS" : "POST_SLUG_EXISTS",
        );
      }
    } else {
      await db
        .prepare(
          `INSERT INTO posts (slug, title, date, description, category, content, cover, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))
           ON CONFLICT(slug) DO UPDATE SET
             title = excluded.title,
             date = excluded.date,
             description = excluded.description,
             category = excluded.category,
             content = excluded.content,
             cover = excluded.cover,
             updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')`,
        )
        .bind(...values)
        .run();
    }

    if (originalSlug && originalSlug !== slug) {
      await db.prepare("UPDATE comments SET slug = ? WHERE slug = ?").bind(slug, originalSlug).run();
      await db.prepare("DELETE FROM posts WHERE slug = ?").bind(originalSlug).run();
    }

    const prerendered = isRecord(payload.rendered)
      ? {
          html: typeof payload.rendered.html === "string" ? payload.rendered.html : undefined,
          toc: Array.isArray(payload.rendered.toc) ? (payload.rendered.toc as TocItem[]) : undefined,
        }
      : undefined;
    await warmPostRenderCache(db, slug, content, prerendered);
    return;
  }

  if (type === "daily") {
    const existingFilename = safeMarkdownFilename(stringValue(payload.filename));
    const date = normalizeDate(payload.date) || new Date().toISOString().slice(0, 10);
    const filename = existingFilename || `daily_${Date.now()}.md`;
    await db
      .prepare(
        `INSERT INTO daily (filename, date, title, content, image_url)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(filename) DO UPDATE SET
           date = excluded.date,
           title = excluded.title,
           content = excluded.content,
           image_url = excluded.image_url,
           updated_at = datetime('now')`,
      )
      .bind(filename, date, stringValue(payload.title), stringValue(payload.content), stringValue(payload.imageUrl))
      .run();
    return;
  }

  const timestamp = Date.now();
  const filename = safeMarkdownFilename(stringValue(payload.filename)) || `moment_${timestamp}.md`;
  await db
    .prepare(
      `INSERT INTO moments (filename, title, date, image_url, content)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(filename) DO UPDATE SET
         title = excluded.title,
         date = excluded.date,
         image_url = excluded.image_url,
         content = excluded.content,
         updated_at = datetime('now')`,
    )
    .bind(
      filename,
      stringValue(payload.title, `Moment_${timestamp}`),
      normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      stringValue(payload.imageUrl),
      stringValue(payload.content),
    )
    .run();
}

export async function saveAdminItem(
  db: D1DatabaseLike | null,
  type: AdminEditableType,
  data: unknown,
  options?: SaveAdminItemOptions,
) {
  await saveDatabaseItem(requireDatabase(db), type, data, options);
}

async function deleteDatabaseItem(db: D1DatabaseLike, type: AdminContentType, filename: string) {
  if (type === "post") {
    const slug = filename.replace(/\.md$/, "");
    await db.prepare("DELETE FROM comments WHERE slug = ?").bind(slug).run();
    await db.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
  } else if (type === "daily") {
    await db.prepare("DELETE FROM daily WHERE filename = ?").bind(filename).run();
  } else if (type === "moment") {
    await db.prepare("DELETE FROM moments WHERE filename = ?").bind(filename).run();
  } else {
    await db.prepare("DELETE FROM comments WHERE id = ?").bind(filename).run();
  }
}

export async function deleteAdminItem(db: D1DatabaseLike | null, type: AdminContentType, filename: string) {
  await deleteDatabaseItem(requireDatabase(db), type, filename);
}
