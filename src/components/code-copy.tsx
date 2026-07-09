'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

// 文章正文是服务端渲染的 HTML（dangerouslySetInnerHTML，零客户端 JS）。
// 该组件在文章页水合后，为每个 <pre> 注入复制按钮——不改动 SSR 产物结构。
export default function CodeCopy() {
  const t = useTranslations('markdown');

  useEffect(() => {
    const copyLabel = t('copyCode');
    const copiedLabel = t('copied');

    const blocks = Array.from(
      document.querySelectorAll<HTMLPreElement>('.article pre')
    ).filter((pre) => pre.querySelector('code'));

    const cleanups: Array<() => void> = [];

    blocks.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      button.setAttribute('aria-label', copyLabel);
      button.setAttribute('title', copyLabel);
      button.innerHTML = COPY_ICON;

      let resetTimer: ReturnType<typeof setTimeout> | undefined;

      const onClick = async () => {
        const code = pre.querySelector('code');
        const text = code?.textContent ?? '';
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          return;
        }
        button.classList.add('is-copied');
        button.innerHTML = CHECK_ICON;
        button.setAttribute('aria-label', copiedLabel);
        button.setAttribute('title', copiedLabel);
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          button.classList.remove('is-copied');
          button.innerHTML = COPY_ICON;
          button.setAttribute('aria-label', copyLabel);
          button.setAttribute('title', copyLabel);
        }, 2000);
      };

      button.addEventListener('click', onClick);
      pre.appendChild(button);

      cleanups.push(() => {
        if (resetTimer) clearTimeout(resetTimer);
        button.removeEventListener('click', onClick);
        button.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [t]);

  return null;
}

// 内联 SVG（lucide 的 Copy / Check），避免为静态图标引入客户端图标组件。
const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
