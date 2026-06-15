import { getAllPosts } from "@/lib/content";
import { PostsContent } from "@/components/posts-content";

export const dynamic = 'force-dynamic';

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export default async function PostsPage() {
  const posts = await getAllPosts() as Post[];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PostsContent initialPosts={posts} />
    </div>
  );
}
