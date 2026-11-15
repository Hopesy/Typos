export type HomeMusicTrack = {
  title: string;
  artist?: string;
  src?: string;
  sourceUrl?: string;
  credit?: string;
  creditUrl?: string;
};

// Public-domain recording with attribution; see public/audio/LICENSE.md.
// Set src to '' to return to the explicit unconfigured state.
export const HOME_MUSIC: HomeMusicTrack = {
  title: 'Moonlight Sonata · I',
  artist: 'Ludwig van Beethoven · Paul Pitman',
  src: '/audio/moonlight-sonata-paul-pitman.mp3',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27,_op._27_no._2_-_i._adagio_sostenuto.ogg',
  credit: 'Musopen',
  creditUrl: 'https://musopen.org/',
};

/** Accept only same-site relative URLs and explicit HTTP(S) URLs. */
export function musicUrl(value?: string): string | undefined {
  if (!value || value !== value.trim() || /[\u0000-\u001f\u007f\\]/.test(value)) return undefined;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.hostname && !url.username && !url.password ? value : undefined;
    } catch {
      return undefined;
    }
  }
  // A scheme, a protocol-relative URL, or a fragment alone is not a same-site path.
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//') || value.startsWith('#') || value.startsWith('?')) return undefined;
  return value;
}

export function formatMusicTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
