import { getRenderedPost } from "@/lib/content";
import TocRail from "@/components/toc-rail";
import Comments from "@/components/comments";
import CodeCopy from "@/components/code-copy";
import { PostNotFound } from "@/components/post-not-found";

export const dynamicParams = true;

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  let data: Awaited<ReturnType<typeof getRenderedPost>> | null = null;

  try {
    data = await getRenderedPost(slug);
  } catch (error) {
    console.error(`Failed to render post "${slug}":`, error);
    data = null;
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PostNotFound />
      </div>
    );
  }

  const { post, html, toc } = data;

  return (
    <div className="max-w-3xl mx-auto pt-12 pb-32 px-6">
      <TocRail toc={toc} />
      <div className="bg-transparent">
        <header className="mb-10" data-post-title-block>
          <div className="flex items-center gap-3 text-[11px] font-mono text-hud-muted mb-4 uppercase tracking-[0.24em]">
            <span>POST / {post.category || 'SECURITY'}</span>
            <span className="h-[1px] w-8 bg-hud-line"></span>
            <span>{post.date}</span>
          </div>
          <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-[1.2] text-hud-strong tracking-[-0.03em] mb-6">
            {post.title}
          </h1>
        </header>

        <div className="mt-10 border-t border-hud-line pt-10">
          <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
          <CodeCopy />
        </div>
        <Comments
          pageId={slug}
          pageTitle={post.title}
        />
      </div>
    </div>
  );
}
