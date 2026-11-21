import type { Nodes } from 'mdast';

export type EditorEditResult = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
};

function clampRange(content: string, start: number, end: number): [number, number] {
  const safeStart = Math.max(0, Math.min(content.length, start));
  const safeEnd = Math.max(safeStart, Math.min(content.length, end));
  return [safeStart, safeEnd];
}

/**
 * Wrap the current selection with an inline Markdown marker (e.g. `**`, `*`, `~~`, `` ` ``),
 * or unwrap it if already wrapped either inside or directly around the selection.
 */
export function toggleInlineWrap(
  content: string,
  rawStart: number,
  rawEnd: number,
  marker: string,
  placeholder: string,
): EditorEditResult {
  const [start, end] = clampRange(content, rawStart, rawEnd);
  const selected = content.slice(start, end);
  const mLen = marker.length;

  // Case 1: marker sits immediately outside the selection: **|text|**
  if (
    selected.length > 0 &&
    start >= mLen &&
    content.slice(start - mLen, start) === marker &&
    content.slice(end, end + mLen) === marker
  ) {
    const next = `${content.slice(0, start - mLen)}${selected}${content.slice(end + mLen)}`;
    return {
      content: next,
      selectionStart: start - mLen,
      selectionEnd: end - mLen,
    };
  }

  // Case 2: selection itself starts and ends with marker: |**text**|
  if (
    selected.length >= mLen * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(mLen, selected.length - mLen);
    const next = `${content.slice(0, start)}${inner}${content.slice(end)}`;
    return {
      content: next,
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  const body = selected || placeholder;
  const next = `${content.slice(0, start)}${marker}${body}${marker}${content.slice(end)}`;
  return {
    content: next,
    selectionStart: start + mLen,
    selectionEnd: start + mLen + body.length,
  };
}

/**
 * Apply or toggle a line-start Markdown prefix (e.g. `## `, `> `, `- `, `- [ ] `)
 * across every line intersecting the current selection.
 */
export function applyBlockPrefix(
  content: string,
  rawStart: number,
  rawEnd: number,
  prefix: string,
  placeholder: string,
): EditorEditResult {
  const [start, end] = clampRange(content, rawStart, rawEnd);

  const lineStart = start === 0 ? 0 : content.lastIndexOf('\n', start - 1) + 1;
  // Selection ends are exclusive: a selection ending at the next line's start leaves it alone.
  const lastSelected = end > start && content[end - 1] === '\n' ? end - 1 : end;
  const nextNewline = content.indexOf('\n', lastSelected);
  const lineEnd = nextNewline === -1 ? content.length : nextNewline;

  const block = content.slice(lineStart, lineEnd);

  // Empty line with collapsed cursor: insert prefix + placeholder selected for quick overwrite.
  if (start === end && block.trim() === '') {
    const next = `${content.slice(0, lineStart)}${prefix}${placeholder}${content.slice(lineEnd)}`;
    const selStart = lineStart + prefix.length;
    return {
      content: next,
      selectionStart: selStart,
      selectionEnd: selStart + placeholder.length,
    };
  }

  const lines = block.split('\n');
  const isOrdered = prefix === '1. ';
  const isList = isOrdered || prefix === '- ' || prefix === '- [ ] ';
  const matchesPrefix = (line: string) => isOrdered ? /^\d+[.)] /.test(line)
    : prefix === '- ' ? /^- (?!\[[ xX]\] )/.test(line) : line.startsWith(prefix);
  const allPrefixed = lines.every(matchesPrefix);
  const transformed = lines
    .map((line, index) => {
      if (allPrefixed) return isOrdered ? line.replace(/^\d+[.)] /, '') : line.slice(prefix.length);
      const body = isList ? line.replace(/^(?:[-+*] (?:\[[ xX]\] )?|\d+[.)] )/, '') : line;
      return `${isOrdered ? `${index + 1}. ` : prefix}${body}`;
    })
    .join('\n');

  const next = `${content.slice(0, lineStart)}${transformed}${content.slice(lineEnd)}`;
  return {
    content: next,
    selectionStart: lineStart,
    selectionEnd: lineStart + transformed.length,
  };
}

export function insertTemplate(
  content: string,
  rawStart: number,
  rawEnd: number,
  before: string,
  after = '',
  placeholder = '',
): EditorEditResult {
  const [start, end] = clampRange(content, rawStart, rawEnd);
  const selected = content.slice(start, end) || placeholder;
  const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
  const selectionStart = start + before.length;
  return {
    content: next,
    selectionStart,
    selectionEnd: selectionStart + selected.length,
  };
}

export function replaceSelection(
  content: string,
  rawStart: number,
  rawEnd: number,
  replacement: string,
): EditorEditResult {
  const [start, end] = clampRange(content, rawStart, rawEnd);
  const next = `${content.slice(0, start)}${replacement}${content.slice(end)}`;
  const cursor = start + replacement.length;
  return {
    content: next,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

/** Copy readable Markdown text while preserving code, line breaks, and image descriptions. */
export async function markdownToPlainText(markdown: string): Promise<string> {
  const [{ unified }, { default: remarkParse }, { default: remarkGfm }] = await Promise.all([
    import('unified'), import('remark-parse'), import('remark-gfm'),
  ]);
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const readText = (node: Nodes): string => {
    if (node.type === 'definition' || node.type === 'html') return '';
    if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? '';
    if (node.type === 'break') return '\n';
    if ('value' in node) return node.value;
    if ('children' in node) {
      const separator = node.type === 'root' ? '\n\n' : node.type === 'tableRow' ? '\t'
        : ['list', 'listItem', 'blockquote', 'table'].includes(node.type) ? '\n' : '';
      return node.children.map(readText).join(separator);
    }
    return '';
  };
  return readText(tree);
}

export function insertBlockSnippet(
  content: string,
  rawStart: number,
  rawEnd: number,
  snippet: string,
  selectText?: string,
): EditorEditResult {
  const [start, end] = clampRange(content, rawStart, rawEnd);
  const beforeChar = start > 0 ? content[start - 1] : '';
  const afterChar = end < content.length ? content[end] : '';
  const lead = start > 0 && beforeChar !== '\n' ? '\n\n' : start > 0 ? '\n' : '';
  const trail = afterChar && afterChar !== '\n' ? '\n\n' : '';

  const inserted = `${lead}${snippet}${trail}`;
  const next = `${content.slice(0, start)}${inserted}${content.slice(end)}`;

  if (selectText) {
    const idx = snippet.indexOf(selectText);
    if (idx !== -1) {
      const selStart = start + lead.length + idx;
      return {
        content: next,
        selectionStart: selStart,
        selectionEnd: selStart + selectText.length,
      };
    }
  }

  const cursor = start + lead.length + snippet.length;
  return {
    content: next,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}
