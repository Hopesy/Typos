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
  // 传入 true 时目录嵌入预览窗格（配合 containerRef），否则跟随 window（文章页）。
  embedded?: boolean;
  containerRef?: React.RefObject<HTMLElement | null>;
};

function findHeading(items: TocItem[], id: string, root: HTMLElement | Document) {
  if (root instanceof Document) return root.getElementById(id);
  return root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
}

function resolveActiveId(items: TocItem[], container: HTMLElement | null) {
  const viewportTop = container ? container.getBoundingClientRect().top : 0;
  const viewportHeight = container ? container.clientHeight : window.innerHeight;
  const trigger = viewportTop + Math.min(viewportHeight * 0.28, 220);
  const root: HTMLElement | Document = container ?? document;

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const element = findHeading(items, items[index].id, root);
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

export default function TocRail({ toc, embedded = false, containerRef }: TocRailProps) {
  const t = useTranslations('aria');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    // 嵌入预览时跟随容器滚动；否则跟随 window。
    const scroller: HTMLElement | Window = containerRef?.current ?? window;
    const container = containerRef?.current ?? null;

    const update = () => {
      setActiveId(resolveActiveId(toc, container));

      if (embedded) {
        setIsRevealed(true);
        return;
      }
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

    scroller.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('hashchange', onScrollOrResize);

    return () => {
      scroller.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('hashchange', onScrollOrResize);
    };
  }, [toc, containerRef, embedded]);

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

  // 嵌入预览：在容器内滚动到标题，而非触发 window 级 hash 跳转。
  const handleClick = (event: React.MouseEvent, id: string) => {
    const container = containerRef?.current;
    if (!container) return;
    event.preventDefault();
    const target = container.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
    if (!target) return;
    const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 12;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <nav
      className={`toc-rail hidden md:flex ${embedded ? 'toc-rail-embedded' : ''} ${isRevealed ? 'is-revealed' : ''}`}
      aria-label={t('toc')}
    >
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
              onClick={(event) => handleClick(event, item.id)}
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
