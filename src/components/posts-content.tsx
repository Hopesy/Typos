'use client';

import { useState, useMemo } from "react";
import { ChevronRight, Search, LayoutGrid, List } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const ALL_CATEGORY = "__all__";

interface Post {
    slug: string;
    title: string;
    date: string;
    description: string;
    category?: string;
    cover?: string;
}

interface PostsContentProps {
    initialPosts: Post[];
}

export function PostsContent({ initialPosts }: PostsContentProps) {
    const t = useTranslations('posts');
    const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const categories = useMemo(() => {
        const cats = new Set(initialPosts.map(p => p.category).filter(Boolean));
        return [ALL_CATEGORY, ...Array.from(cats)];
    }, [initialPosts]);

    const filteredPosts = useMemo(() => {
        let posts = initialPosts;

        // 按分类筛选
        if (selectedCategory !== ALL_CATEGORY) {
            posts = posts.filter(p => p.category === selectedCategory);
        }

        // 按搜索词筛选
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            posts = posts.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        return posts;
    }, [initialPosts, selectedCategory, searchQuery]);

    return (
        <div className="space-y-8">
            {/* Search Bar - HUD Style */}
            <section className="mx-auto max-w-2xl">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-hud-faint pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-transparent border border-hud-line px-12 py-3 text-sm font-mono text-hud-strong placeholder:text-hud-faint outline-none focus:border-hud-line-strong transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-hud-faint hover:text-hud-strong transition-colors"
                        >
                            [ {t('clear')} ]
                        </button>
                    )}
                </div>
            </section>

            {/* Category Filter with View Toggle */}
            <section className="mb-4">
                <div className="flex items-center justify-center gap-6 px-4">
                    {/* View Toggle Button */}
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                        className="flex-shrink-0 h-8 w-8 flex items-center justify-center border border-hud-line bg-transparent hover:border-hud-line-strong hover:bg-hud-panel/20 transition-colors"
                        title={viewMode === 'list' ? '切换到卡片视图' : '切换到列表视图'}
                    >
                        {viewMode === 'list' ? (
                            <LayoutGrid className="h-3.5 w-3.5 text-hud-muted" />
                        ) : (
                            <List className="h-3.5 w-3.5 text-hud-muted" />
                        )}
                    </button>

                    {/* Category Tags */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category!)}
                                className={`relative transition-all duration-300 hover:text-hud-strong cursor-pointer font-mono text-[13px] uppercase tracking-[0.18em] ${selectedCategory === category ? "text-hud-strong" : "text-hud-muted"
                                    }`}
                            >
                                <span className="relative z-10">{category === ALL_CATEGORY ? t('all') : category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Posts List/Grid - Enhanced HUD Style Cards */}
            <section className="mx-auto max-w-3xl">
                {viewMode === 'list' ? (
                    /* List View */
                    <div className="space-y-4">
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
                    </div>
                ) : (
                    /* Grid View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredPosts.map((post) => (
                            <a key={post.slug} href={`/posts/${encodeURIComponent(post.slug.trim())}`} className="block group">
                                <div className="border border-hud-line-soft bg-transparent hover:bg-hud-panel transition-all duration-500 overflow-hidden p-1">
                                    {/* Cover Image (or placeholder) with Hover Overlay */}
                                    <div className="relative w-full aspect-[2/1] overflow-hidden bg-hud-panel/10">
                                        {post.cover ? (
                                            <img
                                                src={post.cover}
                                                alt={post.title}
                                                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-500"
                                            />
                                        ) : (
                                            /* Placeholder when no cover */
                                            <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--hud-line-soft)_6px,var(--hud-line-soft)_7px)] opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-hud-faint">
                                                    NO_SIGNAL
                                                </span>
                                            </div>
                                        )}
                                        {/* Hover Overlay with Description - Bottom Aligned */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 pt-8">
                                            <p className="text-neutral-300 text-[11px] leading-relaxed line-clamp-3">
                                                {post.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-2 py-1.5 flex flex-row items-center gap-2 border-t border-hud-line-soft">
                                        {/* Meta Info - Single Line, Minimal Height */}
                                        {post.category && (
                                            <span className="flex-shrink-0 px-1 py-0.5 border border-hud-line-soft text-hud-dim uppercase tracking-wider group-hover:text-hud-muted transition-colors text-[9px] font-mono">
                                                {post.category}
                                            </span>
                                        )}
                                        <span className="text-hud-strong text-[11px] truncate flex-1 font-medium">{post.title}</span>
                                        <span className="text-hud-faint flex-shrink-0 text-[9px] font-mono">{post.date}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-hud-line-soft">
                        <span className="font-mono text-[11px] text-hud-faint uppercase tracking-[0.22em]">
                            {searchQuery ? t('noResults') : 'NO_MODULES_DETECTED'}
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}
