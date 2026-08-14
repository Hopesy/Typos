#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const { createClient } = require('@libsql/client');

const BASE_MIGRATION = '0001_init.sql';
const RENDER_CACHE_MIGRATION = '0002_render_cache.sql';
const DAILY_FRAGMENTS_MIGRATION = '0003_daily_fragments.sql';

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (quote && char === quote && next === quote) {
      current += char + next;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = quote === char ? null : quote || char;
    }

    if (char === ';' && !quote) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function createMigrationClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const dbPath = path.join(process.cwd(), 'data', 'typos.db');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    console.log(`Using local libSQL database: ${dbPath}`);
    return createClient({ url: `file:${dbPath}` });
  }

  if (databaseUrl.startsWith('libsql://')) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required for a libSQL database URL.');
    }
    console.log('Using remote libSQL database.');
    return createClient({ url: databaseUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  }

  if (databaseUrl.startsWith('file:') || databaseUrl.endsWith('.db')) {
    const url = databaseUrl.startsWith('file:') ? databaseUrl : `file:${databaseUrl}`;
    const filePath = databaseUrl.startsWith('file://')
      ? fileURLToPath(databaseUrl)
      : databaseUrl.replace(/^file:/, '');
    if (!filePath) throw new Error('Local database path is empty.');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    console.log(`Using configured local libSQL database: ${filePath}`);
    return createClient({ url });
  }

  throw new Error('Unsupported DATABASE_URL. Migrations support file:, local .db paths, and libsql:// only.');
}

async function initializeMigrationHistory(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS typos_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = await client.execute('SELECT name FROM typos_migrations');
  if (applied.rows.length > 0) return;

  const existingSchema = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'posts'",
  );
  if (existingSchema.rows.length === 0) return;

  const historicalMigrations = [BASE_MIGRATION, DAILY_FRAGMENTS_MIGRATION];
  const postColumns = await client.execute('PRAGMA table_info(posts)');
  const columnNames = new Set(postColumns.rows.map((row) => String(row.name)));
  if (['rendered_html', 'rendered_toc', 'render_hash'].every((name) => columnNames.has(name))) {
    historicalMigrations.push(RENDER_CACHE_MIGRATION);
  }

  for (const name of historicalMigrations) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO typos_migrations (name) VALUES (?)',
      args: [name],
    });
  }
  console.log('Registered historical migrations for the existing database.');
}

async function runMigration() {
  const client = await createMigrationClient();

  try {
    await initializeMigrationHistory(client);
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
    const appliedResult = await client.execute('SELECT name FROM typos_migrations');
    const applied = new Set(appliedResult.rows.map((row) => String(row.name)));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping migration: ${file}`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = splitSqlStatements(sql).map((statement) => ({ sql: statement, args: [] }));
      statements.push({ sql: 'INSERT INTO typos_migrations (name) VALUES (?)', args: [file] });
      await client.batch(statements, 'write');
    }

    console.log('Migrations completed successfully.');
  } finally {
    client.close();
  }
}

runMigration().catch((error) => {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
