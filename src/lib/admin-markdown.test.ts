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

  it('uses a unique dated fallback when an imported Markdown filename has no usable slug', () => {
    const post = buildPostDataFromMarkdown('# Imported', '', '2026-08-14', 'upload-value');

    expect(post.slug).toBe('260814-uploadva');
  });

  it('prepares an existing post with the current date while preserving its slug and metadata', () => {
    const post = createPostEditData({
      filename: 'stable-slug.md',
      slug: 'stable-slug',
      title: 'Existing post',
      description: 'Description',
      content: 'Body',
      category: '随笔, 技术',
      cover: '/cover.png',
    }, '2026-08-15');

    expect(post).toEqual({
      title: 'Existing post',
      date: '2026-08-15',
      description: 'Description',
      content: 'Body',
      slug: 'stable-slug',
      category: ['随笔', '技术'],
      cover: '/cover.png',
    });
  });
});
