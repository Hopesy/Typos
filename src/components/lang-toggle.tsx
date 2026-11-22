'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/locale';

export function LangToggle({ compact = false, appearance = 'panel' }: { compact?: boolean; appearance?: 'panel' | 'plain' }) {
  const locale = useLocale();
  const t = useTranslations('aria');
  const [isPending, startTransition] = useTransition();
  const isZh = locale === 'zh';
  const isPlain = appearance === 'plain';

  const toggleLang = () => {
    startTransition(() => {
      setUserLocale(isZh ? 'en' : 'zh');
    });
  };

  const segment = `flex items-center justify-center font-medium leading-none transition-colors ${isPlain ? 'text-xs' : compact ? 'h-6 w-7 text-[9px]' : 'h-7 w-8 text-[10px]'}`;
  const activeText = 'relative text-hud-strong';
  const inactiveText = isPlain ? 'relative text-hud-muted group-hover:text-hud-strong' : 'relative text-hud-dim group-hover:text-hud-muted';
  const textClass = isPlain ? 'inline-flex leading-none' : 'inline-flex translate-y-px leading-none';

  return (
    <button
      type="button"
      onClick={toggleLang}
      disabled={isPending}
      aria-label={t('langSwitch')}
      title={isZh ? 'English' : '中文'}
      className={`group relative inline-flex shrink-0 items-center transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong ${isPlain ? 'h-9 w-[58px] justify-center gap-1 rounded-lg font-sans hover:bg-hud-soft' : `rounded-md border border-hud-line bg-hud-panel p-0.5 font-mono hover:border-hud-line-strong ${compact ? 'h-7' : 'h-8'}`}`}
    >
      {!isPlain && <span
        aria-hidden
        className={`absolute inset-y-0.5 left-0.5 rounded bg-hud-soft shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${compact ? 'w-7' : 'w-8'} ${isZh ? 'translate-x-0' : 'translate-x-full'}`}
      />}
      <span className={`${segment} ${isZh ? activeText : inactiveText}`}>
        <span className={textClass}>中</span>
      </span>
      {isPlain && <span aria-hidden className="text-xs text-hud-faint">/</span>}
      <span className={`${segment} tracking-[0.08em] ${isZh ? inactiveText : activeText}`}>
        <span className={textClass}>EN</span>
      </span>
    </button>
  );
}
