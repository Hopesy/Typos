import { describe, expect, it } from 'vitest';
import { buildPostDataFromMarkdown, createPostDraft, createPostEditData } from '@/lib/admin-markdown';

describe('admin post defaults', () => {
  it('generates distinct slugs for multiple posts created on the same date', () => {
    const first = createPostDraft('2026-08-14', 'first-value');
    const second = createPostDraft('2026-08-14', 'second-value');

    expect(first.slug).toBe('260814-firstval');
    expect(second.slug).toBe('260814-secondva');
    expect(first.slug).not.toBe(second.slug);
  });

  it('generates a new slug instead of reusing imported frontmatter or the filename', () => {
    const post = buildPostDataFromMarkdown(
      '---\nslug: old-slug\ndate: 2026-08-14\n---\n# Imported',
      'old-slug.md',
      '2026-08-15',
      'upload-value',
    );

    expect(post.slug).toBe('260814-uploadva');
    expect(post.date).toBe('2026-08-14');
  });

  it('generates distinct slugs for multiple Markdown uploads on the same date', () => {
    const first = buildPostDataFromMarkdown('# First', 'post.md', '2026-08-14', 'first-value');
    const second = buildPostDataFromMarkdown('# Second', 'post.md', '2026-08-14', 'second-value');

    expect(first.slug).toBe('260814-firstval');
    expect(second.slug).toBe('260814-secondva');
    expect(first.slug).not.toBe(second.slug);
  });

  it('preserves an existing post publication date, slug, and metadata', () => {
    const post = createPostEditData({
      filename: 'stable-slug.md',
      slug: 'stable-slug',
      date: '2000-01-01',
      title: 'Existing post',
      description: 'Description',
      content: 'Body',
      category: '随笔, 技术',
      cover: '/cover.png',
    }, '2026-08-15');

    expect(post).toEqual({
      title: 'Existing post',
      date: '2000-01-01',
      description: 'Description',
      content: 'Body',
      slug: 'stable-slug',
      category: ['随笔', '技术'],
      cover: '/cover.png',
      adminOnly: false,
    });
  });
});
