'use client';

import { useSyncExternalStore } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useTranslations } from 'next-intl';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'typos-theme';

function persistThemeCookie(theme: Theme) {
  document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  persistThemeCookie(theme);
}

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const nextTheme = event.newValue === 'light' ? 'light' : 'dark';
    applyTheme(nextTheme);
    onStoreChange();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('typos-theme-change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('typos-theme-change', onStoreChange);
  };
}

export function ThemeToggle({ compact = false, appearance = 'panel' }: { compact?: boolean; appearance?: 'panel' | 'plain' }) {
  const isPlain = appearance === 'plain';
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark');
  const t = useTranslations('aria');

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event('typos-theme-change'));
  };

  const Icon = theme === 'dark' ? FiSun : FiMoon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? t('themeToLight') : t('themeToDark')}
      title={theme === 'dark' ? 'Light' : 'Dark'}
      className={`inline-flex shrink-0 items-center justify-center transition-colors hover:text-hud-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong ${isPlain ? 'h-9 w-9 rounded-lg text-hud hover:bg-hud-soft' : `rounded-md border border-hud-line bg-hud-panel text-hud-muted hover:border-hud-line-strong ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}`}
    >
      <Icon className={isPlain || !compact ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={isPlain ? 1.7 : 2} />
    </button>
  );
}
