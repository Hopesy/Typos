import matter from "gray-matter";
import type { D1DatabaseLike } from "@/lib/cloudflare";

export type AdminContentType = "post" | "daily" | "moment" | "comment";
export type AdminEditableType = Exclude<AdminContentType, "comment">;

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

type LocalContent = {
  fs: typeof import("node:fs/promises");
  path: typeof import("node:path");
  root: string;
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

function normalizeDate(value: unknown) {
  return stringValue(value).split("T")[0];
}

function sortTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
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

export function normalizeDailyDate(value: unknown) {
  const raw = normalizeDate(value);
  if (!raw) return new Date().toISOString().slice(0, 10);

  if (/^\d{1,2}[.-]\d{1,2}$/.test(raw)) {
    const [month, day] = raw.split(/[.-]/).map(Number);
    const year = new Date().getFullYear();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  if (/^\d{6}$/.test(raw)) {
    return `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}`;
  }

  return raw;
}

export function dailyFilenameFromDate(value: unknown) {
  const date = normalizeDailyDate(value);
  return `${date.replace(/-/g, "").slice(2)}.md`;
}

export function isAdminContentType(value: string): value is AdminContentType {
  return value === "post" || value === "daily" || value === "moment" || value === "comment";
}

export function isAdminEditableType(value: string): value is AdminEditableType {
  return value === "post" || value === "daily" || value === "moment";
}

async function getLocalContent(): Promise<LocalContent | null> {
  try {
    const [fs, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    return { fs, path, root: path.join(process.cwd(), "content") };
  } catch {
    return null;
  }
}

async function pathExists(fs: LocalContent["fs"], target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function localDir(local: LocalContent, type: AdminEditableType) {
  const folder = type === "moment" ? "moments" : type === "daily" ? "daily" : "posts";
  return local.path.join(local.root, folder);
}

async function readLocalMarkdown(local: LocalContent, type: AdminEditableType) {
  const dir = localDir(local, type);
  try {
    const files = await local.fs.readdir(dir);
    return Promise.all(
      files
        .filter((file) => file.endsWith(".md") && !file.startsWith("."))
        .map(async (file) => ({
          file,
          raw: await local.fs.readFile(local.path.join(dir, file), "utf8"),
        })),
    );
  } catch {
    return [];
  }
}

async function listLocalItems(type: AdminContentType): Promise<AdminItem[]> {
  if (type === "comment") return [];

  const local = await getLocalContent();
  if (!local) return [];

  const files = await readLocalMarkdown(local, type);
  const items = files.map(({ file, raw }) => {
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    if (type === "post") {
      const slug = file.replace(/\.md$/, "");
      const date = normalizeDate(data.date);
      return {
        filename: file,
        title: stringValue(data.title, slug),
        date,
        description: stringValue(data.description),
        category: stringValue(data.category),
        slug,
        content: parsed.content,
      };
    }

    if (type === "daily") {
      const date = normalizeDate(data.date) || file.replace(/\.md$/, "");
      return {
        filename: file,
        title: stringValue(data.title),
        date,
        content: parsed.content,
        imageUrl: stringValue(data.imageUrl) || stringValue(data.image),
      };
    }

    const date = normalizeDate(data.date);
    return {
      filename: file,
      title: stringValue(data.title, file),
      date,
      content: parsed.content,
      imageUrl: stringValue(data.imageUrl) || stringValue(data.image),
    };
  });

  return items.sort((left, right) => sortTimestamp(right.date) - sortTimestamp(left.date));
}

async function listD1Items(db: D1DatabaseLike, type: AdminContentType): Promise<AdminItem[]> {
  if (type === "post") {
    const { results } = await db
      .prepare("SELECT slug, title, date, description, category, content, cover FROM posts ORDER BY date DESC")
      .all<PostRow>();

    return results.map((row) => ({
      ...row,
      cover: row.cover || "",
      filename: `${row.slug}.md`,
    }));
  }

  if (type === "daily") {
    const { results } = await db
      .prepare("SELECT filename, date, title, content, image_url FROM daily ORDER BY date DESC")
      .all<DailyRow>();

    return results.map((row) => ({
      filename: row.filename,
      title: row.title || "",
      date: row.date,
      content: row.content,
      imageUrl: row.image_url || "",
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
  if (db) return listD1Items(db, type);
  return listLocalItems(type);
}

async function saveLocalItem(type: AdminEditableType, data: unknown) {
  const local = await getLocalContent();
  if (!local) throw new Error("No writable local content storage is available.");

  const payload = isRecord(data) ? data : {};
  const dir = localDir(local, type);
  await local.fs.mkdir(dir, { recursive: true });

  if (type === "post") {
    const date = normalizeDate(payload.date) || new Date().toISOString().slice(0, 10);
    const slug = safeSegment(stringValue(payload.slug) || date.replace(/-/g, "").slice(2), "post");
    const filename = safeMarkdownFilename(stringValue(payload.filename)) || `${slug}.md`;
    const filePath = local.path.join(dir, filename);

    const fileContent = matter.stringify(stringValue(payload.content), {
      title: stringValue(payload.title, slug),
      date,
      description: stringValue(payload.description),
      category: stringValue(payload.category),
      cover: stringValue(payload.cover),
    });

    await local.fs.writeFile(filePath, fileContent, "utf8");
    return;
  }

  if (type === "daily") {
    const date = normalizeDailyDate(payload.date);
    const filename = dailyFilenameFromDate(date);
    const filePath = local.path.join(dir, filename);
    const imageUrl = stringValue(payload.imageUrl);
    const content = stringValue(payload.content);
    let finalContent = content;

    if (await pathExists(local.fs, filePath)) {
      const existing = matter(await local.fs.readFile(filePath, "utf8"));
      finalContent = `${content}\n---\n${existing.content}`;
    }

    await local.fs.writeFile(
      filePath,
      matter.stringify(finalContent, { date, title: stringValue(payload.title), imageUrl }),
      "utf8",
    );
    return;
  }

  const timestamp = Date.now();
  const filename = safeMarkdownFilename(stringValue(payload.filename)) || `moment_${timestamp}.md`;
  const date = normalizeDate(payload.date) || new Date().toISOString().slice(0, 10);
  const fileContent = matter.stringify(stringValue(payload.content), {
    title: stringValue(payload.title, `Moment_${timestamp}`),
    date,
    image: stringValue(payload.imageUrl),
  });

  await local.fs.writeFile(local.path.join(dir, filename), fileContent, "utf8");
}

async function saveD1Item(db: D1DatabaseLike, type: AdminEditableType, data: unknown) {
  const payload = isRecord(data) ? data : {};

  if (type === "post") {
    const slug = safeSegment(stringValue(payload.slug) || stringValue(payload.filename).replace(/\.md$/, ""), "");
    if (!slug) throw new Error("Post slug is required.");

    await db
      .prepare(
        `INSERT INTO posts (slug, title, date, description, category, content, cover)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title,
           date = excluded.date,
           description = excluded.description,
           category = excluded.category,
           content = excluded.content,
           cover = excluded.cover,
           updated_at = datetime('now')`,
      )
      .bind(
        slug,
        stringValue(payload.title, slug),
        normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
        stringValue(payload.description),
        stringValue(payload.category),
        stringValue(payload.content),
        stringValue(payload.cover),
      )
      .run();
    return;
  }

  if (type === "daily") {
    const date = normalizeDailyDate(payload.date);
    const filename = dailyFilenameFromDate(date);
    const existing = await db
      .prepare("SELECT content FROM daily WHERE filename = ?")
      .bind(filename)
      .first<{ content: string }>();
    const content = stringValue(payload.content);
    const finalContent = existing?.content ? `${content}\n---\n${existing.content}` : content;

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
      .bind(filename, date, stringValue(payload.title), finalContent, stringValue(payload.imageUrl))
      .run();
    return;
  }

  const timestamp = Date.now();
  const filename = safeMarkdownFilename(stringValue(payload.filename)) || `moment_${timestamp}.md`;
  await db
    .prepare("INSERT INTO moments (filename, title, date, image_url, content) VALUES (?, ?, ?, ?, ?)")
    .bind(
      filename,
      stringValue(payload.title, `Moment_${timestamp}`),
      normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      stringValue(payload.imageUrl),
      stringValue(payload.content),
    )
    .run();
}

export async function saveAdminItem(db: D1DatabaseLike | null, type: AdminEditableType, data: unknown) {
  if (db) {
    await saveD1Item(db, type, data);
    return;
  }

  await saveLocalItem(type, data);
}

async function deleteLocalItem(type: AdminContentType, filename: string) {
  if (type === "comment") return;

  const local = await getLocalContent();
  if (!local) throw new Error("No writable local content storage is available.");

  const safeName = safeMarkdownFilename(filename);
  if (!safeName) throw new Error("Invalid filename.");

  const filePath = local.path.join(localDir(local, type), safeName);
  try {
    await local.fs.unlink(filePath);
  } catch (error) {
    if (!isRecord(error) || error.code !== "ENOENT") throw error;
  }
}

async function deleteD1Item(db: D1DatabaseLike, type: AdminContentType, filename: string) {
  if (type === "post") {
    await db.prepare("DELETE FROM posts WHERE slug = ?").bind(filename.replace(/\.md$/, "")).run();
  } else if (type === "daily") {
    await db.prepare("DELETE FROM daily WHERE filename = ?").bind(filename).run();
  } else if (type === "moment") {
    await db.prepare("DELETE FROM moments WHERE filename = ?").bind(filename).run();
  } else {
    await db.prepare("DELETE FROM comments WHERE id = ?").bind(filename).run();
  }
}

export async function deleteAdminItem(db: D1DatabaseLike | null, type: AdminContentType, filename: string) {
  if (db) {
    await deleteD1Item(db, type, filename);
    return;
  }

  await deleteLocalItem(type, filename);
}
