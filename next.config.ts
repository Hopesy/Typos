import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import packageJson from "./package.json";
import { HOME_MUSIC, musicUrl } from "./src/lib/home-music";

initOpenNextCloudflareForDev();

function resolveCommitSha(): string {
  const fromEnv =
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    "";
  const cleanedEnv = fromEnv.trim().toLowerCase();
  if (/^[0-9a-f]{7,40}$/.test(cleanedEnv)) {
    return cleanedEnv.slice(0, 7);
  }
  try {
    const sha = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .toLowerCase();
    return /^[0-9a-f]{7,40}$/.test(sha) ? sha.slice(0, 7) : "";
  } catch {
    return "";
  }
}

const appVersion = packageJson.version;
const appCommit = resolveCommitSha();

const withNextIntl = createNextIntlPlugin();
const isDevelopment = process.env.NODE_ENV === "development";
const musicSource = musicUrl(HOME_MUSIC.src);
const musicOrigin = musicSource && /^https?:\/\//i.test(musicSource) ? new URL(musicSource).origin : '';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `media-src 'self'${musicOrigin ? ` ${musicOrigin}` : ''}`,
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_APP_COMMIT: appCommit,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
