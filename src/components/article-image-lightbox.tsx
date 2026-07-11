'use client';

import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type LightboxImage = {
  src: string;
  alt: string;
  caption: string;
};

const IMAGE_SELECTOR = '.article img';

export default function ArticleImageLightbox() {
  const tr = useTranslations('imageViewer');
  const [image, setImage] = useState<LightboxImage | null>(null);
  const [showActualSize, setShowActualSize] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const prepareImages = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLImageElement>(IMAGE_SELECTOR).forEach((candidate) => {
        if (candidate.dataset.imageLightboxReady === 'true') return;
        candidate.dataset.imageLightboxReady = 'true';
        candidate.tabIndex = 0;
        candidate.setAttribute('role', 'button');
        candidate.setAttribute(
          'aria-label',
          candidate.alt ? `${tr('open')}: ${candidate.alt}` : tr('open')
        );
      });
    };

    const openImage = (candidate: HTMLImageElement) => {
      const src = candidate.currentSrc || candidate.src;
      if (!src) return;

      triggerRef.current = candidate;
      const figure = candidate.closest('figure');
      const caption = figure?.querySelector('figcaption')?.textContent?.trim() || '';
      setShowActualSize(false);
      setImage({ src, alt: candidate.alt || '', caption });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || !target.matches(IMAGE_SELECTOR)) return;

      if (target.closest('a')) event.preventDefault();
      openImage(target);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || !target.matches(IMAGE_SELECTOR)) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      openImage(target);
    };

    prepareImages();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(IMAGE_SELECTOR)) prepareImages(node.parentElement ?? document);
          else prepareImages(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.querySelectorAll<HTMLImageElement>(`${IMAGE_SELECTOR}[data-image-lightbox-ready="true"]`)
        .forEach((candidate) => {
          delete candidate.dataset.imageLightboxReady;
          candidate.removeAttribute('role');
          candidate.removeAttribute('aria-label');
          candidate.removeAttribute('tabindex');
        });
    };
  }, [tr]);

  useEffect(() => {
    if (!image) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImage(null);
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      triggerRef.current?.focus();
    };
  }, [image]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex flex-col bg-black/92 text-neutral-200 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={tr('dialogLabel')}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setImage(null);
      }}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-3 sm:px-5">
        <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
          {image.caption || image.alt || tr('dialogLabel')}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowActualSize((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
            title={showActualSize ? tr('fitToScreen') : tr('actualSize')}
            aria-label={showActualSize ? tr('fitToScreen') : tr('actualSize')}
            aria-pressed={showActualSize}
          >
            {showActualSize ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setImage(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
            title={tr('close')}
            aria-label={tr('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-auto p-3 sm:p-6 ${showActualSize ? 'block' : 'flex items-center justify-center'}`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setImage(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- article images can use arbitrary remote URLs and are shown at their original resolution. */}
        <img
          src={image.src}
          alt={image.alt}
          onClick={() => setShowActualSize((value) => !value)}
          className={`mx-auto block cursor-zoom-in object-contain shadow-2xl transition-[max-width,max-height] duration-200 ${
            showActualSize
              ? 'max-h-none max-w-none cursor-zoom-out'
              : 'max-h-[calc(100svh-5.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-3rem)]'
          }`}
        />
      </div>
    </div>
  );
}
