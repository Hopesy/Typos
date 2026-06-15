import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { getDatabase } from "@/lib/cloudflare";

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
  html: string;
  toc: TocItem[];
};

export type TimelineEntry = {
  date: string;
  title: string;
  image: string;
  html: string;
};

type HeadingNode = { depth?: number };
type ElementNode = {
  tagName?: string;
  properties?: Record<string, unknown>;
};

type FileSystemContent = {
  readdir: (path: string) => Promise<string[]>;
  readFile: (path: string, encoding: "utf8") => Promise<string>;
  access: (path: string) => Promise<void>;
  join: (...parts: string[]) => string;
};

async function getFileSystemContent(): Promise<FileSystemContent | null> {
  try {
    const [{ default: fs }, { default: path }] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);

    return {
      readdir: fs.readdir,
      readFile: fs.readFile,
      access: fs.access,
      join: path.join,
    };
  } catch {
    return null;
  }
}

function getContentRoot(fsContent: FileSystemContent) {
  return fsContent.join(process.cwd(), "content");
}

async function renderMarkdown(markdown: string) {
  const slugger = new GithubSlugger();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const toc: TocItem[] = [];

  visit(tree, "heading", (node: unknown) => {
    const heading = node as HeadingNode;
    const depth = typeof heading.depth === "number" ? heading.depth : 0;
    if (depth < 1 || depth > 4) return;
    const text = toString(node as never).trim();
    if (!text) return;
    toc.push({ depth, text, id: slugger.slug(text) });
  });

  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => (tree) => {
      visit(tree, "element", (node: unknown) => {
        const element = node as ElementNode;
        const properties = element.properties ?? {};
        element.properties = properties;
        const href = properties.href;
        if (element.tagName !== "a" || typeof href !== "string") return;
        if (!href.startsWith("http") && !href.startsWith("//")) return;
        properties.target = "_blank";
        properties.rel = "noopener noreferrer";
      });
    })
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown);

  return { html: html.toString(), toc };
}

function normalizeDate(value?: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  return "";
}

function safeDate(value?: unknown) {
  const normalized = normalizeDate(value);
  if (!normalized) return 0;

  if (/^\d{1,2}[.-]\d{1,2}$/.test(normalized)) {
    const [m, d] = normalized.split(/[.-]/).map(Number);
    const now = new Date();
    const date = new Date(now.getFullYear(), m - 1, d);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  if (/^\d{6}$/.test(normalized)) {
    const year = 2000 + Number.parseInt(normalized.slice(0, 2), 10);
    const month = Number.parseInt(normalized.slice(2, 4), 10) - 1;
    const day = Number.parseInt(normalized.slice(4, 6), 10);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  const ts = Date.parse(normalized);
  return Number.isNaN(ts) ? 0 : ts;
}

async function readMarkdownDir(type: "posts" | "daily" | "moments") {
  const fsContent = await getFileSystemContent();
  if (!fsContent) return [];

  const dir = fsContent.join(getContentRoot(fsContent), type);

  try {
    const files = await fsContent.readdir(dir);
    return Promise.all(
      files
        .filter((file) => file.endsWith(".md") && !file.startsWith("."))
        .map(async (file) => ({
          file,
          raw: await fsContent.readFile(fsContent.join(dir, file), "utf8"),
        })),
    );
  } catch {
    return [];
  }
}

export async function getPostSlugs() {
  const db = await getDatabase();
  if (db) {
    const { results } = await db.prepare("SELECT slug FROM posts").all<{ slug: string }>();
    return results.map((post) => post.slug);
  }

  const files = await readMarkdownDir("posts");
  return files.map(({ file }) => file.replace(/\.md$/, ""));
}

export async function getAllPosts(): Promise<PostListItem[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const { results } = await db
        .prepare("SELECT slug, title, date, description, category, cover FROM posts ORDER BY date DESC")
        .all<PostListItem>();
      return results;
    } catch (error) {
      // 数据库查询失败，降级到文件系统
      console.warn('Database query failed, falling back to filesystem:', error);
    }
  }

  const files = await readMarkdownDir("posts");
  const posts = files.map(({ file, raw }) => {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(raw);
    const date = normalizeDate(data.date);

    return {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      date,
      description:
        typeof data.description === "string"
          ? data.description
          : content.replace(/\s+/g, " ").trim().slice(0, 120),
      category: typeof data.category === "string" ? data.category : "",
      cover: typeof data.cover === "string" ? data.cover : undefined,
      _ts: safeDate(date),
    };
  });

  return posts
    .sort((a, b) => b._ts - a._ts)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      category: post.category,
      cover: post.cover,
    }));
}

