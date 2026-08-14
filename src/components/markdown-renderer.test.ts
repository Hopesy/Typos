import { describe, expect, it } from 'vitest';
import { renderArticle } from '@/components/markdown-renderer';

describe('Markdown HTML sanitization', () => {
  it('removes scripts, event handlers, and javascript URLs', async () => {
    const { html } = await renderArticle(`
# Safe heading

<script>alert('xss')</script>
<img src="https://example.com/image.png" onerror="alert('xss')">
<a href="javascript:alert('xss')">bad link</a>
`);

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('Safe heading');
  });

  it('keeps KaTeX and Shiki output after sanitizing raw HTML', async () => {
    const { html } = await renderArticle('Inline math: $x^2$.\n\n```js\nconst value = 1;\n```');

    expect(html).toContain('class="katex"');
    expect(html).toContain('class="shiki');
    expect(html).toContain('data-language="js"');
  });
});
