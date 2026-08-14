import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const TEMP_PREFIX = 'typos-migrations-';
const temporaryDirectories: string[] = [];

function createTemporaryDatabaseUrl() {
  const directory = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  temporaryDirectories.push(directory);
  return pathToFileURL(join(directory, 'typos.db')).href;
}

function runMigrations(databaseUrl: string) {
  const result = spawnSync(process.execPath, ['scripts/migrate.js'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Migration process failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return result.stdout;
}

function runDatabaseScript<T>(databaseUrl: string, script: string): T {
  const result = spawnSync(process.execPath, ['-e', script, databaseUrl], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Database helper failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout.trim()) as T;
}

afterEach(() => {
  const resolvedTempRoot = resolve(tmpdir()) + sep;
  for (const directory of temporaryDirectories.splice(0)) {
    const resolvedDirectory = resolve(directory);
    if (!resolvedDirectory.startsWith(resolvedTempRoot) || !basename(resolvedDirectory).startsWith(TEMP_PREFIX)) {
      throw new Error(`Refusing to remove unexpected test directory: ${resolvedDirectory}`);
    }
    rmSync(resolvedDirectory, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  }
});

describe('database migration runner', () => {
  it('applies all migrations to a fresh database and skips them on the second run', async () => {
    const databaseUrl = createTemporaryDatabaseUrl();
    const firstOutput = runMigrations(databaseUrl);
    const secondOutput = runMigrations(databaseUrl);
    const inspection = runDatabaseScript<{ migrations: string[]; adminTable: string | null; postsUpdatedIndex: string | null }>(databaseUrl, `
      const { createClient } = require('@libsql/client');
      const client = createClient({ url: process.argv[1] });
      Promise.all([
        client.execute('SELECT name FROM typos_migrations ORDER BY name'),
        client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'admin_login_attempts'"),
        client.execute("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_posts_updated_at'"),
      ]).then(([migrations, adminTable, postsUpdatedIndex]) => {
        console.log(JSON.stringify({
          migrations: migrations.rows.map((row) => String(row.name)),
          adminTable: adminTable.rows[0]?.name ?? null,
          postsUpdatedIndex: postsUpdatedIndex.rows[0]?.name ?? null,
        }));
        client.close();
      }).catch((error) => { console.error(error); process.exit(1); });
    `);

    expect(firstOutput).toContain('Running migration: 0004_admin_login_attempts.sql');
    expect(firstOutput).toContain('Running migration: 0005_posts_updated_at_index.sql');
    expect(secondOutput).toContain('Skipping migration: 0005_posts_updated_at_index.sql');
    expect(inspection.migrations).toEqual([
      '0001_init.sql',
      '0002_render_cache.sql',
      '0003_daily_fragments.sql',
      '0004_admin_login_attempts.sql',
      '0005_posts_updated_at_index.sql',
    ]);
    expect(inspection.adminTable).toBe('admin_login_attempts');
    expect(inspection.postsUpdatedIndex).toBe('idx_posts_updated_at');
  });

  it('registers historical migrations for an existing database without deleting daily data', async () => {
    const databaseUrl = createTemporaryDatabaseUrl();
    runDatabaseScript(databaseUrl, `
      const { createClient } = require('@libsql/client');
      const client = createClient({ url: process.argv[1] });
      client.batch([
        "CREATE TABLE posts (slug TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
        'CREATE TABLE daily (filename TEXT PRIMARY KEY, content TEXT)',
        "INSERT INTO daily (filename, content) VALUES ('keep.md', 'preserve')",
      ]).then(() => { console.log(JSON.stringify({ ok: true })); client.close(); })
        .catch((error) => { console.error(error); process.exit(1); });
    `);

    const firstOutput = runMigrations(databaseUrl);
    const secondOutput = runMigrations(databaseUrl);
    const inspection = runDatabaseScript<{ migrations: string[]; daily: Array<{ filename: string; content: string }> }>(databaseUrl, `
      const { createClient } = require('@libsql/client');
      const client = createClient({ url: process.argv[1] });
      Promise.all([
        client.execute('SELECT name FROM typos_migrations ORDER BY name'),
        client.execute('SELECT filename, content FROM daily'),
      ]).then(([migrations, daily]) => {
        console.log(JSON.stringify({
          migrations: migrations.rows.map((row) => String(row.name)),
          daily: daily.rows.map((row) => ({ filename: String(row.filename), content: String(row.content) })),
        }));
        client.close();
      }).catch((error) => { console.error(error); process.exit(1); });
    `);

    expect(firstOutput).toContain('Registered historical migrations for the existing database.');
    expect(firstOutput).toContain('Running migration: 0002_render_cache.sql');
    expect(firstOutput).toContain('Running migration: 0004_admin_login_attempts.sql');
    expect(firstOutput).toContain('Running migration: 0005_posts_updated_at_index.sql');
    expect(secondOutput).toContain('Skipping migration: 0005_posts_updated_at_index.sql');
    expect(inspection.migrations).toEqual([
      '0001_init.sql',
      '0002_render_cache.sql',
      '0003_daily_fragments.sql',
      '0004_admin_login_attempts.sql',
      '0005_posts_updated_at_index.sql',
    ]);
    expect(inspection.daily).toEqual([{ filename: 'keep.md', content: 'preserve' }]);
  });
});
