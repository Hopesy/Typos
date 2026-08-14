import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/admin/download/route';

describe('admin download authentication', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rejects an arbitrary admin cookie instead of checking only for its presence', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', 'test-session-secret');
    const request = new Request('http://localhost/api/admin/download?type=post&filename=hello.md', {
      headers: { Cookie: 'typos_admin=fake.payload' },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: 'SESSION_EXPIRED',
      error: '登录状态已失效，请重新登录。',
    });
  });
});
