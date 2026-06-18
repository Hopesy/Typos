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
