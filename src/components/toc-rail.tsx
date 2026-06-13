'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

type TocItem = {
  depth: number;
  text: string;
  id: string;
};

type TocRailProps = {
  toc: TocItem[];
};

function resolveActiveId(items: TocItem[]) {
  const trigger = Math.min(window.innerHeight * 0.28, 220);

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const element = document.getElementById(items[index].id);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= trigger) {
      return items[index].id;
    }
  }

  return items[0]?.id ?? null;
}

function buildVisibleSet(items: TocItem[], activeId: string | null) {
  if (!activeId) return new Set<string>();

  const activeIndex = items.findIndex((item) => item.id === activeId);
  if (activeIndex < 0) return new Set<string>();

  const visible = new Set<string>();
  visible.add(activeId);

  let threshold = items[activeIndex].depth;
  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.depth < threshold) {
      visible.add(item.id);
      threshold = item.depth;
    }
    if (threshold <= 1) break;
  }

  return visible;
}

export default function TocRail({ toc }: TocRailProps) {
  const t = useTranslations('aria');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const update = () => {
      setActiveId(resolveActiveId(toc));

      const titleBlock = document.querySelector('[data-post-title-block]');
      setIsRevealed(titleBlock ? titleBlock.getBoundingClientRect().bottom <= 0 : window.scrollY > 0);
    };

    update();

    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('hashchange', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('hashchange', onScrollOrResize);
    };
  }, [toc]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const updateHints = () => {
      const overflow = listEl.scrollHeight > listEl.clientHeight + 1;
      if (!overflow) {
        setCanScrollUp(false);
        setCanScrollDown(false);
        return;
      }

      const top = listEl.scrollTop;
      const maxTop = listEl.scrollHeight - listEl.clientHeight;
      setCanScrollUp(top > 2);
      setCanScrollDown(top < maxTop - 2);
    };

    updateHints();

    const onScroll = () => updateHints();
    listEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const observer = new ResizeObserver(() => updateHints());
    observer.observe(listEl);

    return () => {
      listEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
    };
  }, [toc]);

  const visibleSet = useMemo(() => buildVisibleSet(toc, activeId), [toc, activeId]);

  if (toc.length === 0) return null;

  return (
    <nav className={`toc-rail hidden md:flex ${isRevealed ? 'is-revealed' : ''}`} aria-label={t('toc')}>
      {canScrollUp ? (
        <div className="toc-scroll-hint toc-scroll-hint-top" aria-hidden>
          <ChevronUp className="h-3.5 w-3.5 text-hud-faint" />
        </div>
      ) : null}
      <div ref={listRef} className="toc-ticks">
        {toc.map((item, index) => {
          const isActive = item.id === activeId;
          const isVisible = visibleSet.has(item.id);
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`toc-tick ${isActive ? 'is-active' : ''} ${isVisible ? 'is-visible' : ''}`}
              data-depth={item.depth}
              aria-label={`${index + 1}. ${item.text}`}
            >
              <span className="toc-line" />
              <span className="toc-label">{item.text}</span>
            </a>
          );
        })}
      </div>
      {canScrollDown ? (
        <div className="toc-scroll-hint toc-scroll-hint-bottom" aria-hidden>
          <ChevronDown className="h-3.5 w-3.5 text-hud-faint" />
        </div>
      ) : null}
    </nav>
  );
}