export async function getPostBySlug(slug: string): Promise<PostDetail> {
  const db = await getDatabase();
  if (db) {
    try {
      const post = await db
        .prepare("SELECT slug, title, date, description, category, cover, content FROM posts WHERE slug = ?")
        .bind(slug)
        .first<PostListItem & { content: string }>();

      if (post) {
        const { html, toc } = await renderMarkdown(post.content);
        return { ...post, html, toc };
      }
    } catch (error) {
      // 数据库查询失败，降级到文件系统
      console.warn('Database query failed, falling back to filesystem:', error);
    }
  }

  const files = await readMarkdownDir("posts");
  const match = files.find(({ file }) => file.replace(/\.md$/, "") === slug);
  if (!match) throw new Error("Post not found");

  const { data, content } = matter(match.raw);
  const { html, toc } = await renderMarkdown(content);
  const date = normalizeDate(data.date);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date,
    description: typeof data.description === "string" ? data.description : "",
    category: typeof data.category === "string" ? data.category : "",
    html,
    toc,
  };
}

export async function getDailyEntries(): Promise<TimelineEntry[]> {
  const db = await getDatabase();
  if (db) {
    const { results } = await db
      .prepare("SELECT date, title, image_url, content FROM daily ORDER BY date DESC")
      .all<{ date: string; title: string; image_url: string; content: string }>();

    return Promise.all(
      results.map(async (entry) => ({
        date: entry.date,
        title: entry.title || "",
        image: entry.image_url || "",
        html: (await renderMarkdown(entry.content)).html,
      })),
    );
  }

  const files = await readMarkdownDir("daily");
  const entries = await Promise.all(
    files.map(async ({ file, raw }) => {
      const { data, content } = matter(raw);
      const date = normalizeDate(data.date) || file.replace(/\.md$/, "");
      return {
        date,
        title: typeof data.title === "string" ? data.title : "",
        image:
          typeof data.image === "string"
            ? data.image
            : typeof data.imageUrl === "string"
              ? data.imageUrl
              : "",
        html: (await renderMarkdown(content)).html,
        _ts: safeDate(date),
      };
    }),
  );

  return entries
    .sort((a, b) => b._ts - a._ts)
    .map((entry) => ({
      date: entry.date,
      title: entry.title,
      image: entry.image,
      html: entry.html,
    }));
}

export async function getMomentsEntries(): Promise<TimelineEntry[]> {
  const db = await getDatabase();
  if (db) {
    const { results } = await db
      .prepare("SELECT date, title, image_url, content FROM moments ORDER BY date DESC")
      .all<{ date: string; title: string; image_url: string; content: string }>();

    return Promise.all(
      results.map(async (entry) => ({
        date: entry.date,
        title: entry.title || "",
        image: entry.image_url || "",
        html: (await renderMarkdown(entry.content)).html,
      })),
    );
  }

  const files = await readMarkdownDir("moments");
  const entries = await Promise.all(
    files.map(async ({ file, raw }) => {
      const { data, content } = matter(raw);
      const date = normalizeDate(data.date) || file.replace(/\.md$/, "");
      return {
        date,
        title: typeof data.title === "string" ? data.title : "",
        image:
          typeof data.image === "string"
            ? data.image
            : typeof data.imageUrl === "string"
              ? data.imageUrl
              : "",
        html: (await renderMarkdown(content)).html,
        _ts: safeDate(date),
      };
    }),
  );

  return entries
    .sort((a, b) => b._ts - a._ts)
    .map((entry) => ({
      date: entry.date,
      title: entry.title,
      image: entry.image,
      html: entry.html,
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
  // 在开发环境优先使用文件系统，避免数据库缓存问题
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    const db = await getDatabase();
    if (db) {
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
  }

  // 从文件系统获取活动统计
  const [posts, daily, moments] = await Promise.all([
    readMarkdownDir("posts"),
    readMarkdownDir("daily"),
    readMarkdownDir("moments"),
  ]);

  const statsMap = new Map<string, ActivityStats>();

  const processFiles = (files: { file: string; raw: string }[], type: 'posts' | 'daily' | 'moments') => {
    files.forEach(({ raw }) => {
      const { data } = matter(raw);
      const date = normalizeDate(data.date);
      if (!date) return;

      if (!statsMap.has(date)) {
        statsMap.set(date, { date, posts: 0, daily: 0, moments: 0, total: 0 });
      }
      const stats = statsMap.get(date)!;
      stats[type] += 1;
      stats.total += 1;
    });
  };

  processFiles(posts, 'posts');
  processFiles(daily, 'daily');
  processFiles(moments, 'moments');

  return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
