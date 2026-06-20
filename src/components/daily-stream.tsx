'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DailyFragment } from '@/lib/content';

// 单条碎片正文：在浏览器内复用文章页同一套渲染管线（renderArticle），
// CPU 花在本机而非 Worker，规避 Cloudflare Free 套餐 1102（见 docs/CLOUDFLARE_CPU_LIMITS.md）。
function FragmentBody({ content, className = '' }: { content: string; className?: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { renderArticle } = await import('@/components/markdown-renderer');
        const { html: rendered } = await renderArticle(content);
        if (!cancelled) setHtml(rendered);
      } catch {
        // 渲染失败时回退为纯文本，避免空白。
        if (!cancelled) setHtml('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!html) {
    return <div className={`whitespace-pre-wrap text-hud-muted ${className}`}>{content}</div>;
  }
  return <div className={`article ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function DailyStream({ fragments }: { fragments: DailyFragment[] }) {
  const t = useTranslations('daily');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'timeline' | 'cards'>('timeline');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fragments;
    return fragments.filter(
      (f) => f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    );
  }, [fragments, query]);

  return (
    <div className={`container mx-auto px-6 py-16 space-y-10 ${view === 'cards' ? 'max-w-5xl' : 'max-w-3xl'}`}>
      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-hud-faint pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-sm bg-transparent border border-hud-line px-12 py-3 text-sm font-mono text-hud-strong placeholder:text-hud-faint outline-none focus:border-hud-line-strong transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-hud-faint hover:text-hud-strong transition-colors"
            >
              [ {t('clear')} ]
            </button>
          )}
        </div>
        <button
          onClick={() => setView(view === 'timeline' ? 'cards' : 'timeline')}
          className="flex-shrink-0 h-[46px] w-[46px] flex items-center justify-center rounded-sm border border-hud-line bg-transparent hover:border-hud-line-strong hover:bg-hud-panel/30 transition-all"
          title={view === 'timeline' ? t('viewCards') : t('viewTimeline')}
        >
          {view === 'timeline' ? (
            <LayoutGrid className="h-4 w-4 text-hud-muted" />
          ) : (
            <List className="h-4 w-4 text-hud-muted" />
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-hud-line-soft">
          <span className="font-mono text-[11px] text-hud-faint uppercase tracking-[0.22em]">
            {query ? t('noResults') : t('empty')}
          </span>
        </div>
      ) : view === 'timeline' ? (
        <TimelineView fragments={filtered} t={t} />
      ) : (
        <CardsView fragments={filtered} t={t} />
      )}
    </div>
  );
}

type ViewProps = {
  fragments: DailyFragment[];
  t: ReturnType<typeof useTranslations>;
};

// 时间线视图：沿用终端风格，每条碎片独立成项（含独立日期/状态标签）。
function TimelineView({ fragments, t }: ViewProps) {
  return (
    <div className="relative space-y-16">
      <div className="absolute left-[7px] top-2 bottom-0 w-px border-l border-dashed border-hud-line pointer-events-none" />

      {fragments.map((f) => (
        <article key={f.id} className="relative group mb-[24px]">
          <div className="flex items-center gap-4 text-[15px] font-mono mb-4 relative z-10">
            <div className="w-[15px] h-[15px] rounded-full bg-background border border-hud-line-strong flex items-center justify-center">
              <span className="text-[10px] text-hud-muted">➜</span>
            </div>
            <span className="text-hud-muted group-hover:text-hud-strong transition-colors uppercase tracking-[0.18em] text-[11px]">
              {t('logPrefix')} · {f.date}
            </span>
          </div>

          <div className="pl-10 space-y-5">
            {f.image && (
              <div className="relative inline-block scanline-effect group/image">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URLs without known dimensions. */}
                <img
                  src={f.image}
                  alt={f.title || f.date}
                  className="max-h-96 w-auto object-contain border border-hud-line opacity-80 group-hover/image:opacity-100 transition-opacity duration-700 rounded-[2px]"
                />
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-hud-muted" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-hud-muted" />
                <div className="absolute top-2 right-2 font-mono text-[10px] text-white/30 px-1.5 py-0.5 bg-black/40">
                  {t('captureTag')}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {f.title && (
                <div className="text-[15px] font-bold text-hud-strong font-mono uppercase tracking-tight">
                  {f.title}
                </div>
              )}
              <FragmentBody content={f.content} className="text-[15px] leading-7 font-sans sm:text-base sm:leading-8" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-hud-faint group-hover:text-hud-muted transition-colors">
              <span>[ {t('status')} ]</span>
              <span>[ {f.date} ]</span>
              <span>[ {t('source')} ]</span>
            </div>
          </div>
        </article>
      ))}

      <div className="relative group mb-[24px]">
        <div className="flex items-center gap-4 text-[10px] font-mono relative z-10">
          <div className="w-[15px] h-[15px] rounded-full bg-background border border-hud-line-strong flex items-center justify-center">
            <span className="text-[10px] text-hud-muted">➜</span>
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-hud-dim tracking-[0.18em] uppercase">{t('systemIdle')}</span>
            <span className="w-2 h-4 bg-hud-muted cursor-blink ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 卡片流视图：知识碎片墙（类 flomo），每条碎片独立成卡。
function CardsView({ fragments, t }: ViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {fragments.map((f) => (
        <article
          key={f.id}
          className="flex flex-col rounded-sm border border-hud-line-soft bg-transparent hover:bg-hud-panel/40 transition-colors duration-500 overflow-hidden"
        >
          {f.image && (
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-hud-panel/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary remote URLs without known dimensions. */}
              <img src={f.image} alt={f.title || f.date} className="w-full h-full object-cover opacity-70 hover:opacity-90 transition-opacity duration-500" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 p-3.5">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-hud-faint">
              <span>{t('logPrefix')}</span>
              <span className="h-[1px] w-5 bg-hud-line" />
              <span>{f.date}</span>
            </div>
            {f.title && (
              <div className="text-[12px] font-bold text-hud-strong font-mono uppercase tracking-tight">
                {f.title}
              </div>
            )}
            <FragmentBody content={f.content} className="text-[12.5px] leading-6 font-sans" />
          </div>
        </article>
      ))}
    </div>
  );
}

