'use client';

import dynamic from 'next/dynamic';
import { Component, useSyncExternalStore, type ReactNode } from 'react';
import './dither/Dither.css';

const Dither = dynamic(() => import('./dither/Dither'), { ssr: false });
const motionQuery = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function canAnimate() {
  return window.matchMedia(motionQuery).matches;
}

// A failed WebGL chunk must not take the rest of the homepage down.
class BackgroundBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HomeBackground() {
  const animate = useSyncExternalStore(subscribe, canAnimate, () => false);

  return (
    <div className="home-background" aria-hidden="true">
      {animate && (
        <BackgroundBoundary>
          <Dither />
        </BackgroundBoundary>
      )}
    </div>
  );
}
