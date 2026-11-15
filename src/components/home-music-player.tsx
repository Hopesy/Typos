'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, ExternalLink, Music2, Pause, Play, RotateCcw } from 'lucide-react';
import { formatMusicTime, HOME_MUSIC, musicUrl, type HomeMusicTrack } from '@/lib/home-music';

type PlaybackState = 'paused' | 'loading' | 'playing' | 'error' | 'ended';

const buttonClass = 'relative inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-sm text-hud hover:text-hud-strong before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong disabled:cursor-not-allowed disabled:opacity-40';

export function HomeMusicPlayer({ track = HOME_MUSIC }: { track?: HomeMusicTrack }) {
  // A new source gets a fresh audio element and cancels the previous playback.
  return <MusicPlayer key={track.src ?? ''} track={track} />;
}

function MusicPlayer({ track }: { track: HomeMusicTrack }) {
  const t = useTranslations('music');
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const wantedRef = useRef(false);
  const requestRef = useRef(0);
  const pendingRef = useRef(false);
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<PlaybackState>('paused');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const src = musicUrl(track.src);
  const sourceUrl = musicUrl(track.sourceUrl);
  const creditUrl = musicUrl(track.creditUrl);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      wantedRef.current = false;
      requestRef.current += 1;
      audio?.pause();
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setExpanded(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setExpanded(false); expandRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [expanded]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (wantedRef.current) {
      wantedRef.current = false;
      requestRef.current += 1;
      pendingRef.current = false;
      audio.pause();
      setState('paused');
      return;
    }

    wantedRef.current = true;
    pendingRef.current = true;
    const request = ++requestRef.current;
    setState('loading');
    if (audio.ended) audio.currentTime = 0;
    // Reload after a media failure; the next play still originates from this click.
    if (audio.error) audio.load();
    try {
      await audio.play();
      if (request !== requestRef.current) {
        if (!wantedRef.current) audio.pause();
        return;
      }
      pendingRef.current = false;
      if (!wantedRef.current) audio.pause();
      else if (!audio.paused) setState('playing');
    } catch {
      if (request !== requestRef.current) return;
      pendingRef.current = false;
      wantedRef.current = false;
      setState('error');
    }
  }

  const active = state === 'playing' || state === 'loading';
  const status = !src ? t('unconfiguredShort') : t(state);
  const action = active ? t('pause') : state === 'error' ? t('retry') : t('play');
  const ActionIcon = active ? Pause : state === 'error' ? RotateCcw : Play;

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full font-mono text-hud normal-case tracking-normal">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlaying={() => {
          if (!wantedRef.current) { audioRef.current?.pause(); return; }
          setState('playing');
        }}
        onWaiting={() => { if (wantedRef.current) setState('loading'); }}
        onPause={() => {
          if (!pendingRef.current && wantedRef.current && !audioRef.current?.ended) {
            wantedRef.current = false;
            setState('paused');
          }
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          const next = event.currentTarget.duration;
          setDuration(Number.isFinite(next) && next > 0 ? next : 0);
        }}
        onEnded={() => { wantedRef.current = false; pendingRef.current = false; setState('ended'); }}
        onError={() => {
          if (!src) return;
          requestRef.current += 1;
          wantedRef.current = false;
          pendingRef.current = false;
          setState('error');
        }}
      />
      <div className="flex min-w-0 items-center gap-1">
        <button type="button" className={buttonClass} onClick={togglePlayback} disabled={!src} aria-label={action} title={action}>
          <ActionIcon aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          ref={expandRef}
          className="relative flex h-4 min-w-0 max-w-[12rem] items-center gap-1.5 rounded-sm text-left before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={expanded ? t('collapse') : t('expand')}
        >
          <Music2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-hud-muted" />
          <span className="min-w-0 truncate text-[11px] text-hud">{track.title}</span>
          <span className={state === 'loading' || state === 'error' ? 'shrink-0 text-[10px] text-hud-muted' : 'sr-only'}>{status}</span>
          {expanded ? <ChevronUp aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
        </button>
      </div>
      <div id={panelId} hidden={!expanded} className="absolute left-1/2 top-[calc(100%+12px)] z-30 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-sm border border-hud-line bg-background/95 p-3 text-left shadow-lg backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm text-hud-strong">{track.title}</p>
            {track.artist && <p className="mt-1 break-words text-xs text-hud-muted">{track.artist}</p>}
          </div>
          {sourceUrl && <a href={sourceUrl} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-xs text-hud underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong">{t('source')}<ExternalLink aria-hidden="true" className="h-3 w-3" /></a>}
        </div>
        {track.credit && creditUrl && <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs text-hud underline underline-offset-4">{t('recordingCredit', { name: track.credit })}</a>}
        <p role="status" className="mt-2 text-xs text-hud-muted">{!src ? t('unconfigured') : state === 'error' ? t('errorDetail') : status}</p>
        {src && <>
          <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums text-hud-muted">
            <span>{formatMusicTime(time)}</span>
            <input
              type="range" min="0" max={duration || 0} step="0.1" value={Math.min(time, duration)} disabled={!duration}
              aria-label={t('seek')} aria-valuetext={`${formatMusicTime(time)} / ${formatMusicTime(duration)}`}
              onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setTime(next); }}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong disabled:cursor-not-allowed"
            />
            <span>{formatMusicTime(duration)}</span>
          </div>
          <label className="flex items-center gap-3 text-xs text-hud-muted">
            <span>{t('volume')}</span>
            <input type="range" min="0" max="1" step="0.01" value={volume} aria-label={t('volume')}
              onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.volume = next; setVolume(next); }}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong"
            />
            <span className="w-9 text-right tabular-nums">{Math.round(volume * 100)}%</span>
          </label>
        </>}
      </div>
    </div>
  );
}
