'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { HOME_MUSIC, musicUrl, type HomeMusicTrack } from '@/lib/home-music';

type PlaybackState = 'paused' | 'loading' | 'playing' | 'error' | 'ended';

export function HomeMusicPlayer({ track = HOME_MUSIC }: { track?: HomeMusicTrack }) {
  // A new source gets a fresh audio element and cancels the previous playback.
  return <MusicPlayer key={track.src ?? ''} track={track} />;
}

function MusicPlayer({ track }: { track: HomeMusicTrack }) {
  const t = useTranslations('music');
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantedRef = useRef(false);
  const requestRef = useRef(0);
  const pendingRef = useRef(false);
  const [state, setState] = useState<PlaybackState>('paused');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const src = musicUrl(track.src);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      wantedRef.current = false;
      requestRef.current += 1;
      audio?.pause();
    };
  }, []);

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
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (time / duration) * 100)) : 0;
  const ringRadius = state === 'playing' ? 11.25 : 9.25;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - progressPercent / 100);
  const tooltip = !src
    ? t('unconfigured')
    : `${action} · ${track.title}${track.artist ? ` — ${track.artist}` : ''}${track.credit ? ` (${track.credit})` : ''}`;

  return (
    <div className="relative flex h-5 min-w-0 max-w-full items-center font-mono text-hud normal-case tracking-normal">
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

      <button
        type="button"
        onClick={togglePlayback}
        disabled={!src}
        aria-pressed={active}
        aria-label={`${action}: ${track.title}`}
        title={tooltip}
        className={`group relative -my-0.5 inline-flex h-6 min-w-0 max-w-[14.5rem] items-center gap-2 rounded-[4px] pl-1 pr-2.5 text-left transition-colors duration-200 before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer ${
          state === 'playing'
            ? 'bg-hud-soft/80 text-hud-strong'
            : 'text-hud hover:bg-hud-soft/75 hover:text-hud-strong'
        }`}
      >
        <span
          aria-hidden="true"
          className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            state === 'playing'
              ? 'bg-hud-inverse text-hud-inverse-foreground shadow-[0_2px_8px_rgba(23,23,23,0.18)] dark:shadow-[0_0_12px_rgba(255,255,255,0.18)]'
              : state === 'error'
                ? 'bg-amber-500/12 text-amber-600 ring-1 ring-inset ring-amber-500/45 group-hover:ring-amber-500/75 dark:text-amber-400'
                : 'bg-hud-soft/80 text-hud-strong ring-1 ring-inset ring-hud-line-strong/80 group-hover:bg-hud-panel-strong group-hover:ring-hud-strong/50'
          }`}
        >
          {progressPercent > 0 && (
            <svg
              viewBox={state === 'playing' ? '0 0 24 24' : '0 0 20 20'}
              className={`pointer-events-none absolute -rotate-90 ${
                state === 'playing' ? '-inset-[1.5px] h-[23px] w-[23px]' : 'inset-0 h-5 w-5'
              }`}
            >
              {state === 'playing' && (
                <circle
                  cx="12"
                  cy="12"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  className="text-hud-line"
                />
              )}
              <circle
                cx={state === 'playing' ? 12 : 10}
                cy={state === 'playing' ? 12 : 10}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={state === 'playing' ? 1.25 : 1.5}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                className={`transition-[stroke-dashoffset] duration-200 ${
                  state === 'playing' ? 'text-emerald-500' : 'text-hud-strong'
                }`}
              />
            </svg>
          )}
          {state === 'loading' ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : state === 'playing' ? (
            <Pause className="h-2.5 w-2.5 fill-current" />
          ) : state === 'error' ? (
            <RotateCcw className="h-2.5 w-2.5" strokeWidth={2.2} />
          ) : (
            <Play className="h-2.5 w-2.5 translate-x-[0.5px] fill-current" />
          )}
        </span>

        <span className="text-trim-caps min-w-0 truncate py-[3px] text-[11px] leading-none tracking-[0.03em]">
          {track.title}
        </span>

        <span aria-hidden="true" className="inline-flex h-2.5 w-[7.5px] shrink-0 items-end gap-[1.5px] text-emerald-500">
          {state === 'playing' && (
            <>
              <span className="music-eq-bar" />
              <span className="music-eq-bar" />
              <span className="music-eq-bar" />
            </>
          )}
        </span>

        <span
          role="status"
          className={
            state === 'error'
              ? 'text-trim-caps shrink-0 py-[2px] text-[10px] leading-none text-amber-600 dark:text-amber-400'
              : 'sr-only'
          }
        >
          {status}
        </span>
      </button>
    </div>
  );
}
