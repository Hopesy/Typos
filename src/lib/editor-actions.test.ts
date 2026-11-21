import { describe, expect, it } from 'vitest';
import {
  applyBlockPrefix,
  insertBlockSnippet,
  insertTemplate,
  replaceSelection,
  markdownToPlainText,
  toggleInlineWrap,
} from '@/lib/editor-actions';

describe('editor markdown actions', () => {
  it('wraps and toggles inline formatting without double-wrapping', () => {
    const wrapped = toggleInlineWrap('hello world', 6, 11, '**', 'bold');
    expect(wrapped).toEqual({
      content: 'hello **world**',
      selectionStart: 8,
      selectionEnd: 13,
    });

    // Selecting the inner text inside **world** unwraps cleanly
    const unwrappedOuter = toggleInlineWrap(wrapped.content, wrapped.selectionStart, wrapped.selectionEnd, '**', 'bold');
    expect(unwrappedOuter).toEqual({
      content: 'hello world',
      selectionStart: 6,
      selectionEnd: 11,
    });

    // Selecting **world** including markers also unwraps cleanly
    const unwrappedSelf = toggleInlineWrap('hello **world**', 6, 15, '**', 'bold');
    expect(unwrappedSelf).toEqual({
      content: 'hello world',
      selectionStart: 6,
      selectionEnd: 11,
    });
  });

  it('inserts placeholder when no text is selected for inline wrap', () => {
    const result = toggleInlineWrap('中文 ', 3, 3, '`', 'code');
    expect(result).toEqual({
      content: '中文 `code`',
      selectionStart: 4,
      selectionEnd: 8,
    });
  });

  it('applies and toggles block prefixes across single and multiple lines', () => {
    const emptyLine = applyBlockPrefix('', 0, 0, '## ', 'Heading');
    expect(emptyLine).toEqual({
      content: '## Heading',
      selectionStart: 3,
      selectionEnd: 10,
    });

    const multi = applyBlockPrefix('第一行\n第二行', 1, 6, '- [ ] ', 'Task');
    expect(multi.content).toBe('- [ ] 第一行\n- [ ] 第二行');

    const toggledOff = applyBlockPrefix(multi.content, 0, multi.content.length, '- [ ] ', 'Task');
    expect(toggledOff.content).toBe('第一行\n第二行');
  });

  it('handles templates, replacement, and block snippets', () => {
    const linked = insertTemplate('see docs', 4, 8, '[', '](https://)', 'link');
    expect(linked).toEqual({
      content: 'see [docs](https://)',
      selectionStart: 5,
      selectionEnd: 9,
    });

    const pasted = replaceSelection('hello world', 6, 11, 'Typos');
    expect(pasted).toEqual({
      content: 'hello Typos',
      selectionStart: 11,
      selectionEnd: 11,
    });

    const snippet = insertBlockSnippet('Paragraph', 9, 9, '---');
    expect(snippet.content).toBe('Paragraph\n\n---');

  });

  it('numbers selected lines and switches list styles without stacking markers', () => {
    const ordered = applyBlockPrefix('- 第一行\n- [x] 第二行\n8. 第三行', 0, 26, '1. ', 'item');
    expect(ordered.content).toBe('1. 第一行\n2. 第二行\n3. 第三行');
    expect(applyBlockPrefix(ordered.content, 0, ordered.content.length, '1. ', 'item').content)
      .toBe('第一行\n第二行\n第三行');
    expect(applyBlockPrefix('- [ ] 任务', 0, 8, '- ', 'item').content).toBe('- 任务');
  });

  it('leaves the next line intact when the selection ends at its start', () => {
    expect(applyBlockPrefix('第一行\n第二行', 0, 4, '1. ', 'item').content).toBe('1. 第一行\n第二行');
    expect(applyBlockPrefix('\n正文', 0, 0, '> ', '引用').content).toBe('> 引用\n正文');
  });

  it('copies readable Markdown as plain text while keeping literal code and line structure', async () => {
    expect(await markdownToPlainText('# 标题\n\n**加粗** *斜体* ~~删除~~ [链接](https://example.com)\n\n- 项目一\n- 项目二\n\n`a_b*c`\n\n![说明](photo.png)'))
      .toBe('标题\n\n加粗 斜体 删除 链接\n\n项目一\n项目二\n\na_b*c\n\n说明');
  });
});
