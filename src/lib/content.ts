import { getDatabase } from "@/lib/database";

export type TocItem = { depth: number; text: string; id: string };

export type PostListItem = {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  cover?: string;
};

export type PostDetail = PostListItem & {
  content: string; // 原始 Markdown
};

export type TimelineEntry = {
  date: string;
  title: string;
  image: string;
  content: string; // 原始 Markdown
};

export async function getPostSlugs() {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }
  const { results } = await db.prepare("SELECT slug FROM posts").all<{ slug: string }>();
  return results.map((post) => post.slug);
}

export async function getAllPosts(): Promise<PostListItem[]> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }
  const { results } = await db
    .prepare("SELECT slug, title, date, description, category, cover FROM posts ORDER BY date DESC")
    .all<PostListItem>();
  return results;
}

export async function getPostBySlug(slug: string): Promise<PostDetail> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }

  const post = await db
    .prepare("SELECT slug, title, date, description, category, cover, content FROM posts WHERE slug = ?")
    .bind(slug)
    .first<PostDetail>();

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
}

// 正文内容哈希（FNV-1a，非加密、快速），仅用于检测内容是否变化以决定缓存命中。
export function hashContent(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

type CachedPostRow = PostDetail & {
  rendered_html?: string;
  rendered_toc?: string;
  render_hash?: string;
};

// 取文章并返回渲染结果，命中渲染缓存时跳过 Shiki/unified（避免 Workers CPU 超限 1102）。
// 缓存以正文哈希为键存于 posts 表；未命中才渲染并回写。旧库未跑迁移（缺列）时自动回退为无缓存渲染。
export async function getRenderedPost(
  slug: string
): Promise<{ post: PostDetail; html: string; toc: TocItem[] }> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }

  let row: CachedPostRow | null = null;
  let cacheColumnsExist = true;
  try {
    row = await db
      .prepare(
        "SELECT slug, title, date, description, category, cover, content, rendered_html, rendered_toc, render_hash FROM posts WHERE slug = ?"
      )
      .bind(slug)
      .first<CachedPostRow>();
  } catch {
    // 渲染缓存列不存在（迁移未执行）：回退到基础查询，本次照常渲染但不缓存。
    cacheColumnsExist = false;
    row = await db
      .prepare("SELECT slug, title, date, description, category, cover, content FROM posts WHERE slug = ?")
      .bind(slug)
      .first<CachedPostRow>();
  }

  if (!row) {
    throw new Error("Post not found");
  }

  const { rendered_html, rendered_toc, render_hash, ...post } = row;
  const hash = hashContent(post.content);

  // 命中缓存：直接返回，不跑高亮管线。
  if (cacheColumnsExist && rendered_html && render_hash === hash) {
    let toc: TocItem[] = [];
    try {
      toc = JSON.parse(rendered_toc || "[]") as TocItem[];
    } catch {
      toc = [];
    }
    return { post, html: rendered_html, toc };
  }

  // 未命中：动态引入渲染器（避免 Shiki 进入仅用列表数据的模块图）并回写缓存。
  const { renderArticle } = await import("@/components/markdown-renderer");
  const { html, toc } = await renderArticle(post.content);

  if (cacheColumnsExist) {
    try {
      await db
        .prepare("UPDATE posts SET rendered_html = ?, rendered_toc = ?, render_hash = ? WHERE slug = ?")
        .bind(html, JSON.stringify(toc), hash, slug)
        .run();
    } catch {
      // 回写失败不影响本次输出。
    }
  }

  return { post, html, toc };
}

// 保存时预渲染并写入 D1 渲染缓存（方案 C）：发布/更新文章后调用，
// 让首位访客也能直接命中缓存，文章页读取路径永不在 Worker 现场渲染（规避 1102）。
// 优先采用客户端已渲染好的 HTML/TOC（方案 B 预览复用同一管线，零 Worker CPU）；
// 缺省时回退为服务端渲染一次。任何失败都不抛出——读取路径仍可现场兜底。
export async function warmPostRenderCache(
  slug: string,
  content: string,
  prerendered?: { html?: string; toc?: TocItem[] }
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    let html = prerendered?.html;
    let toc = prerendered?.toc;

    // 没有可信的客户端渲染结果时，服务端渲染一次（保存动作低频，可接受这次 CPU）。
    if (typeof html !== "string" || !html) {
      const { renderArticle } = await import("@/components/markdown-renderer");
      const rendered = await renderArticle(content);
      html = rendered.html;
      toc = rendered.toc;
    }

    const hash = hashContent(content);
    await db
      .prepare("UPDATE posts SET rendered_html = ?, rendered_toc = ?, render_hash = ? WHERE slug = ?")
      .bind(html, JSON.stringify(toc ?? []), hash, slug)
      .run();
  } catch {
    // 渲染缓存列不存在（迁移未执行）或渲染失败：静默跳过，读取路径会按需现场渲染。
  }
}

export async function getDailyEntries(): Promise<TimelineEntry[]> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }

  const { results } = await db
    .prepare("SELECT date, title, image_url, content FROM daily ORDER BY date DESC")
    .all<{ date: string; title: string; image_url: string; content: string }>();

  return results.map((entry) => ({
    date: entry.date,
    title: entry.title || "",
    image: entry.image_url || "",
    content: entry.content,
  }));
}

export async function getMomentsEntries(): Promise<TimelineEntry[]> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }

  const { results } = await db
    .prepare("SELECT date, title, image_url, content FROM moments ORDER BY date DESC")
    .all<{ date: string; title: string; image_url: string; content: string }>();

  return results.map((entry) => ({
    date: entry.date,
    title: entry.title || "",
    image: entry.image_url || "",
    content: entry.content,
  }));
}

export type ActivityStats = {
  date: string;
  posts: number;
  daily: number;
  moments: number;
  total: number;
};

export async function getActivityStats(): Promise<ActivityStats[]> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database not available');
  }

  // 从数据库获取活动统计
  const postsQuery = await db.prepare("SELECT date, COUNT(*) as count FROM posts GROUP BY date").all<{ date: string; count: number }>();
  const dailyQuery = await db.prepare("SELECT date, COUNT(*) as count FROM daily GROUP BY date").all<{ date: string; count: number }>();
  const momentsQuery = await db.prepare("SELECT date, COUNT(*) as count FROM moments GROUP BY date").all<{ date: string; count: number }>();

  const statsMap = new Map<string, ActivityStats>();

  postsQuery.results.forEach(({ date, count }) => {
    if (!statsMap.has(date)) {
      statsMap.set(date, { date, posts: 0, daily: 0, moments: 0, total: 0 });
    }
    const stats = statsMap.get(date)!;
    stats.posts = count;
    stats.total += count;
  });

  dailyQuery.results.forEach(({ date, count }) => {
    if (!statsMap.has(date)) {
      statsMap.set(date, { date, posts: 0, daily: 0, moments: 0, total: 0 });
    }
    const stats = statsMap.get(date)!;
    stats.daily = count;
    stats.total += count;
  });

  momentsQuery.results.forEach(({ date, count }) => {
    if (!statsMap.has(date)) {
      statsMap.set(date, { date, posts: 0, daily: 0, moments: 0, total: 0 });
    }
    const stats = statsMap.get(date)!;
    stats.moments = count;
    stats.total += count;
  });

  return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
