import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '@/lib/test-database';
import {
  DEFAULT_HOME_STATUS,
  DEFAULT_HOME_TOOLS,
  deleteHomeItem,
  getAdminHomeData,
  getPublicHomeData,
  HomeManageError,
  reorderHomeItems,
  sanitizeHomeUrl,
  saveHomeBook,
  saveHomeStatus,
  saveHomeTool,
} from '@/lib/home-manage';

async function applyHomeMigration() {
  const { client, db } = createTestDatabase();
  const sql = readFileSync(resolve(process.cwd(), 'migrations/0007_home_manage.sql'), 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.execute(statement);
  }
  return { client, db };
}

describe('home manage data layer', () => {
  it('validates URLs strictly for links and covers', () => {
    expect(sanitizeHomeUrl('https://github.com/Hopesy/Eidos')).toBe('https://github.com/Hopesy/Eidos');
    expect(sanitizeHomeUrl('http://localhost:3000/posts/a')).toBe('http://localhost:3000/posts/a');
    expect(sanitizeHomeUrl('/posts/book-review')).toBe('/posts/book-review');
    expect(sanitizeHomeUrl('', { allowEmpty: true })).toBe('');
    expect(sanitizeHomeUrl('', { allowEmpty: false })).toBeNull();
    expect(sanitizeHomeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeHomeUrl('data:image/svg+xml,<svg/>')).toBeNull();
    expect(sanitizeHomeUrl('//evil.example/a')).toBeNull();
    expect(sanitizeHomeUrl('https://user:pass@example.com')).toBeNull();
  });

  it('loads seeded defaults after migration and persists status bar edits', async () => {
    const { client, db } = await applyHomeMigration();
    try {
      const initial = await getPublicHomeData(db);
      expect(initial.status).toEqual(DEFAULT_HOME_STATUS);
      expect(initial.tools.map((tool) => tool.id)).toEqual(['eidos', 'revitclaw', 'markdview', 'minolink']);
      expect(initial.books).toEqual([]);

      await saveHomeStatus(db, { text: 'READING', location: 'SHEN ZHEN' });
      const updated = await getPublicHomeData(db);
      expect(updated.status).toEqual({ text: 'READING', location: 'SHEN ZHEN' });

      await expect(saveHomeStatus(db, { text: '   ', location: 'GUANG ZHOU' })).rejects.toMatchObject({
        code: 'HOME_STATUS_INVALID',
        statusCode: 400,
      });
    } finally {
      client.close();
    }
  });

  it('supports tool create, visibility filtering, reorder, update, and delete', async () => {
    const { client, db } = await applyHomeMigration();
    try {
      const created = await saveHomeTool(db, {
        name: 'NewTool',
        descriptionZh: '测试工具',
        descriptionEn: 'Test tool',
        link: 'https://example.com/newtool',
        icon: 'terminal',
        visible: false,
      });

      const publicData = await getPublicHomeData(db);
      const adminData = await getAdminHomeData(db);
      expect(publicData.tools.some((item) => item.id === created.id)).toBe(false);
      expect(adminData.tools.some((item) => item.id === created.id)).toBe(true);

      await saveHomeTool(db, { ...created, visible: true });
      await reorderHomeItems(db, 'tool', [created.id, 'minolink', 'markdview', 'revitclaw', 'eidos']);
      const reordered = await getPublicHomeData(db);
      expect(reordered.tools[0]?.id).toBe(created.id);
      expect(reordered.tools[1]?.id).toBe('minolink');

      await deleteHomeItem(db, 'tool', created.id);
      const afterDelete = await getAdminHomeData(db);
      expect(afterDelete.tools.some((item) => item.id === created.id)).toBe(false);

      await expect(
        saveHomeTool(db, { name: 'Bad', link: 'javascript:alert(1)' }),
      ).rejects.toBeInstanceOf(HomeManageError);
    } finally {
      client.close();
    }
  });

  it('supports book create, status toggle, visibility filtering, reorder, and delete', async () => {
    const { client, db } = await applyHomeMigration();
    try {
      const bookA = await saveHomeBook(db, {
        title: '设计心理学',
        author: '唐纳德·诺曼',
        cover: 'https://example.com/cover-a.jpg',
        note: '关于日常物品的直觉与反馈。',
        link: '/posts/design-notes',
        status: 'reading',
        visible: true,
      });
      const bookB = await saveHomeBook(db, {
        title: '代码整洁之道',
        status: 'finished',
        visible: false,
      });

      const publicData = await getPublicHomeData(db);
      expect(publicData.books).toHaveLength(1);
      expect(publicData.books[0]?.id).toBe(bookA.id);
      expect(publicData.books[0]?.status).toBe('reading');

      const adminData = await getAdminHomeData(db);
      expect(adminData.books).toHaveLength(2);

      await saveHomeBook(db, { ...bookB, visible: true });
      await reorderHomeItems(db, 'book', [bookB.id, bookA.id]);
      const reordered = await getPublicHomeData(db);
      expect(reordered.books.map((item) => item.id)).toEqual([bookB.id, bookA.id]);

      await deleteHomeItem(db, 'book', bookA.id);
      await deleteHomeItem(db, 'book', bookB.id);
      expect((await getPublicHomeData(db)).books).toEqual([]);

      await expect(
        saveHomeBook(db, { title: 'Bad Cover', cover: 'data:text/html,hi' }),
      ).rejects.toMatchObject({ code: 'HOME_URL_INVALID', statusCode: 400 });
    } finally {
      client.close();
    }
  });

  it('falls back safely on public reads when migration 0007 is missing, but fails closed on admin access', async () => {
    const { client, db } = createTestDatabase();
    try {
      const publicData = await getPublicHomeData(db);
      expect(publicData.status).toEqual(DEFAULT_HOME_STATUS);
      expect(publicData.tools).toEqual(DEFAULT_HOME_TOOLS);
      expect(publicData.books).toEqual([]);

      await expect(getAdminHomeData(db)).rejects.toMatchObject({
        code: 'HOME_SCHEMA_MISSING',
        statusCode: 503,
      });
      await expect(saveHomeStatus(db, { text: 'READING', location: 'SHEN ZHEN' })).rejects.toMatchObject({
        code: 'HOME_SCHEMA_MISSING',
        statusCode: 503,
      });
    } finally {
      client.close();
    }
  });
});
