import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '@/lib/test-database';

const databaseMocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
}));

vi.mock('@/lib/database', () => ({ getDatabase: databaseMocks.getDatabase }));

import { getAllPosts } from '@/lib/content';

describe('public post ordering', () => {
  let close: () => void;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeEach(async () => {
    const testDatabase = createTestDatabase();
    db = testDatabase.db;
    close = () => testDatabase.client.close();
    databaseMocks.getDatabase.mockResolvedValue(db);
    await testDatabase.client.execute(`CREATE TABLE posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
  });

  afterEach(() => close());

  it('sorts same-day posts by updated_at and then created_at', async () => {
    await db.prepare(
      "INSERT INTO posts (slug, title, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind('older-update', 'Older update', '2026-08-14', '2026-08-14 09:00:00', '2026-08-14 10:00:00').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind('newer-created', 'Newer created', '2026-08-14', '2026-08-14 11:00:00', '2026-08-14 12:00:00').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind('older-created', 'Older created', '2026-08-14', '2026-08-14 08:00:00', '2026-08-14 12:00:00').run();

    const posts = await getAllPosts();

    expect(posts.map((post) => post.slug)).toEqual(['newer-created', 'older-created', 'older-update']);
  });

  it('hides admin-only posts from the public list after migration', async () => {
    await db.prepare('ALTER TABLE posts ADD COLUMN admin_only INTEGER NOT NULL DEFAULT 0').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, admin_only, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind('public-post', 'Public', '2026-08-14', 0, '2026-08-14 10:00:00', '2026-08-14 10:00:00').run();
    await db.prepare(
      "INSERT INTO posts (slug, title, date, admin_only, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind('admin-post', 'Admin only', '2026-08-14', 1, '2026-08-14 11:00:00', '2026-08-14 11:00:00').run();

    const posts = await getAllPosts();

    expect(posts.map((post) => post.slug)).toEqual(['public-post']);
  });
});
