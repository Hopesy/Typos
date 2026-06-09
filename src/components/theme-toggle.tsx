'use client';

import { useSyncExternalStore } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'typos-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
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

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark');

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
      aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
      title={theme === 'dark' ? 'Light' : 'Dark'}
      className={`inline-flex items-center justify-center rounded-md border border-hud-line bg-hud-panel text-hud-muted transition-colors hover:border-hud-line-strong hover:text-hud-strong ${compact ? 'h-7 w-7' : 'h-8 w-8'
        }`}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </button>
  );
}
