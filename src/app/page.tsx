'use client';

import { HeroTitle, HeroSubtitle } from "@/components/hero-title";
import { FiFileText, FiLayers, FiRefreshCw, FiMapPin, FiMusic, FiBookOpen, FiVideo } from "react-icons/fi";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ActivityHeatmap, ActivityHeatmapPreview } from "@/components/activity-heatmap";
import { useEffect, useState } from "react";
import type { ActivityStats } from "@/lib/content";

// 纯 WebGL 背景，仅客户端渲染：用 dynamic(ssr:false) 把 three.js/postprocessing
// 从服务端 bundle 中剔除，避免 Worker 体积超限。
const Dither = dynamic(() => import("@/components/dither/Dither"), { ssr: false });

const tools = [
  {
    name: "Eidos",
    description: "生图工作台",
    link: "https://github.com/Hopesy/Eidos",
    icon: <FiFileText className="w-6 h-6" />
  },
  {
    name: "RevitClaw",
    description: "Revit Agent插件",
    link: "https://github.com/Hopesy/RevitClaw",
    icon: <FiLayers className="w-6 h-6" />
  },
  {
    name: "MarkdView",
    description: "MD渲染器",
    link: "https://github.com/Hopesy/MarkdView",
    icon: <FiRefreshCw className="w-6 h-6" />
  },
  {
    name: "MinoLink",
    description: "飞书远控终端",
    link: "https://github.com/Hopesy/MinoLink",
    icon: <FiVideo className="w-6 h-6" />
  },
];

const books: {
  title: string;
  cover: string;
  hoverText: string;
}[] = [];

const signalTags = ["BUILD", "WRITE", "PHOTO", "DAILY"];

const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const cellShade = (seed: number) => {
  const r = noise(seed);
  if (r > 0.8) return 'bg-hud/40';
  if (r > 0.6) return 'bg-hud/20';
  if (r > 0.4) return 'bg-hud/10';
  return 'bg-hud/[0.03]';
};

const hexTag = (seed: number) => {
  const value = Math.floor(noise(seed) * 256);
  return value.toString(16).toUpperCase().padStart(2, '0');
};

export default function Home() {
  const t = useTranslations();
  const [activities, setActivities] = useState<ActivityStats[]>([]);

  useEffect(() => {
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => console.error('Failed to load activities:', err));
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4">
      <div className="dither-background-wrapper">
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
      {/* Hero Section */}
      <section className="mb-8 flex min-h-[40vh] flex-col items-center justify-center px-2 text-center sm:px-0">
        <HeroTitle />
        <div className="mt-6 text-hud-strong">
          <HeroSubtitle />
        </div>
      </section>

      {/* 方案1: Status/Now 极简状态栏 */}
      <section className="mb-16 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2 rounded-full border border-hud-line bg-hud-panel backdrop-blur-md text-[11px] uppercase tracking-[0.16em] text-hud font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            STATUS: CODING
          </div>
          <div className="flex items-center gap-2 text-hud">
            <FiMapPin className="w-3 h-3 text-hud-muted" />
            GUANG ZHOU
          </div>
          <div className="flex items-center gap-2 text-hud">
            <FiMusic className="w-3 h-3 text-hud-muted" />
            月亮之矢
          </div>
        </div>
      </section>

      <div className="space-y-24">
        {/* 方案4: GitHub Contribution 模拟贡献墙 - HUD 风格 - 独立背景，隔离鼠标交互 */}
        <section className="relative group">
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-hud-line-soft pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-hud font-mono">{t('home.section.footprint')}</h2>
          </div>

          {/* 独立背景层，无边框无padding，背景边缘即色块边缘 */}
          <div className="relative bg-hud-panel/[0.15] backdrop-blur-sm">
            <ActivityHeatmap activities={activities} showPreviewInTitle={true} />
          </div>
        </section>

        {/* 工具集 Section - HUD 风格 - 去边框去背景 */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-6 border-b border-hud-line-soft pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-hud font-mono">{t('home.section.tools')}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="group/item relative p-3 md:p-5 transition-all duration-500"
              >
                {/* Minimal Corner */}
                <span className="absolute top-0 right-0 w-1 h-1 bg-hud-faint group-hover/item:bg-hud-muted transition-colors"></span>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="text-hud group-hover/item:text-hud-strong transition-colors">
                      {tool.icon}
                    </div>
                    <span className="text-[10px] font-mono text-hud-muted">
                      0x{hexTag(tool.name.length)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-hud group-hover/item:text-hud-strong mb-1 tracking-tight transition-colors">{tool.name}</h3>
                    <p className="text-[11px] text-hud-muted leading-relaxed font-mono">{tool.description}</p>
                  </div>

                  <a
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-[11px] font-mono text-hud hover:text-hud-strong pt-4 mt-2 group/btn"
                  >
                    <span>{t('home.launchModule')}</span>
                    <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 书架模块 */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-6 border-b border-hud-line-soft pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-hud font-mono">{t('home.section.books')}</h2>
          </div>

          <div className="flex justify-start">
            {books.map((book) => (
              <article key={book.title} className="group/book relative w-[170px] sm:w-[190px]">
                <div className="relative overflow-hidden rounded-sm bg-hud-panel aspect-[3/4]">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    width={480}
                    height={640}
                    className="h-full w-full object-contain object-left brightness-[0.82] saturate-[0.86] contrast-[0.94]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/18 transition-colors duration-300 group-hover/book:bg-black/8"></div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/28 via-black/12 to-transparent opacity-80"></div>
                  <div className="absolute inset-0 opacity-0 group-hover/book:opacity-100 transition-opacity duration-300 bg-black/25 backdrop-blur-md flex items-center justify-center p-4">
                    <p className="text-xs leading-relaxed text-center text-white/90 font-mono">{book.hoverText}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-hud">
                  <FiBookOpen className="w-3.5 h-3.5 text-hud-muted" />
                  <h3 className="text-xs tracking-wide font-mono uppercase">{book.title}</h3>
                </div>
              </article>
            ))}
          </div>

        </section>

      </div>
    </div>
  );
}
