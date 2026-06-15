import type { D1DatabaseLike } from "@/lib/cloudflare";

const TOKEN_PREFIX = "typos_";
const RANDOM_BYTES = 32;

export type ApiTokenRecord = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

type ApiTokenRow = {
  id: string;
  name: string;
  token_hash: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: number;
};

function toHex(bytes: Uint8Array) {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

/** Generate a new random API token in `typos_<hex>` form. */
function generateTokenValue() {
  const bytes = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return `${TOKEN_PREFIX}${toHex(bytes)}`;
}

function rowToRecord(row: ApiTokenRow): ApiTokenRecord {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.token_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    isActive: row.is_active === 1,
  };
}

export async function listApiTokens(db: D1DatabaseLike): Promise<ApiTokenRecord[]> {
  const { results } = await db
    .prepare(
      "SELECT id, name, token_hash, token_prefix, created_at, last_used_at, expires_at, is_active FROM api_tokens ORDER BY created_at DESC",
    )
    .all<ApiTokenRow>();
  return results.map(rowToRecord);
}

/**
 * Create a new API token. Returns the plaintext token (shown only once) and its
 * stored record. `expiresInDays` of 0, null or undefined means the token never expires.
 */
export async function createApiToken(
  db: D1DatabaseLike,
  name: string,
  expiresInDays?: number | null,
): Promise<{ token: string; record: ApiTokenRecord }> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Token name is required.");

  const token = generateTokenValue();
  const tokenHash = await sha256Hex(token);
  const tokenPrefix = token.slice(0, TOKEN_PREFIX.length + 8);
  const id = crypto.randomUUID();

  let expiresAt: string | null = null;
  if (typeof expiresInDays === "number" && expiresInDays > 0) {
    const expiry = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    expiresAt = expiry.toISOString().replace("T", " ").slice(0, 19);
  }

  await db
    .prepare(
      "INSERT INTO api_tokens (id, name, token_hash, token_prefix, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, trimmedName, tokenHash, tokenPrefix, expiresAt)
    .run();

  const row = await db
    .prepare(
      "SELECT id, name, token_hash, token_prefix, created_at, last_used_at, expires_at, is_active FROM api_tokens WHERE id = ?",
    )
    .bind(id)
    .first<ApiTokenRow>();

  if (!row) throw new Error("Failed to create token.");

  return { token, record: rowToRecord(row) };
}

export async function deleteApiToken(db: D1DatabaseLike, id: string) {
  await db.prepare("DELETE FROM api_tokens WHERE id = ?").bind(id).run();
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt.replace(" ", "T") + "Z");
  if (Number.isNaN(timestamp)) return false;
  return timestamp <= Date.now();
}

/**
 * Verify a plaintext token against the database. Returns the matching record on
 * success, or null if the token is unknown, disabled, or expired. Updates
 * `last_used_at` on success.
 */
export async function verifyApiToken(
  db: D1DatabaseLike,
  token: string,
): Promise<ApiTokenRecord | null> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      "SELECT id, name, token_hash, token_prefix, created_at, last_used_at, expires_at, is_active FROM api_tokens WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<ApiTokenRow>();

  if (!row) return null;
  if (row.is_active !== 1) return null;
  if (isExpired(row.expires_at)) return null;

  await db
    .prepare("UPDATE api_tokens SET last_used_at = datetime('now') WHERE id = ?")
    .bind(row.id)
    .run();

  return rowToRecord(row);
}

/** Extract a Bearer token from the Authorization header. */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
