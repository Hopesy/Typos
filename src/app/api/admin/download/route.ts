import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { getDatabase } from '@/lib/database';

const ADMIN_SESSION_KEY = 'typos_admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminType = 'post' | 'daily' | 'moment';

type DownloadResult = { markdown: string; title: string };

const str = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

// 由标题构造下载文件名，清洗文件系统非法字符（保留中文），回退到原 filename。
function downloadFilename(title: string, fallback: string): string {
    const safe = title
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, ' ')
        .replace(/^[-.\s]+|[-.\s]+$/g, '')
        .trim();
    return safe ? `${safe}.md` : fallback;
}

// 由数据库行重建带 frontmatter 的 Markdown（字段与本地文件导出格式保持一致）。
function buildMarkdown(type: AdminType, row: Record<string, unknown>): string {
  const content = str(row.content);
  if (type === 'post') {
    return matter.stringify(content, {
      title: str(row.title),
      date: str(row.date),
      description: str(row.description),
      category: str(row.category),
      cover: str(row.cover),
    });
  }
  if (type === 'daily') {
    return matter.stringify(content, {
      date: str(row.date),
      title: str(row.title),
      imageUrl: str(row.image_url),
    });
  }
  return matter.stringify(content, {
    title: str(row.title),
    date: str(row.date),
    image: str(row.image_url),
  });
}

// 主路径：内容存储在数据库（本地 SQLite / Turso / D1）。
async function fromDatabase(type: AdminType, filename: string): Promise<DownloadResult | null> {
  const db = await getDatabase();
  if (!db) return null;

  if (type === 'post') {
    const slug = filename.replace(/\.md$/, '');
    const row = await db
      .prepare('SELECT slug, title, date, description, category, content, cover FROM posts WHERE slug = ?')
      .bind(slug)
      .first();
    return row ? { markdown: buildMarkdown('post', row), title: str(row.title) } : null;
  }

  if (type === 'daily') {
    const row = await db
      .prepare('SELECT filename, date, title, content, image_url FROM daily WHERE filename = ?')
      .bind(filename)
      .first();
    return row ? { markdown: buildMarkdown('daily', row), title: str(row.title) } : null;
  }

  const row = await db
    .prepare('SELECT filename, title, date, image_url, content FROM moments WHERE filename = ?')
    .bind(filename)
    .first();
  return row ? { markdown: buildMarkdown('moment', row), title: str(row.title) } : null;
}

// 回退路径：基于文件的本地内容目录（content/<dir>/<filename>）。
async function fromFileSystem(type: AdminType, filename: string): Promise<DownloadResult | null> {
  try {
    const [{ default: fs }, { default: path }] = await Promise.all([
      import('node:fs/promises'),
      import('node:path'),
    ]);
    const typeMap: Record<AdminType, string> = { post: 'posts', daily: 'daily', moment: 'moments' };
    const contentRoot = path.join(process.cwd(), 'content');
    const dirPath = path.normalize(path.join(contentRoot, typeMap[type]));
    const filePath = path.normalize(path.join(dirPath, filename));
    if (!filePath.startsWith(dirPath)) return null;
    const markdown = await fs.readFile(filePath, 'utf-8');
    return { markdown, title: str(matter(markdown).data.title) };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_KEY);

  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const filename = url.searchParams.get('filename');

  if (!type || !filename || !['post', 'daily', 'moment'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  // 阻止路径穿越（用于文件系统回退）
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const adminType = type as AdminType;
  const result = (await fromDatabase(adminType, filename)) ?? (await fromFileSystem(adminType, filename));

  if (result == null) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const downloadName = downloadFilename(result.title, filename);

  return new NextResponse(result.markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
