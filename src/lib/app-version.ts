const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

export function normalizeVersion(raw?: string): string {
  const cleaned = raw?.trim().replace(/^v/i, '') ?? '';
  return SEMVER_PATTERN.test(cleaned) ? cleaned : '0.0.0';
}

export function normalizeCommitSha(raw?: string): string {
  const cleaned = raw?.trim() ?? '';
  return COMMIT_SHA_PATTERN.test(cleaned) ? cleaned.slice(0, 7).toLowerCase() : '';
}

export function formatVersionLabel(version: string): string {
  return `v${normalizeVersion(version)}`;
}

export function formatBuildInfo(version: string, commit?: string): string {
  const label = formatVersionLabel(version);
  const sha = normalizeCommitSha(commit);
  return sha ? `${label} (${sha})` : label;
}

export const APP_VERSION = normalizeVersion(process.env.NEXT_PUBLIC_APP_VERSION);
export const APP_COMMIT = normalizeCommitSha(process.env.NEXT_PUBLIC_APP_COMMIT);
export const APP_VERSION_LABEL = formatVersionLabel(APP_VERSION);
export const APP_BUILD_INFO = formatBuildInfo(APP_VERSION, APP_COMMIT);
