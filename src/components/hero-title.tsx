'use client';

import { useSyncExternalStore } from 'react';
import Shuffle from './shuffle/Shuffle';

function readTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key !== 'typos-theme') return;
    onStoreChange();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener('typos-theme-change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('typos-theme-change', onStoreChange);
  };
}

export function HeroTitle() {
  return (
    <Shuffle
      text="Typos Blog"
      className="hero-title-style"
      shuffleDirection="right"
      duration={0.35}
      animationMode="evenodd"
      shuffleTimes={1}
      ease="power3.out"
      stagger={0.03}
      threshold={0.1}
      triggerOnce={true}
      triggerOnHover
      respectReducedMotion={true}
      loop={false}
      loopDelay={0}
      tag="h1"
    />
  );
}

export function HeroSubtitle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark');
  const text = theme === 'dark' ? 'The darkness is boundless' : 'The light is infinite';

  return (
    <Shuffle
      text={text}
      className="hero-subtitle-style"
      shuffleDirection="right"
      duration={0.35}
      animationMode="evenodd"
      shuffleTimes={1}
      ease="power3.out"
      stagger={0.03}
      threshold={0.1}
      triggerOnce={true}
      triggerOnHover
      respectReducedMotion={true}
      loop={false}
      loopDelay={0}
      tag="p"
    />
  );
}
