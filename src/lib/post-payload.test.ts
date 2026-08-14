import { describe, expect, it } from 'vitest';
import { firstMarkdownHeading, postPayloadFromJson, postPayloadFromMarkdown } from '@/lib/post-payload';

describe('post payload', () => {
  it('ignores headings inside fenced code blocks', () => {
    const content = '```md\n# Not the title\n```\n\n# Real title\n\nBody';
    expect(firstMarkdownHeading(content)).toBe('Real title');
  });

  it('generates distinct default slugs for posts on the same date', () => {
    const first = postPayloadFromJson({ date: '2026-08-14', content: '# One' }, 'first-value');
    const second = postPayloadFromJson({ date: '2026-08-14', content: '# Two' }, 'second-value');

    expect(first.slug).toBe('260814-firstval');
    expect(second.slug).toBe('260814-secondva');
    expect(first.slug).not.toBe(second.slug);
  });

  it('uses the first real heading for raw Markdown payloads', () => {
    const payload = postPayloadFromMarkdown('```\n# Fake\n```\n\n# Actual\n', 'fixed-value');
    expect(payload.title).toBe('Actual');
  });
});
