#!/usr/bin/env node

/**
 * 数据库迁移脚本
 *
 * 用法：
 *   node scripts/migrate.js          # 运行所有迁移
 *   node scripts/migrate.js init     # 仅初始化表结构
 */

const fs = require('fs');
const path = require('path');

async function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // 使用本地 SQLite (libsql)
    console.log('Using local SQLite database (libsql)...');
    const { createClient } = require('@libsql/client');
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'data', 'typos.db');

    // 确保目录存在
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const client = createClient({
      url: `file:${dbPath}`
    });

    return {
      exec: async (sql) => {
        // 分割并执行多条语句
        // 更智能的分割：跳过字符串内的分号
        const statements = [];
        let current = '';
        let inString = false;
        let stringChar = null;

        for (let i = 0; i < sql.length; i++) {
          const char = sql[i];
          const prevChar = i > 0 ? sql[i - 1] : '';

          if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              stringChar = null;
            }
          }

          if (char === ';' && !inString) {
            if (current.trim()) {
              statements.push(current.trim());
            }
            current = '';
          } else {
            current += char;
          }
        }

        // 添加最后一条语句
        if (current.trim()) {
          statements.push(current.trim());
        }

        // 执行所有语句
        for (const statement of statements) {
          if (statement) {
            try {
              await client.execute(statement);
            } catch (error) {
              console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
              throw error;
            }
          }
        }
      },
      close: () => client.close(),
    };
  }

  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('neon://')) {
    // PostgreSQL
    console.log('Using PostgreSQL database...');
    const postgres = require('postgres');
    const sql = postgres(databaseUrl);

    return {
      exec: async (query) => {
        await sql.unsafe(query);
      },
      close: () => sql.end(),
    };
  }

  if (databaseUrl.startsWith('libsql://')) {
    // Turso
    console.log('Using Turso database...');
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return {
      exec: async (query) => {
        await client.execute(query);
      },
      close: () => client.close(),
    };
  }

  throw new Error('Unsupported DATABASE_URL format');
}

async function runMigration() {
  const db = await getDatabase();

  try {
    const migrationFile = path.join(process.cwd(), 'migrations', '0001_init.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('Running migration: 0001_init.sql');
    await db.exec(sql);
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

runMigration();
