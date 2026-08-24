import { NextResponse } from 'next/server';
import matter from 'gray-matter';
import { getDatabase } from '@/lib/database';
import { requireAdmin } from '@/lib/admin-auth';
import { adminApiError, type AdminApiErrorCode } from '@/lib/admin-api-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminType = 'post' | 'daily' | 'moment';

type DownloadResult = { markdown: string; title: string };

const str = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

function isMissingAdminOnlyColumnError(error: unknown) {
  return error instanceof Error && /(?:no such column:\s*admin_only|no column named admin_only)/i.test(error.message);
}

function errorResponse(code: AdminApiErrorCode, status: number) {
  return NextResponse.json(adminApiError(code), {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

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
      adminOnly: Number(row.admin_only) === 1,
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
    let row;
    try {
      row = await db
        .prepare('SELECT slug, title, date, description, category, content, cover, admin_only FROM posts WHERE slug = ?')
        .bind(slug)
        .first();
    } catch (error) {
      if (!isMissingAdminOnlyColumnError(error)) throw error;
      row = await db
        .prepare('SELECT slug, title, date, description, category, content, cover FROM posts WHERE slug = ?')
        .bind(slug)
        .first();
    }
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

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const filename = url.searchParams.get('filename');

  if (!type || !filename || !['post', 'daily', 'moment'].includes(type)) {
    return errorResponse('INVALID_DOWNLOAD_REQUEST', 400);
  }

  // filename is a single database identifier, never a path.
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return errorResponse('INVALID_FILENAME', 400);
  }

  try {
    const adminType = type as AdminType;
    const result = await fromDatabase(adminType, filename);

    if (result == null) {
      return errorResponse('CONTENT_NOT_FOUND', 404);
    }

    const downloadName = downloadFilename(result.title, filename);

    return new NextResponse(result.markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return errorResponse('DOWNLOAD_FAILED', 500);
  }
}
