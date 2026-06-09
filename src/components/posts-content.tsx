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
                            className={`relative transition-all duration-300 hover:text-hud-strong cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] ${selectedCategory === category ? "text-hud-strong" : "text-hud-muted"
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
                        <Card className="rounded-none border-hud-line-soft bg-transparent hover:bg-hud-panel transition-all duration-500 relative overflow-hidden p-1">

                            <CardHeader className="gap-2 px-6 py-4 pr-12">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div className="flex items-center gap-4">
                                            <CardTitle className="text-[17px] font-bold text-hud-strong transition-colors tracking-tight">
                                                {post.title}
                                            </CardTitle>
                                            {post.category && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 border border-hud-line-soft text-hud-dim uppercase tracking-[0.16em] group-hover:text-hud-muted group-hover:border-hud-line-strong transition-all">
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>
                                        <CardDescription className="text-hud-muted text-sm leading-relaxed transition-colors">
                                            {post.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-1" />
                                </div>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                                    <ChevronRight className="h-3.5 w-3.5 text-hud-faint group-hover:text-hud-muted transition-colors duration-300" />
                                </span>
                            </CardHeader>
                        </Card>
                    </a>
                ))}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-hud-line-soft">
                        <span className="font-mono text-[11px] text-hud-faint uppercase tracking-[0.22em]">
                            NO_MODULES_DETECTED
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}
