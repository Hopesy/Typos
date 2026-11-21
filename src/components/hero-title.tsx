'use client';

import dynamic from 'next/dynamic';

// gsap 文字动画，仅客户端渲染：dynamic(ssr:false) 让 gsap 不进服务端 bundle。
const Shuffle = dynamic(() => import('./shuffle/Shuffle'), { ssr: false });

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
  return (
    <Shuffle
      text="Anchor for code & notes"
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
