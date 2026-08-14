import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '@/lib/test-database';

const databaseMocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  getTyposEnv: vi.fn(async () => ({})),
  readOptionalRuntimeEnv: vi.fn(() => ''),
}));

vi.mock('@/lib/database', () => databaseMocks);
vi.mock('@/lib/admin-auth', () => ({ isAdminRequest: vi.fn(async () => false) }));

import { GET, POST } from '@/app/api/comments/route';

describe('public comments API', () => {
  let close: (() => void) | undefined;

  afterEach(() => {
    close?.();
    close = undefined;
    vi.clearAllMocks();
  });

  it('does not expose the private contact field', async () => {
    const testDatabase = createTestDatabase();
    close = () => testDatabase.client.close();
    await testDatabase.client.batch([
      `CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        nickname TEXT NOT NULL,
        contact TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        parent_id TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `INSERT INTO comments (id, slug, nickname, contact, content, created_at)
       VALUES ('comment-1', 'post-1', 'Reader', 'private@example.com', 'Hello', '2026-08-14 12:00:00')`,
    ]);
    databaseMocks.getDatabase.mockResolvedValue(testDatabase.db);

    const response = await GET(new NextRequest('http://localhost/api/comments?slug=post-1'));
    const body = await response.json() as { comments: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(body.comments).toEqual([
      {
        id: 'comment-1',
        nickname: 'Reader',
        content: 'Hello',
        created_at: '2026-08-14 12:00:00',
        is_admin: 0,
        parent_id: null,
      },
    ]);
    expect(body.comments[0]).not.toHaveProperty('contact');
  });

  it('rejects comments for a missing post before consuming the rate limit', async () => {
    const testDatabase = createTestDatabase();
    close = () => testDatabase.client.close();
    await testDatabase.client.batch([
      'CREATE TABLE posts (slug TEXT PRIMARY KEY)',
      'CREATE TABLE rate_limits (ip_address TEXT PRIMARY KEY, last_comment_at INTEGER NOT NULL)',
    ]);
    databaseMocks.getDatabase.mockResolvedValue(testDatabase.db);

    const response = await POST(new NextRequest('http://localhost/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({ slug: 'missing-post', nickname: 'Reader', content: 'Hello' }),
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Post not found' });
    expect(await testDatabase.db.prepare('SELECT COUNT(*) AS count FROM rate_limits').first()).toEqual({ count: 0 });
  });
});
