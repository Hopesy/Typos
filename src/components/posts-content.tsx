'use client';

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Post {
    slug: string;
    title: string;
    date: string;
    description: string;
    category?: string;
}

interface PostsContentProps {
    initialPosts: Post[];
}

export function PostsContent({ initialPosts }: PostsContentProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("全部");

    const categories = useMemo(() => {
        const cats = new Set(initialPosts.map(p => p.category).filter(Boolean));
        return ["全部", ...Array.from(cats)];
    }, [initialPosts]);

    const filteredPosts = useMemo(() => {
        if (selectedCategory === "全部") return initialPosts;
        return initialPosts.filter(p => p.category === selectedCategory);
    }, [initialPosts, selectedCategory]);

    return (
        <div className="space-y-12">
            {/* Category Filter - Simplified */}
            <section className="mb-12">

                <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 px-4">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category!)}
                            className={`relative transition-all duration-300 hover:text-white cursor-pointer font-mono text-[10px] uppercase tracking-widest ${selectedCategory === category ? "text-white" : "text-white/40"
                                }`}
                        >
                            <span className="relative z-10">{category}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Posts List - Enhanced HUD Style Cards */}
            <section className="mx-auto max-w-3xl space-y-4">
                {filteredPosts.map((post) => (
                    <a key={post.slug} href={`/posts/${encodeURIComponent(post.slug.trim())}`} className="block group">
                        <Card className="rounded-none border-white/5 bg-transparent hover:bg-white/[0.02] transition-all duration-500 relative overflow-hidden p-1">

                            <CardHeader className="gap-2 px-6 py-4 pr-12">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div className="flex items-center gap-4">
                                            <CardTitle className="text-base font-bold text-white/80 group-hover:text-white transition-colors tracking-tight">
                                                {post.title}
                                            </CardTitle>
                                            {post.category && (
                                                <span className="text-[9px] font-mono px-2 py-0.5 border border-white/5 text-white/20 uppercase tracking-widest group-hover:text-white/40 group-hover:border-white/20 transition-all">
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>
                                        <CardDescription className="text-white/30 text-[13px] leading-relaxed group-hover:text-white/50 transition-colors">
                                            {post.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {/* <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors">
                                            {post.date}
                                        </span> */}
                                    </div>
                                </div>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                    <ChevronRight className="h-3.5 w-3.5 text-white/15 group-hover:text-white/45 transition-colors duration-300" />
                                </span>
                            </CardHeader>
                        </Card>
                    </a>
                ))}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-white/5">
                        <span className="font-mono text-[10px] text-white/10 uppercase tracking-[0.3em]">
                            NO_MODULES_DETECTED
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}
