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

export type TyposEnv = CloudflareEnv & {
  DB?: D1DatabaseLike;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  SITE_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

export async function getTyposEnv(): Promise<TyposEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as TyposEnv;
  } catch {
    return {};
  }
}

export async function getDatabase(): Promise<D1DatabaseLike | null> {
  const env = await getTyposEnv();
  return env.DB ?? null;
}

export function readRuntimeEnv(env: TyposEnv, key: keyof TyposEnv) {
  const value = env[key];
  if (typeof value === "string") return value;
  if (typeof process !== "undefined") {
    return process.env[String(key)] ?? "";
  }
  return "";
}
