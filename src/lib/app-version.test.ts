import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatBuildInfo,
  formatVersionLabel,
  normalizeCommitSha,
  normalizeVersion,
} from '@/lib/app-version';

describe('app version management', () => {
  it('keeps package.json and package-lock.json versions valid and synchronized', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      version: string;
    };
    const lock = JSON.parse(readFileSync(resolve(process.cwd(), 'package-lock.json'), 'utf8')) as {
      version: string;
      packages?: Record<string, { version?: string }>;
    };

    expect(normalizeVersion(pkg.version)).toBe(pkg.version);
    expect(pkg.version).not.toBe('0.0.0');
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages?.['']?.version).toBe(pkg.version);
  });

  it('normalizes SemVer strings and rejects malformed values', () => {
    expect(normalizeVersion('1.1.0')).toBe('1.1.0');
    expect(normalizeVersion('v1.2.3-beta.1')).toBe('1.2.3-beta.1');
    expect(normalizeVersion(' 2.0.0+build.5 ')).toBe('2.0.0+build.5');
    expect(normalizeVersion('')).toBe('0.0.0');
    expect(normalizeVersion('invalid')).toBe('0.0.0');
  });

  it('normalizes commit SHAs and formats display labels and build tooltips', () => {
    expect(normalizeCommitSha('2528E59abcdef')).toBe('2528e59');
    expect(normalizeCommitSha('short')).toBe('');
    expect(normalizeCommitSha('not-a-hex-sha')).toBe('');
    expect(formatVersionLabel('1.1.0')).toBe('v1.1.0');
    expect(formatBuildInfo('1.1.0', '2528E59123456')).toBe('v1.1.0 (2528e59)');
    expect(formatBuildInfo('1.1.0', '')).toBe('v1.1.0');
  });
});
