/**
 * 数据库适配器 - 支持多种数据库
 *
 * 支持的数据库：
 * - Cloudflare D1（生产环境）
 * - Better-SQLite3（本地开发/测试）
 * - PostgreSQL（通过 Neon/Supabase）
 * - Turso（兼容 libSQL）
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

// 统一的查询结果类型
type QueryResult<T> = {
  results: T[];
};

// 统一的语句接口
export type Statement = {
  bind: (...values: unknown[]) => Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<QueryResult<T>>;
  run: () => Promise<unknown>;
};

// 统一的数据库接口
export type Database = {
  prepare: (query: string) => Statement;
};

// 类型别名，用于向后兼容
export type D1DatabaseLike = Database;

export type TyposEnv = CloudflareEnv & {
  DB?: Database;
  DATABASE_URL?: string; // PostgreSQL/Turso connection string
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

// PostgreSQL 适配器（使用 @neondatabase/serverless 或 postgres.js）
class PostgresAdapter implements Database {
  private client: any;
  private initPromise: Promise<void>;

  constructor(connectionString: string) {
    this.initPromise = this.initClient(connectionString);
  }

  private async initClient(connectionString: string) {
    try {
      // 尝试使用 Neon serverless
      const { neon } = await import('@neondatabase/serverless');
      this.client = neon(connectionString);
    } catch {
      try {
        // 备选：使用 postgres.js
        const postgres = (await import('postgres')).default;
        this.client = postgres(connectionString);
      } catch (error) {
        console.error('PostgreSQL client not available:', error);
      }
    }
  }

  prepare(query: string): Statement {
    const getClient = async () => {
      await this.initPromise;
      return this.client;
    };
    let boundValues: unknown[] = [];

    const statement: Statement = {
      bind: (...values: unknown[]) => {
        boundValues = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          // 转换 ?1, ?2 为 $1, $2
          const pgQuery = query.replace(/\?(\d+)/g, (_, num) => `$${num}`).replace(/\?/g, (_, i) => `$${i + 1}`);
          const result = await client(pgQuery, boundValues);
          return (result[0] as T) || null;
        } catch (error) {
          console.error('PostgreSQL first() error:', error);
          return null;
        }
      },
      all: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          const pgQuery = query.replace(/\?(\d+)/g, (_, num) => `$${num}`).replace(/\?/g, (_, i) => `$${i + 1}`);
          const results = await client(pgQuery, boundValues);
          return { results: results as T[] };
        } catch (error) {
          console.error('PostgreSQL all() error:', error);
          return { results: [] };
        }
      },
      run: async () => {
        try {
          const client = await getClient();
          const pgQuery = query.replace(/\?(\d+)/g, (_, num) => `$${num}`).replace(/\?/g, (_, i) => `$${i + 1}`);
          return await client(pgQuery, boundValues);
        } catch (error) {
          console.error('PostgreSQL run() error:', error);
          throw error;
        }
      },
    };
    return statement;
  }
}

// Turso 适配器
class TursoAdapter implements Database {
  private client: any;
  private initPromise: Promise<void>;

  constructor(url: string, authToken: string) {
    this.initPromise = this.initClient(url, authToken);
  }

  private async initClient(url: string, authToken: string) {
    try {
      const { createClient } = await import('@libsql/client');
      this.client = createClient({ url, authToken });
      console.log('[Turso] Connected');
    } catch (error) {
      console.error('Turso client not available:', error);
    }
  }

  prepare(query: string): Statement {
    const getClient = async () => {
      await this.initPromise;
      return this.client;
    };
    let boundValues: unknown[] = [];

    const statement: Statement = {
      bind: (...values: unknown[]) => {
        boundValues = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          const result = await client.execute({ sql: query, args: boundValues });
          return result.rows[0] ? ({ ...result.rows[0] } as T) : null;
        } catch (error) {
          console.error('Turso first() error:', error);
          return null;
        }
      },
      all: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          const result = await client.execute({ sql: query, args: boundValues });
          return { results: result.rows.map((row: Record<string, unknown>) => ({ ...row })) as T[] };
        } catch (error) {
          console.error('Turso all() error:', error);
          return { results: [] };
        }
      },
      run: async () => {
        try {
          const client = await getClient();
          return await client.execute({ sql: query, args: boundValues });
        } catch (error) {
          console.error('Turso run() error:', error);
          throw error;
        }
      },
    };
    return statement;
  }
}

// Local SQLite 适配器（使用 libsql 本地文件模式）
class LocalSQLiteAdapter implements Database {
  private client: any;
  private initPromise: Promise<void>;

  constructor(filePath: string = './data/typos.db') {
    this.initPromise = this.initClient(filePath);
  }

  private async initClient(filePath: string) {
    try {
      const { createClient } = await import('@libsql/client');
      const { mkdirSync } = await import('fs');
      const { dirname } = await import('path');

      // 确保目录存在
      mkdirSync(dirname(filePath), { recursive: true });

      this.client = createClient({
        url: `file:${filePath}`
      });
      console.log(`[Local SQLite] Connected to ${filePath}`);
    } catch (error) {
      console.error('Local SQLite client not available:', error);
    }
  }

  prepare(query: string): Statement {
    const getClient = async () => {
      await this.initPromise;
      return this.client;
    };
    let boundValues: unknown[] = [];

    const statement: Statement = {
      bind: (...values: unknown[]) => {
        boundValues = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          const result = await client.execute({ sql: query, args: boundValues });
          return result.rows[0] ? ({ ...result.rows[0] } as T) : null;
        } catch (error) {
          console.error('Local SQLite first() error:', error);
          return null;
        }
      },
      all: async <T = Record<string, unknown>>() => {
        try {
          const client = await getClient();
          const result = await client.execute({ sql: query, args: boundValues });
          return { results: result.rows.map((row: Record<string, unknown>) => ({ ...row })) as T[] };
        } catch (error) {
          console.error('Local SQLite all() error:', error);
          return { results: [] };
        }
      },
      run: async () => {
        try {
          const client = await getClient();
          return await client.execute({ sql: query, args: boundValues });
        } catch (error) {
          console.error('Local SQLite run() error:', error);
          throw error;
        }
      },
    };
    return statement;
  }
}

// 环境变量获取
export async function getTyposEnv(): Promise<TyposEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as TyposEnv;
  } catch {
    return {};
  }
}

// 自动检测并返回合适的数据库
export async function getDatabase(): Promise<Database | null> {
  const env = await getTyposEnv();

  // 1. 优先使用 Cloudflare D1（仅在生产环境）
  // 本地开发时跳过 D1，即使 env.DB 存在
  if (env.DB && process.env.NODE_ENV !== 'development') {
    console.log('[Database] Using Cloudflare D1');
    return env.DB;
  }

  // 2. 检查环境变量中的数据库配置
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (databaseUrl) {
    // PostgreSQL (neon:// or postgres://)
    if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('neon://')) {
      console.log('[Database] Using PostgreSQL');
      return new PostgresAdapter(databaseUrl);
    }

    // Turso (libsql://)
    if (databaseUrl.startsWith('libsql://') && tursoAuthToken) {
      console.log('[Database] Using Turso');
      return new TursoAdapter(databaseUrl, tursoAuthToken);
    }

    // Local file SQLite (file:// or direct path)
    if (databaseUrl.startsWith('file://') || databaseUrl.endsWith('.db')) {
      console.log('[Database] Using local SQLite file via libsql');
      const filePath = databaseUrl.replace('file://', '');
      return new LocalSQLiteAdapter(filePath);
    }
  }

  // 3. 本地开发默认使用 libsql 本地文件模式
  try {
    console.log('[Database] Using libsql in local file mode');
    return new LocalSQLiteAdapter('./data/typos.db');
  } catch (error) {
    console.error('[Database] Failed to initialize local SQLite:', error);
  }

  console.warn('[Database] No database configured');
  return null;
}

export function readRuntimeEnv(env: TyposEnv, key: keyof TyposEnv) {
  const value = env[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") {
    return process.env[String(key)] ?? "";
  }
  return "";
}

export function readOptionalRuntimeEnv(env: TyposEnv, parts: string[]) {
  const key = parts.join("");
  const value = (env as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") {
    return process.env[key] ?? "";
  }
  return "";
}
