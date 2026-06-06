'use client';

import Shuffle from './shuffle/Shuffle';

export function HeroTitle() {
  return (
    <Shuffle
      text="Minimal Load"
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
  return (
    <Shuffle
      text="The darkness is boundless"
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
