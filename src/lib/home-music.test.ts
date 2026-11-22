import { describe, expect, it } from 'vitest';
import { formatMusicTime, HOME_MUSIC, musicUrl } from '@/lib/home-music';

describe('home music configuration', () => {
  it('uses the supplied same-site recording and still supports an unconfigured source', () => {
    expect(HOME_MUSIC.title).toBe('月亮之矢');
    expect(musicUrl(HOME_MUSIC.src)).toBe('/audio/yueliang-zhi-shi.mp3');
    expect(musicUrl('')).toBeUndefined();
  });

  it('allows relative paths and HTTP(S) URLs', () => {
    for (const url of ['/music/a.mp3', './a.mp3', '../a.mp3', 'music/a.mp3', 'https://example.com/a.mp3', 'http://example.com/a.mp3']) {
      expect(musicUrl(url)).toBe(url);
    }
  });

  it('rejects unsafe or ambiguous sources', () => {
    for (const url of ['', ' //example.com/a', '//example.com/a', '/\\example.com/a', 'javascript:alert(1)', 'data:audio/mp3;base64,AA', 'ftp://example.com/a', 'https://user:pass@example.com/a', 'https://', '#fragment', '?query', '/a\n.mp3']) {
      expect(musicUrl(url)).toBeUndefined();
    }
  });

  it('formats valid times and handles unavailable durations', () => {
    expect(formatMusicTime(0)).toBe('0:00');
    expect(formatMusicTime(65.9)).toBe('1:05');
    expect(formatMusicTime(3600)).toBe('60:00');
    expect(formatMusicTime(NaN)).toBe('0:00');
    expect(formatMusicTime(Infinity)).toBe('0:00');
    expect(formatMusicTime(-1)).toBe('0:00');
  });
});
