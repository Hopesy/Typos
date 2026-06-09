import { getPostBySlug } from "@/lib/content";
import MarkdownContent from "@/components/markdown-content";
import Comments from "@/components/comments";
import TocRail from "@/components/toc-rail";

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  let post: Awaited<ReturnType<typeof getPostBySlug>> | null = null;

  try {
    post = await getPostBySlug(slug);
  } catch (error) {
    console.error(`Failed to render post "${slug}":`, error);
    post = null;
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">文章未找到</h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-24 pb-32 px-6">
      <div className="bg-transparent">
        <header className="mb-12" data-post-title-block>
          <div className="flex items-center gap-3 text-[11px] font-mono text-hud-muted mb-4 uppercase tracking-[0.24em]">
            <span>POST / {post.category || 'SECURITY'}</span>
            <span className="h-[1px] w-8 bg-hud-line"></span>
            <span>{post.date}</span>
          </div>
          <h1 className="text-[clamp(2rem,7vw,3.25rem)] font-extrabold leading-[1.16] text-hud-strong tracking-[-0.045em] mb-6">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-hud-muted font-mono italic">
            <span>AUTHOR: </span>
            <span className="text-hud underline decoration-hud-line underline-offset-4">Author</span>
          </div>
        </header>

        <div className="mt-12 border-t border-hud-line pt-12">

          <div className="relative">
            <MarkdownContent
              html={post.html}
              className="prose max-w-none"
            />

            {post.toc.length > 0 ? <TocRail toc={post.toc} /> : null}
          </div>
        </div>
        <Comments
          pageId={slug}
          pageTitle={post.title}
        />
      </div>
    </div>
  );
}
