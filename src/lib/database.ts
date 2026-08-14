import { getCloudflareContext } from "@opennextjs/cloudflare";

type QueryResult<T> = {
  results: T[];
};

export type Statement = {
  bind: (...values: unknown[]) => Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<QueryResult<T>>;
  run: () => Promise<unknown>;
};

export type Database = {
  prepare: (query: string) => Statement;
};

export type D1DatabaseLike = Database;

export type TyposEnv = CloudflareEnv & {
  DB?: Database;
  DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

type LibSqlClientModule = {
  createClient: (config: { url: string; authToken?: string }) => LibSqlClient;
};

type LibSqlClient = {
  execute: (statement: { sql: string; args: unknown[] }) => Promise<{
    rows: Record<string, unknown>[];
  }>;
};

async function importLibSqlClient(): Promise<LibSqlClientModule> {
  const { createRequire } = await import("node:module");
  const requireFromProject = createRequire(`${process.cwd()}/package.json`);
  return requireFromProject("@libsql/client") as LibSqlClientModule;
}

class LibSqlAdapter implements Database {
  constructor(private readonly client: LibSqlClient) {}

  prepare(query: string): Statement {
    let boundValues: unknown[] = [];
    const statement: Statement = {
      bind: (...values: unknown[]) => {
        boundValues = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => {
        const result = await this.client.execute({ sql: query, args: boundValues });
        return result.rows[0] ? ({ ...result.rows[0] } as T) : null;
      },
      all: async <T = Record<string, unknown>>() => {
        const result = await this.client.execute({ sql: query, args: boundValues });
        return {
          results: result.rows.map((row) => ({ ...row })) as T[],
        };
      },
      run: () => this.client.execute({ sql: query, args: boundValues }),
    };
    return statement;
  }
}

async function createLibSqlDatabase(url: string, authToken?: string) {
  const { createClient } = await importLibSqlClient();
  const client = createClient({ url, authToken });
  await client.execute({ sql: "SELECT 1", args: [] });
  return new LibSqlAdapter(client);
}

async function localFileConfig(value: string) {
  if (!value.startsWith("file:")) {
    return { filePath: value, url: `file:${value}` };
  }

  if (value.startsWith("file://")) {
    const { fileURLToPath } = await import("node:url");
    return { filePath: fileURLToPath(value), url: value };
  }

  return { filePath: value.slice("file:".length), url: value };
}

async function createLocalDatabase(value: string) {
  const { filePath, url } = await localFileConfig(value);
  if (!filePath) throw new Error("Local database path is empty.");
  const [{ mkdir }, { dirname }] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  await mkdir(dirname(filePath), { recursive: true });
  return createLibSqlDatabase(url);
}

export async function getTyposEnv(): Promise<TyposEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as TyposEnv;
  } catch {
    return {};
  }
}

export async function getDatabase(): Promise<Database | null> {
  const env = await getTyposEnv();

  if (env.DB && process.env.NODE_ENV !== "development") {
    return env.DB;
  }

  const databaseUrl = readRuntimeEnv(env, "DATABASE_URL");
  const tursoAuthToken = readRuntimeEnv(env, "TURSO_AUTH_TOKEN");

  if (!databaseUrl) {
    return createLocalDatabase("./data/typos.db");
  }

  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("neon://")) {
    throw new Error("PostgreSQL is not supported. Configure Cloudflare D1 or a libSQL database.");
  }

  if (databaseUrl.startsWith("libsql://")) {
    if (!tursoAuthToken) throw new Error("TURSO_AUTH_TOKEN is required for a libSQL database URL.");
    return createLibSqlDatabase(databaseUrl, tursoAuthToken);
  }

  if (databaseUrl.startsWith("file:") || databaseUrl.endsWith(".db")) {
    return createLocalDatabase(databaseUrl);
  }

  throw new Error("Unsupported DATABASE_URL. Use libsql:// or a local .db path.");
}

export function readRuntimeEnv(env: TyposEnv, key: keyof TyposEnv) {
  const value = env[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") return process.env[String(key)] ?? "";
  return "";
}

export function readOptionalRuntimeEnv(env: TyposEnv, parts: string[]) {
  const key = parts.join("");
  const value = (env as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") return process.env[key] ?? "";
  return "";
}
