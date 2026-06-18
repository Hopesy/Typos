import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { getHighlighter, CODE_THEMES } from '@/lib/shiki';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export type TocItem = {
  depth: number;
  text: string;
  id: string;
};

// 轻量 hast 节点视图（避免引入 @types/hast）。
type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const isElement = (node: HastNode, tag: string): boolean =>
  node.type === 'element' && node.tagName === tag;

function classList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((c): c is string => typeof c === 'string');
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

// 拼接节点下所有文本（用于取标题纯文本）。
function nodeText(node: HastNode): string {
  if (node.type === 'text') return String(node.value ?? '');
  return (node.children ?? []).map(nodeText).join('');
}

// 收集 h1–h4（带 rehype-slug 生成的 id）供右侧目录导航；id 与文章内标题一致。
function rehypeCollectHeadings(bucket: { level: number; text: string; id: string }[]) {
  return (tree: unknown) => {
    visit(tree as never, 'element', (node: unknown) => {
      const el = node as HastNode;
      const match = /^h([1-4])$/.exec(el.tagName ?? '');
      if (!match) return;
      const id = typeof el.properties?.id === 'string' ? el.properties.id : '';
      const text = nodeText(el).trim();
      if (!id || !text) return;
      bucket.push({ level: Number(match[1]), text, id });
    });
  };
}

// 外部链接在新窗口打开（样式层据 target=_blank 追加外链标记）。
function rehypeExternalLinks() {
  return (tree: unknown) => {
    visit(tree as never, 'element', (node: unknown) => {
      const el = node as HastNode;
      if (el.tagName !== 'a') return;
      const href = el.properties?.href;
      if (typeof href !== 'string') return;
      if (!href.startsWith('http') && !href.startsWith('//')) return;
      const props = el.properties ?? (el.properties = {});
      props.target = '_blank';
      props.rel = 'noopener noreferrer';
    });
  };
}

// Shiki 把语言类写在 <code> 上；提到 <pre data-language> 供样式层标题栏显示。
function rehypeCodeLanguageLabel() {
  return (tree: unknown) => {
    visit(tree as never, 'element', (node: unknown) => {
      const pre = node as HastNode;
      if (!isElement(pre, 'pre')) return;
      if (!classList(pre.properties?.class ?? pre.properties?.className).includes('shiki')) return;
      const code = pre.children?.find((c) => isElement(c, 'code'));
      const lang = classList(code?.properties?.class ?? code?.properties?.className)
        .find((c) => c.startsWith('language-'))
        ?.slice('language-'.length);
      if (lang && lang !== 'plaintext') {
        (pre.properties ?? (pre.properties = {}))['data-language'] = lang;
      }
    });
  };
}

// 独立成段的图片包成 <figure class="article-figure">，alt 作为图注 —— 配合样式层的 HUD 角标。
function rehypeFigureImages() {
  return (tree: unknown) => {
    visit(tree as never, 'element', (node: unknown) => {
      const p = node as HastNode;
      if (!isElement(p, 'p') || !p.children) return;

      const meaningful = p.children.filter(
        (c) => !(c.type === 'text' && !String(c.value ?? '').trim())
      );
      if (meaningful.length !== 1 || !isElement(meaningful[0], 'img')) return;

      const img = meaningful[0];
      const alt = typeof img.properties?.alt === 'string' ? img.properties.alt.trim() : '';

      p.tagName = 'figure';
      const props = p.properties ?? (p.properties = {});
      delete props.class;
      props.className = [...classList(props.className), 'article-figure'];
      p.children = [img];
      if (alt) {
        p.children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: alt }],
        });
      }
    });
  };
}

// 服务端渲染：unified 管线在服务端完成 Markdown -> HTML（含 Shiki 高亮），
// 同时收集标题生成右侧目录（toc）；toc 的 id 与文章内标题一致。
export async function renderArticle(content: string): Promise<{ html: string; toc: TocItem[] }> {
  const highlighter = await getHighlighter();
  const headings: { level: number; text: string; id: string }[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeExternalLinks)
    .use(rehypeFigureImages)
    // 数学公式（KaTeX）：$...$ 行内、$$...$$ 块级
    .use(rehypeKatex)
    // Shiki 双主题（one-light / one-dark-pro）+ JS 引擎：无 WASM，Workers 兼容
    .use(rehypeShikiFromHighlighter, highlighter as Parameters<typeof rehypeShikiFromHighlighter>[0], {
      themes: CODE_THEMES,
      defaultLanguage: 'plaintext',
      fallbackLanguage: 'plaintext',
      addLanguageClass: true,
    })
    .use(rehypeCodeLanguageLabel)
    .use(rehypeStringify)
    .process(content);

  // 深度归一化：最浅一级标题映射为 depth 1（兼容从 h2 起的文档），上限 4。
  const minLevel = headings.length ? Math.min(...headings.map((h) => h.level)) : 1;
  const toc = headings.map((h) => ({
    depth: Math.min(4, h.level - minLevel + 1),
    text: h.text,
    id: h.id,
  }));

  return { html: file.toString(), toc };
}

// 服务端异步组件：渲染文章正文（零客户端 JS）。
// 右侧目录由页面用 renderArticle 返回的 toc 单独渲染（见 posts/[slug]）。
export default async function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { html } = await renderArticle(content ?? '');

  return (
    <div
      className={`article ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
