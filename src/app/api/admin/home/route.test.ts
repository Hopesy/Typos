import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '@/lib/test-database';
import type { Client } from '@libsql/client';

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/database', () => ({ getDatabase: mocks.getDatabase }));
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: mocks.requireAdmin }));

import { DELETE, GET, PUT } from '@/app/api/admin/home/route';

describe('admin home API route', () => {
  let client: Client | null = null;

  beforeEach(async () => {
    const created = createTestDatabase();
    client = created.client;
    const sql = readFileSync(resolve(process.cwd(), 'migrations/0007_home_manage.sql'), 'utf8');
    for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue(created.db);
  });

  afterEach(() => {
    client?.close();
    client = null;
  });

  it('rejects unauthenticated requests', async () => {
    mocks.requireAdmin.mockResolvedValue(
      NextResponse.json({ code: 'SESSION_EXPIRED', error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(new Request('http://localhost/api/admin/home'));
    expect(res.status).toBe(401);
  });

  it('supports GET, PUT (status/tool/book/reorder), and DELETE with no-store headers', async () => {
    const getRes = await GET(new Request('http://localhost/api/admin/home'));
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get('Cache-Control')).toBe('no-store');
    const initial = (await getRes.json()) as { status: { text: string; location: string }; tools: unknown[]; books: unknown[] };
    expect(initial.status).toEqual({ text: 'CODING', location: 'GUANG ZHOU' });
    expect(initial.tools).toHaveLength(4);
    expect(initial.books).toHaveLength(0);

    const statusRes = await PUT(
      new Request('http://localhost/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'status', data: { text: 'BUILDING', location: 'SHEN ZHEN' } }),
      }),
    );
    expect(statusRes.status).toBe(200);
    expect(statusRes.headers.get('Cache-Control')).toBe('no-store');
    const afterStatus = (await statusRes.json()) as { status: { text: string; location: string } };
    expect(afterStatus.status).toEqual({ text: 'BUILDING', location: 'SHEN ZHEN' });

    const bookRes = await PUT(
      new Request('http://localhost/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'book',
          data: { title: 'Clean Code', author: 'Robert C. Martin', status: 'reading', visible: true },
        }),
      }),
    );
    expect(bookRes.status).toBe(200);
    const afterBook = (await bookRes.json()) as { books: Array<{ id: string; title: string }> };
    expect(afterBook.books).toHaveLength(1);
    const bookId = afterBook.books[0]!.id;

    const delRes = await DELETE(
      new Request('http://localhost/api/admin/home', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'book', id: bookId }),
      }),
    );
    expect(delRes.status).toBe(200);
    expect(delRes.headers.get('Cache-Control')).toBe('no-store');
    const afterDel = (await delRes.json()) as { books: unknown[] };
    expect(afterDel.books).toHaveLength(0);
  });

  it('returns 400 on malformed JSON and 503 when migration 0007 is missing', async () => {
    const badJson = await PUT(
      new Request('http://localhost/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid',
      }),
    );
    expect(badJson.status).toBe(400);
    expect(badJson.headers.get('Cache-Control')).toBe('no-store');

    const fresh = createTestDatabase();
    mocks.getDatabase.mockResolvedValue(fresh.db);
    try {
      const missing = await GET(new Request('http://localhost/api/admin/home'));
      expect(missing.status).toBe(503);
      expect(missing.headers.get('Cache-Control')).toBe('no-store');
      await expect(missing.json()).resolves.toMatchObject({ code: 'HOME_SCHEMA_MISSING' });
    } finally {
      fresh.client.close();
    }
  });
});
