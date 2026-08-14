import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAdminItem } from '@/lib/admin-content';
import { createTestDatabase } from '@/lib/test-database';

vi.mock('@/lib/content', () => ({
  warmPostRenderCache: vi.fn().mockResolvedValue(undefined),
}));

describe('admin content persistence', () => {
  let close: () => void;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeEach(async () => {
    const testDatabase = createTestDatabase();
    db = testDatabase.db;
    close = () => testDatabase.client.close();
    await testDatabase.client.batch([
      `CREATE TABLE posts (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        cover TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        nickname TEXT NOT NULL,
        contact TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        parent_id TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE moments (
        filename TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ]);
  });

  afterEach(() => close());

  it('moves comments and deletes the old post when the slug changes', async () => {
    await db.prepare("INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)")
      .bind('old-slug', 'Old title', '2026-08-14', 'Old content')
      .run();
    await db.prepare("INSERT INTO comments (id, slug, nickname, content) VALUES (?, ?, ?, ?)")
      .bind('comment-1', 'old-slug', 'Reader', 'Hello')
      .run();

    await saveAdminItem(db, 'post', {
      filename: 'old-slug.md',
      slug: 'new-slug',
      title: 'New title',
      date: '2026-08-14',
      content: 'New content',
    });

    expect(await db.prepare('SELECT slug FROM posts WHERE slug = ?').bind('old-slug').first()).toBeNull();
    expect(await db.prepare('SELECT slug, title FROM posts WHERE slug = ?').bind('new-slug').first()).toEqual({ slug: 'new-slug', title: 'New title' });
    expect(await db.prepare('SELECT slug FROM comments WHERE id = ?').bind('comment-1').first()).toEqual({ slug: 'new-slug' });
  });

  it('updates a Moment by its original filename instead of inserting a duplicate', async () => {
    await saveAdminItem(db, 'moment', {
      filename: 'moment_1.md',
      title: 'Before',
      date: '2026-08-14',
      content: 'Old',
    });
    await saveAdminItem(db, 'moment', {
      filename: 'moment_1.md',
      title: 'After',
      date: '2026-08-15',
      content: 'New',
    });

    expect(await db.prepare('SELECT COUNT(*) AS count FROM moments').first()).toEqual({ count: 1 });
    expect(await db.prepare('SELECT filename, title, content FROM moments').first()).toEqual({ filename: 'moment_1.md', title: 'After', content: 'New' });
  });
});
