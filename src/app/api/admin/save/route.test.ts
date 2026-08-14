import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requireAdmin: vi.fn(),
  saveAdminItem: vi.fn(),
}));

vi.mock('@/lib/database', () => ({ getDatabase: mocks.getDatabase }));
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/admin-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/admin-content')>();
  return { ...actual, saveAdminItem: mocks.saveAdminItem };
});

import { POST } from '@/app/api/admin/save/route';
import { AdminContentConflictError } from '@/lib/admin-content';

describe('admin save API errors', () => {
  beforeEach(() => {
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue({});
    mocks.saveAdminItem.mockResolvedValue(undefined);
  });

  it('returns a stable code and clear Chinese message for duplicate post slugs', async () => {
    mocks.saveAdminItem.mockRejectedValue(new AdminContentConflictError('POST_SLUG_EXISTS'));

    const response = await POST(new Request('http://localhost/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'post', data: { slug: 'existing-post' } }),
    }));

    expect(response.status).toBe(409);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      code: 'POST_SLUG_EXISTS',
      error: '该文章别名已存在，请更换别名后再发布。',
    });
  });

  it('rejects invalid content types without exposing an internal error', async () => {
    const response = await POST(new Request('http://localhost/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unknown', data: {} }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_CONTENT_TYPE',
      error: '内容类型无效，无法保存。',
    });
  });
});
