import { NextResponse } from "next/server";
import { getTyposEnv, readRuntimeEnv } from "@/lib/database";

const SESSION_COOKIE = "typos_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

async function timingSafeEqual(left: string, right: string) {
  try {
    const leftBytes = fromBase64Url(left);
    const rightBytes = fromBase64Url(right);
    return timingSafeBytesEqual(leftBytes, rightBytes);
  } catch {
    return false;
  }
}

function timingSafeBytesEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

async function timingSafeTextEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  return timingSafeBytesEqual(new Uint8Array(leftDigest), new Uint8Array(rightDigest));
}

async function getAdminConfig() {
  const env = await getTyposEnv();
  const password = readRuntimeEnv(env, "ADMIN_PASSWORD");
  const sessionSecret = readRuntimeEnv(env, "ADMIN_SESSION_SECRET");
  return { password, sessionSecret };
}

export async function verifyAdminPassword(candidate: string) {
  const { password } = await getAdminConfig();
  return Boolean(password) && await timingSafeTextEqual(candidate, password);
}

export async function createAdminSessionToken() {
  const { sessionSecret } = await getAdminConfig();
  if (!sessionSecret) throw new Error("ADMIN_SESSION_SECRET is not configured");

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp: expiresAt })));
  const signature = await sign(payload, sessionSecret);
  return `${payload}.${signature}`;
}

export async function isAdminRequest(request: Request) {
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const { sessionSecret } = await getAdminConfig();
  if (!sessionSecret) return false;

  const expected = await sign(payload, sessionSecret);
  if (!(await timingSafeEqual(signature, expected))) return false;

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const session = JSON.parse(decoded) as { exp?: number };
    return typeof session.exp === "number" && session.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin(request: Request) {
  if (await isAdminRequest(request)) return null;
  const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function shouldUseSecureCookie(request?: Request) {
  if (!request) {
    return typeof process !== "undefined" && process.env.NODE_ENV === "production";
  }
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0].trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export function setAdminCookie(response: NextResponse, token: string, request?: Request) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminCookie(response: NextResponse, request?: Request) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: 0,
  });
}
