"use client";

import { useMemo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { FiCommand, FiActivity, FiGlobe, FiCpu, FiMessageCircle } from "react-icons/fi";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiThreedotjs, SiFramer, SiVercel } from 'react-icons/si';
import _LogoLoop from '@/components/logo-loop/LogoLoop';

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
  const sections: AboutSectionData[] = [
    {
      id: "INTEL_SOURCE",
      title: "站点含义",
      icon: <FiGlobe className="w-4 h-4" />,
      content: [
        "在这个信息的荒原中，此站点旨在作为一个极简的锚点。",
        "名字源于对效率与留白的某种执念，或者仅仅是一个随机生成的 ID。",
        "我们在此记录碎片，在黑暗中寻找微弱的逻辑连线。"
      ]
    },
    {
      id: "SYSTEM_CORE",
      title: "搭建环境",
      icon: <FiCpu className="w-4 h-4" />,
      content: [
        "核心引擎基于 Next.js 15+ 构建，采用最新的 React Server Components 架构。",
        "视觉层由 Tailwind CSS v4 驱动，融合了战术 HUD 与 8-bit 像素美学。",
        "部署于 Cloudflare 边缘节点，确保数据流的高速传输与稳定。"
      ]
    },
    {
      id: "BUILD_PROCESS",
      title: "搭建过程",
      icon: <FiActivity className="w-4 h-4" />,
      content: [
        "本项目从 0 开始搭建，使用 ReactBits 组件库的设计。",
        "全过程在 Warp 环境下完成，期间借助 Manus 生成初始 UI 原型。",
        "在 AI 生成的基础上进行手工操作与逻辑重构，以确保视觉的独特性。"
      ]
    },
    {
      id: "COMM_PORT",
      title: "通信协议",
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
        <div className="flex items-center gap-4 text-white/13 font-mono text-[10px] tracking-widest uppercase">
          <span className="h-px flex-1 bg-white/10"></span>
          <span>About page</span>
          <span className="h-px flex-1 bg-white/10"></span>
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
          <div className="absolute -top-2 -left-2 w-2 h-2 border-t border-l border-white/20"></div>
          <div className="absolute -top-2 -right-2 w-2 h-2 border-t border-r border-white/20"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 border-b border-l border-white/20"></div>
          <div className="absolute -bottom-2 -right-2 w-2 h-2 border-b border-r border-white/20"></div>

          <div className="px-10 py-6 border border-white/5 bg-transparent backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <FiCommand className="w-3 h-3 text-white/20 animate-pulse" />
              <p className="font-press-start text-[7px] text-white/40 text-center tracking-[0.2em] leading-relaxed max-w-[300px]">
                &ldquo;YOUR IDENTITY IS TRANSITORY, BUT DATA PERSISTS.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-white/5 pt-12 overflow-hidden mx-auto max-w-full">
        <div className="relative w-full">
          <LogoLoop
            logos={techLogos}
            speed={20}
            direction="left"
            logoHeight={20}
            gap={44}
            fadeOut
            fadeOutColor="#0a0a0a"
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
      className="group relative p-8 bg-card transition-all duration-400 border border-white/[0.05]"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-white/40 group-hover:text-white transition-colors">
            {section.icon}
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-200 font-mono">
            {section.title}
          </h2>
        </div>
        <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 min-w-10 text-right">
          {hexId || "----"}
        </span>
      </div>

      <div className="space-y-4 text-[14px] text-white/60 leading-relaxed font-sans">
        {section.content?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {section.items && (
          <div className="grid gap-2 border-t border-white/5 pt-4">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between group/line">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{item.label}</span>
                <span className="text-[10px] font-mono text-white/60 group-hover/line:text-white transition-colors">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <span className="text-[8px] font-mono text-white/5 uppercase tracking-[0.4em] group-hover:text-white/20 transition-colors">
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
