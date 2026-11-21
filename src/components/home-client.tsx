'use client';

import { HeroTitle, HeroSubtitle } from '@/components/hero-title';
import { FiBookOpen } from 'react-icons/fi';
import { MapPin } from 'lucide-react';
import HomeBackground from '@/components/home-background';
import { HomeMusicPlayer } from '@/components/home-music-player';
import { HomeToolIcon } from '@/components/home-tool-icon';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { useEffect, useState, type ReactNode } from 'react';
import type { ActivityStats } from '@/lib/content';
import type { HomeBookItem, HomeManageData } from '@/lib/home-manage';

const hexTag = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) & 0xff;
  }
  return hash.toString(16).toUpperCase().padStart(2, '0');
};

function BookCardWrapper({
  book,
  children,
}: {
  book: HomeBookItem;
  children: ReactNode;
}) {
  if (!book.link) {
    return <article className="group/book relative">{children}</article>;
  }
  if (book.link.startsWith('/')) {
    return (
      <Link
        href={book.link}
        className="group/book relative block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud-strong"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={book.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group/book relative block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud-strong"
    >
      {children}
    </a>
  );
}

export function HomeClient({ initialData }: { initialData: HomeManageData }) {
  const t = useTranslations();
  const locale = useLocale();
  const [activities, setActivities] = useState<ActivityStats[]>([]);
  const { status, tools, books } = initialData;

  useEffect(() => {
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load activities:', err));
  }, []);

  return (
    <div className="container mx-auto max-w-5xl px-4">
      <div className="dither-background-wrapper">
        <HomeBackground />
      </div>
      {/* Hero Section */}
      <section className="mb-8 flex min-h-[40vh] flex-col items-center justify-center px-2 text-center sm:px-0">
        <HeroTitle />
        <div className="mt-6 text-hud-strong">
          <HeroSubtitle />
        </div>
      </section>

      {/* 方案1: Status/Now 极简状态栏 */}
      <section className="relative z-20 mb-16 flex justify-center">
        <div className="inline-flex max-w-full flex-col items-center justify-center gap-x-3 gap-y-1.5 rounded-md border border-hud-line bg-[#fffef9]/82 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.11em] text-hud shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_6px_22px_-6px_rgba(23,23,23,0.08)] backdrop-blur-xl transition-colors duration-200 hover:border-hud-line-strong dark:bg-[#121212]/72 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_28px_-6px_rgba(0,0,0,0.45)] sm:flex-row sm:gap-x-3.5 sm:pl-3.5 sm:pr-1 sm:tracking-[0.15em]">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-5 items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/75 motion-reduce:hidden"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-trim-caps text-hud-muted">STATUS:</span>
                <span className="text-trim-caps font-medium text-hud-strong">{status.text}</span>
              </span>
            </div>
            <span aria-hidden="true" className="h-3 w-px shrink-0 bg-hud-line" />
            <div className="flex h-5 items-center gap-1.5 text-hud">
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-hud-muted" strokeWidth={1.75} />
              <span className="text-trim-caps">{status.location}</span>
            </div>
          </div>
          <span aria-hidden="true" className="hidden h-3 w-px shrink-0 bg-hud-line sm:block" />
          <HomeMusicPlayer />
        </div>
      </section>

      <div className="space-y-24 pb-16">
        {/* 方案4: GitHub Contribution 模拟贡献墙 - HUD 风格 - 独立背景，隔离鼠标交互 */}
        <section className="relative group">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-hud-line-soft pb-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-hud">{t('home.section.footprint')}</h2>
            <Link
              href="/posts"
              className="group/link inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-hud-muted transition-colors hover:text-hud-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong"
            >
              <span>{t('home.browseNotes')}</span>
              <span aria-hidden="true" className="transition-transform duration-200 group-hover/link:translate-x-0.5">→</span>
            </Link>
          </div>

          {/* 独立背景层，无边框无padding，背景边缘即色块边缘 */}
          <div className="relative bg-hud-panel/[0.15] backdrop-blur-sm">
            <ActivityHeatmap activities={activities} showPreviewInTitle={true} />
          </div>
        </section>

        {/* 工具集 Section - HUD 风格 - 整卡可点击 */}
        {tools.length > 0 && (
          <section className="relative">
            <div className="mb-6 flex items-center gap-3 border-b border-hud-line-soft pb-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-hud">{t('home.section.tools')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
              {tools.map((tool) => {
                const description =
                  locale === 'en'
                    ? tool.descriptionEn || tool.descriptionZh
                    : tool.descriptionZh || tool.descriptionEn;
                const isInternal = tool.link.startsWith('/');
                const cardClass =
                  'group/item relative block rounded-md border border-transparent p-3 transition-all duration-300 hover:border-hud-line hover:bg-hud-panel/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong md:p-5';
                const inner = (
                  <>
                    {/* Minimal Corner */}
                    <span className="absolute right-1.5 top-1.5 h-1 w-1 bg-hud-faint transition-colors group-hover/item:bg-hud-muted"></span>

                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="text-hud transition-colors group-hover/item:text-hud-strong">
                          <HomeToolIcon name={tool.icon} className="h-6 w-6" />
                        </div>
                        <span className="font-mono text-[10px] text-hud-muted">
                          0x{hexTag(tool.name)}
                        </span>
                      </div>

                      <div>
                        <h3 className="mb-1 text-sm font-bold tracking-tight text-hud transition-colors group-hover/item:text-hud-strong">
                          {tool.name}
                        </h3>
                        {description && (
                          <p className="font-mono text-[11px] leading-relaxed text-hud-muted">
                            {description}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 font-mono text-[11px] text-hud transition-colors group-hover/item:text-hud-strong">
                        <span>{t('home.launchModule')}</span>
                        <span aria-hidden="true" className="transition-transform group-hover/item:translate-x-1">→</span>
                      </div>
                    </div>
                  </>
                );

                return isInternal ? (
                  <Link key={tool.id} href={tool.link} className={cardClass}>
                    {inner}
                  </Link>
                ) : (
                  <a
                    key={tool.id}
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClass}
                  >
                    {inner}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 书架模块：有可见书籍时才展示，避免空区块留白 */}
        {books.length > 0 && (
          <section className="relative">
            <div className="mb-6 flex items-center gap-3 border-b border-hud-line-soft pb-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-hud">{t('home.section.books')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
              {books.map((book) => (
                <BookCardWrapper key={book.id} book={book}>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-hud-line-soft bg-hud-panel">
                    {book.cover ? (
                      <>
                        <Image
                          src={book.cover}
                          alt={book.title}
                          width={480}
                          height={640}
                          unoptimized
                          className="h-full w-full object-cover brightness-[0.86] saturate-[0.9] contrast-[0.96] transition-transform duration-500 group-hover/book:scale-[1.02]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/14 transition-colors duration-300 group-hover/book:bg-black/6"></div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/28 via-black/12 to-transparent opacity-80"></div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between p-4 font-mono">
                        <div className="flex items-center justify-between text-[10px] text-hud-dim">
                          <FiBookOpen className="h-3.5 w-3.5" />
                          <span>0x{hexTag(book.title)}</span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="line-clamp-4 text-xs font-semibold leading-snug text-hud-strong">
                            {book.title}
                          </p>
                          {book.author && (
                            <p className="truncate text-[10px] text-hud-muted">{book.author}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {book.note && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover/book:opacity-100">
                        <p className="text-center font-mono text-xs leading-relaxed text-white/92">
                          {book.note}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2 text-hud">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <FiBookOpen className="h-3.5 w-3.5 shrink-0 text-hud-muted" />
                      <h3 className="truncate font-mono text-xs tracking-wide text-hud-strong">
                        {book.title}
                      </h3>
                    </div>
                    {book.status === 'reading' && (
                      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{t('home.books.reading')}</span>
                      </span>
                    )}
                  </div>
                  {book.author && (
                    <p className="mt-0.5 truncate pl-5 font-mono text-[10px] text-hud-muted">
                      {book.author}
                    </p>
                  )}
                </BookCardWrapper>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
