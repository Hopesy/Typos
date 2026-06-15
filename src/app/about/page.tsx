"use client";

import { useMemo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { FiCommand, FiActivity, FiGlobe, FiCpu, FiMessageCircle } from "react-icons/fi";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiThreedotjs, SiFramer, SiVercel } from 'react-icons/si';
import _LogoLoop from '@/components/logo-loop/LogoLoop';
import { useTranslations } from 'next-intl';

type AboutItem = { label: string; value: string };
type AboutSectionData = {
  id: string;
  title: string;
  icon: ReactElement;
  content?: string[];
  items?: AboutItem[];
};

type LogoItem = { node: ReactElement; title: string; href: string };
type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  logoHeight?: number;
  gap?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
};

export default function AboutPage() {
  const t = useTranslations('about');

  const sections: AboutSectionData[] = [
    {
      id: "INTEL_SOURCE",
      title: t('intel.title'),
      icon: <FiGlobe className="w-4 h-4" />,
      content: t.raw('intel.body') as string[],
    },
    {
      id: "SYSTEM_CORE",
      title: t('core.title'),
      icon: <FiCpu className="w-4 h-4" />,
      content: t.raw('core.body') as string[],
    },
    {
      id: "BUILD_PROCESS",
      title: t('build.title'),
      icon: <FiActivity className="w-4 h-4" />,
      content: t.raw('build.body') as string[],
    },
    {
      id: "COMM_PORT",
      title: t('comm.title'),
      icon: <FiMessageCircle className="w-4 h-4" />,
      items: [
        { label: "EMAIL", value: "your-email@example.com" },
        { label: "GITHUB", value: "@your-username" },
        { label: "TWITTER", value: "@your-handle" }
      ]
    }
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 relative">


      {/* Header Section */}
      <section className="mb-13 space-y-4">
        <div className="flex items-center gap-4 text-hud-faint font-mono text-[11px] tracking-[0.18em] uppercase">
          <span className="h-px flex-1 bg-hud-line"></span>
          <span>{t('label')}</span>
          <span className="h-px flex-1 bg-hud-line"></span>
        </div>

        <div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => (
          <AboutSection key={section.id} section={section} />
        ))}
      </div>

      {/* Tactical Footer Decoration */}
      <section className="mt-24 flex flex-col items-center">
        <div className="relative group">
          {/* Corner Accents */}
          <div className="absolute -top-2 -left-2 w-2 h-2 border-t border-l border-hud-faint"></div>
          <div className="absolute -top-2 -right-2 w-2 h-2 border-t border-r border-hud-faint"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 border-b border-l border-hud-faint"></div>
          <div className="absolute -bottom-2 -right-2 w-2 h-2 border-b border-r border-hud-faint"></div>

          <div className="px-10 py-6 border border-hud-line-soft bg-transparent backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <FiCommand className="w-3 h-3 text-hud-faint animate-pulse" />
              <p className="font-press-start text-[10px] text-hud-muted text-center tracking-[0.12em] leading-relaxed max-w-[340px]">
                &ldquo;YOUR IDENTITY IS TRANSITORY, BUT DATA PERSISTS.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-hud-line-soft pt-12 overflow-hidden mx-auto max-w-full">
        <div className="relative w-full">
          <LogoLoop
            logos={techLogos}
            speed={20}
            direction="left"
            logoHeight={20}
            gap={44}
            fadeOut
            fadeOutColor="var(--background)"
          />
        </div>
      </section>
    </div>
  );
}

const LogoLoop = _LogoLoop as unknown as ComponentType<LogoLoopProps>;

const hashToHex = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  const value = (hash >>> 0).toString(16).toUpperCase().padStart(4, '0');
  return value.slice(-4);
};

function AboutSection({ section }: { section: AboutSectionData }) {
  const hexId = useMemo(() => `0x${hashToHex(section.id)}`, [section.id]);

  return (
    <section
      key={section.id}
      className="group relative p-6 bg-card transition-all duration-400 border border-hud-line-soft"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-hud-muted group-hover:text-hud-strong transition-colors">
            {section.icon}
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-hud-strong font-mono">
            {section.title}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-hud-faint group-hover:text-hud-dim min-w-10 text-right">
          {hexId || "----"}
        </span>
      </div>

      <div className="space-y-3 text-[14px] leading-6 text-hud font-sans sm:text-[15px] sm:leading-7">
        {section.content?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {section.items && (
          <div className="grid gap-2 border-t border-hud-line-soft pt-4">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between group/line">
                <span className="text-[10px] font-mono text-hud-dim uppercase tracking-[0.18em]">{item.label}</span>
                <span className="text-[11px] font-mono text-hud group-hover/line:text-hud-strong transition-colors">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <span className="text-[10px] font-mono text-hud-faint uppercase tracking-[0.22em] group-hover:text-hud-dim transition-colors">
          ACC_PROTO // {section.id}
        </span>
      </div>
    </section>
  );
}

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <SiThreedotjs />, title: "Three.js", href: "https://threejs.org" },
  { node: <SiFramer />, title: "Framer Motion", href: "https://www.framer.com/motion/" },
  { node: <SiVercel />, title: "Vercel", href: "https://vercel.com" },
];
