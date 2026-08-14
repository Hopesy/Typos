import type { Database } from "@/lib/database";

const COMMENT_WINDOW_MS = 60 * 1000;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_BLOCK_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_FAILURES = 5;

type AdminLoginAttemptRow = {
  failed_count: number;
  window_started_at: number;
  blocked_until: number;
};

function numericValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAddress(value: string | null) {
  const address = value?.split(",")[0]?.trim() || "unknown";
  return address.slice(0, 128);
}

export function getRequestAddress(request: Request) {
  return normalizeAddress(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for"),
  );
}

export async function consumeCommentRateLimit(
  db: Database,
  address: string,
  now = Date.now(),
) {
  const accepted = await db
    .prepare(
      `INSERT INTO rate_limits (ip_address, last_comment_at)
       VALUES (?, ?)
       ON CONFLICT(ip_address) DO UPDATE SET
         last_comment_at = excluded.last_comment_at
       WHERE rate_limits.last_comment_at <= ?
       RETURNING last_comment_at`,
    )
    .bind(address, now, now - COMMENT_WINDOW_MS)
    .first<{ last_comment_at: number }>();

  if (accepted) return { allowed: true, retryAfterSeconds: 0 };

  const current = await db
    .prepare("SELECT last_comment_at FROM rate_limits WHERE ip_address = ?")
    .bind(address)
    .first<{ last_comment_at: number }>();
  const elapsed = now - numericValue(current?.last_comment_at);
  const retryAfterSeconds = Math.max(1, Math.ceil((COMMENT_WINDOW_MS - elapsed) / 1000));
  return { allowed: false, retryAfterSeconds };
}

export async function checkAdminLoginRateLimit(
  db: Database,
  address: string,
  now = Date.now(),
) {
  const row = await db
    .prepare(
      "SELECT failed_count, window_started_at, blocked_until FROM admin_login_attempts WHERE ip_address = ?",
    )
    .bind(address)
    .first<AdminLoginAttemptRow>();
  const blockedUntil = numericValue(row?.blocked_until);

  if (blockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
  };
}

export async function recordAdminLoginFailure(
  db: Database,
  address: string,
  now = Date.now(),
) {
  const windowCutoff = now - ADMIN_LOGIN_WINDOW_MS;
  const blockedUntil = now + ADMIN_LOGIN_BLOCK_MS;
  const row = await db
    .prepare(
      `INSERT INTO admin_login_attempts (ip_address, failed_count, window_started_at, blocked_until)
       VALUES (?, 1, ?, 0)
       ON CONFLICT(ip_address) DO UPDATE SET
         failed_count = CASE
           WHEN admin_login_attempts.window_started_at <= ? THEN 1
           ELSE admin_login_attempts.failed_count + 1
         END,
         window_started_at = CASE
           WHEN admin_login_attempts.window_started_at <= ? THEN excluded.window_started_at
           ELSE admin_login_attempts.window_started_at
         END,
         blocked_until = CASE
           WHEN admin_login_attempts.blocked_until > ? THEN admin_login_attempts.blocked_until
           WHEN (
             CASE
               WHEN admin_login_attempts.window_started_at <= ? THEN 1
               ELSE admin_login_attempts.failed_count + 1
             END
           ) >= ? THEN ?
           ELSE 0
         END,
         updated_at = datetime('now')
       RETURNING failed_count, window_started_at, blocked_until`,
    )
    .bind(
      address,
      now,
      windowCutoff,
      windowCutoff,
      now,
      windowCutoff,
      ADMIN_LOGIN_MAX_FAILURES,
      blockedUntil,
    )
    .first<AdminLoginAttemptRow>();

  const actualBlockedUntil = numericValue(row?.blocked_until);
  return {
    blocked: actualBlockedUntil > now,
    retryAfterSeconds:
      actualBlockedUntil > now ? Math.max(1, Math.ceil((actualBlockedUntil - now) / 1000)) : 0,
  };
}

export async function clearAdminLoginFailures(db: Database, address: string) {
  await db.prepare("DELETE FROM admin_login_attempts WHERE ip_address = ?").bind(address).run();
}
