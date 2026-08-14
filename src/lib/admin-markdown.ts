import matter from 'gray-matter';
import { firstMarkdownHeading } from '@/lib/post-payload';

export type PostData = {
  title: string;
  date: string;
  description: string;
  content: string;
  slug: string;
  category: string[];
  cover: string;
};

type DownloadableAdminItem = {
  filename: string;
  title?: string;
};

function stringValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function categoryValues(value: unknown) {
  if (Array.isArray(value)) return value.map(stringValue).map((item) => item.trim()).filter(Boolean);
  return stringValue(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function safeAdminSlug(value: string, fallback: string) {
  const slug = value
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.replace(/\.md$/i, '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || '';
  return slug || fallback;
}

function titleFromFilename(filename: string) {
  return filename
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.replace(/\.md$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim() || 'Untitled';
}

export function downloadNameFromItem(item: DownloadableAdminItem) {
  const title = (item.title || '').trim();
  if (!title) return item.filename;
  const safe = title
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[-.\s]+|[-.\s]+$/g, '')
    .trim();
  return safe ? `${safe}.md` : item.filename;
}

export function buildPostDataFromMarkdown(raw: string, filename: string, fallbackDate: string): PostData {
  const parsed = matter(raw.replace(/^\uFEFF/, ''));
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content;
  const fallbackSlug = fallbackDate.replace(/-/g, '').slice(2);
  const fileSlug = safeAdminSlug(filename, fallbackSlug);
  const categories = categoryValues(data.category ?? data.categories);
  const date = stringValue(data.date).split('T')[0] || fallbackDate;

  return {
    title: stringValue(data.title) || firstMarkdownHeading(content) || titleFromFilename(filename),
    date,
    description: stringValue(data.description),
    content: content.trimStart(),
    slug: safeAdminSlug(stringValue(data.slug) || fileSlug, fallbackSlug),
    category: categories.length > 0 ? categories : ['随笔'],
    cover: stringValue(data.cover),
  };
}
