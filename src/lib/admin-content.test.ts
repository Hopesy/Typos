import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminItems, saveAdminItem } from '@/lib/admin-content';
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

  it('preserves the publication date and refreshes updated_at when an existing post is saved', async () => {
    await db.prepare("INSERT INTO posts (slug, title, date, content, updated_at) VALUES (?, ?, ?, ?, ?)")
      .bind('dated-post', 'Before', '2000-01-01', 'Old content', '2000-01-01 00:00:00')
      .run();

    await saveAdminItem(db, 'post', {
      filename: 'dated-post.md',
      slug: 'dated-post',
      title: 'After',
      date: '2000-01-01',
      content: 'New content',
    });

    const saved = await db
      .prepare('SELECT date, title, updated_at FROM posts WHERE slug = ?')
      .bind('dated-post')
      .first<{ date: string; title: string; updated_at: string }>();

    expect(saved).toMatchObject({ date: '2000-01-01', title: 'After' });
    expect(saved?.updated_at).not.toBe('2000-01-01 00:00:00');
  });

  it('orders admin posts by modification time with stable tie breakers', async () => {
    await db.prepare(
      "INSERT INTO posts (slug, title, date, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind('older-update', 'Older update', '2026-08-14', 'Old', '2026-08-14 09:00:00', '2026-08-14 10:00:00').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind('newer-created', 'Newer created', '2026-08-14', 'New', '2026-08-14 11:00:00', '2026-08-14 12:00:00').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind('older-created', 'Older created', '2026-08-14', 'New', '2026-08-14 08:00:00', '2026-08-14 12:00:00').run();

    const posts = await listAdminItems(db, 'post');

    expect(posts.map((post) => post.slug)).toEqual(['newer-created', 'older-created', 'older-update']);
  });

  it('rejects a duplicate slug for a new admin post without overwriting the existing post', async () => {
    await db.prepare("INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)")
      .bind('existing-post', 'Original', '2026-08-14', 'Original content')
      .run();

    await expect(saveAdminItem(db, 'post', {
      slug: 'existing-post',
      title: 'Replacement',
      date: '2026-08-14',
      content: 'Replacement content',
    })).rejects.toMatchObject({
      code: 'POST_SLUG_EXISTS',
      message: '该文章别名已存在，请更换别名后再发布。',
    });

    expect(await db.prepare('SELECT title, content FROM posts WHERE slug = ?').bind('existing-post').first())
      .toEqual({ title: 'Original', content: 'Original content' });
  });

  it('returns a distinct error code when an edited post changes to an occupied slug', async () => {
    await db.prepare("INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)")
      .bind('source-post', 'Source', '2026-08-14', 'Source content')
      .run();
    await db.prepare("INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)")
      .bind('occupied-post', 'Occupied', '2026-08-14', 'Occupied content')
      .run();

    await expect(saveAdminItem(db, 'post', {
      filename: 'source-post.md',
      slug: 'occupied-post',
      title: 'Renamed',
      date: '2026-08-14',
      content: 'Renamed content',
    })).rejects.toMatchObject({
      code: 'POST_TARGET_SLUG_EXISTS',
      message: '修改后的文章别名已被其他文章占用，请更换后再保存。',
    });

    expect(await db.prepare('SELECT title, content FROM posts WHERE slug = ?').bind('source-post').first())
      .toEqual({ title: 'Source', content: 'Source content' });
  });

  it('keeps explicit API slug uploads idempotent', async () => {
    await db.prepare("INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)")
      .bind('api-post', 'Before', '2026-08-14', 'Old content')
      .run();

    await saveAdminItem(db, 'post', {
      slug: 'api-post',
      title: 'After',
      date: '2026-08-15',
      content: 'New content',
    }, { allowPostUpsert: true });

    expect(await db.prepare('SELECT title, date, content FROM posts WHERE slug = ?').bind('api-post').first())
      .toEqual({ title: 'After', date: '2026-08-15', content: 'New content' });
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
