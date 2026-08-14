import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  checkAdminLoginRateLimit,
  consumeCommentRateLimit,
  recordAdminLoginFailure,
} from '@/lib/request-security';
import { createTestDatabase } from '@/lib/test-database';

describe('request security rate limits', () => {
  let close: () => void;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeEach(async () => {
    const testDatabase = createTestDatabase();
    db = testDatabase.db;
    close = () => testDatabase.client.close();
    await testDatabase.client.batch([
      'CREATE TABLE rate_limits (ip_address TEXT PRIMARY KEY, last_comment_at INTEGER NOT NULL)',
      `CREATE TABLE admin_login_attempts (
        ip_address TEXT PRIMARY KEY,
        failed_count INTEGER NOT NULL DEFAULT 0,
        window_started_at INTEGER NOT NULL,
        blocked_until INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ]);
  });

  afterEach(() => close());

  it('rejects a second comment inside the window and allows it after expiry', async () => {
    const now = 1_000_000;
    expect(await consumeCommentRateLimit(db, '203.0.113.1', now)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    const denied = await consumeCommentRateLimit(db, '203.0.113.1', now + 1_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBe(59);
    expect(await consumeCommentRateLimit(db, '203.0.113.1', now + 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });

  it('blocks the address on the fifth failed admin login', async () => {
    const now = 2_000_000;
    for (let failure = 1; failure < 5; failure += 1) {
      expect((await recordAdminLoginFailure(db, '203.0.113.2', now + failure)).blocked).toBe(false);
    }

    const fifth = await recordAdminLoginFailure(db, '203.0.113.2', now + 5);
    expect(fifth.blocked).toBe(true);
    expect(fifth.retryAfterSeconds).toBe(900);
    const status = await checkAdminLoginRateLimit(db, '203.0.113.2', now + 6);
    expect(status.allowed).toBe(false);
    expect(status.retryAfterSeconds).toBe(900);
  });
});
