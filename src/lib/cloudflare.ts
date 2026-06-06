import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Result<T> = {
  results: T[];
};

export type D1StatementLike = {
  bind: (...values: unknown[]) => D1StatementLike;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  run: () => Promise<unknown>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1StatementLike;
};

export type MonoTraceEnv = CloudflareEnv & {
  DB?: D1DatabaseLike;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  SITE_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

export async function getMonoTraceEnv(): Promise<MonoTraceEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as MonoTraceEnv;
  } catch {
    return {};
  }
}

export async function getDatabase(): Promise<D1DatabaseLike | null> {
  const env = await getMonoTraceEnv();
  return env.DB ?? null;
}

export function readRuntimeEnv(env: MonoTraceEnv, key: keyof MonoTraceEnv) {
  const value = env[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") {
    return process.env[String(key)] ?? "";
  }
  return "";
}
