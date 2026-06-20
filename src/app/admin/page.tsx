'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    FiSave,
    FiTerminal,
    FiImage,
    FiEdit3,
    FiLock,
    FiAlertTriangle,
    FiHome,
    FiLogOut,
    FiCheck,
    FiPlus,
    FiList,
    FiTrash2,
    FiChevronRight,
    FiMessageSquare,
    FiCornerUpLeft,
    FiBarChart2,
    FiTrendingUp,
    FiUpload,
    FiMaximize2,
    FiMinimize2,
    FiKey,
    FiCopy,
    FiDownload
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import TocRail from "@/components/toc-rail";
import { Bold, Italic, Heading2, Heading3, Quote, Link2, Image as ImageIcon, Code, List, SquareCode, ArrowDownUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type AdminType = 'dashboard' | 'post' | 'daily' | 'moment' | 'comment' | 'tokens';

type MdTool =
    | { Icon: LucideIcon; title: string; run: () => void }
    | { divider: true };


type PostData = {
    title: string;
    date: string;
    description: string;
    content: string;
    slug: string;
    category: string[];  // 改为数组支持多分类
    cover: string;
};

type DailyData = {
    title: string;
    date: string;
    imageUrl: string;
    content: string;
};

type MomentData = {
    title: string;
    date: string;
    imageUrl: string;
    content: string;
};

type AdminItem = {
    filename: string;
    date: string;
    id?: string;
    title?: string;
    description?: string;
    content?: string;
    slug?: string;
    imageUrl?: string;
    category?: string;
    nickname?: string;
    contact?: string;
    articleTitle?: string;
    created_at?: string;
    parent_id?: string | null;
    is_admin?: number;
};

type StatusMessage = { text: string; isError: boolean };

type ApiToken = {
    id: string;
    name: string;
    tokenPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
};

type DashboardData = {
    posts: AdminItem[];
    daily: AdminItem[];
    moments: AdminItem[];
};

type ChartRange = '7d' | '30d';

const adminActionButtonClass = "h-8 items-center justify-center gap-1.5 border-neutral-800 bg-neutral-900 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:bg-neutral-800 hover:text-white [&>svg]:shrink-0";
const adminActionButtonTextClass = "leading-none text-trim-caps";

const visitorSeries: Record<ChartRange, number[]> = {
    '7d': [18, 24, 21, 32, 27, 15, 17],
    '30d': [6, 9, 7, 12, 15, 10, 18, 22, 19, 16, 28, 24, 31, 35, 29, 25, 20, 26, 33, 38, 34, 41, 37, 44, 39, 31, 27, 25, 18, 17],
};

const viewSeries: Record<ChartRange, number[]> = {
    '7d': [72, 95, 88, 136, 121, 148, 167],
    '30d': [31, 44, 38, 52, 65, 58, 73, 90, 86, 78, 96, 104, 118, 132, 126, 119, 101, 116, 135, 151, 148, 163, 156, 174, 168, 143, 132, 128, 118, 167],
};

const totalVisits = 1475;

const formatMetric = (value: number) => new Intl.NumberFormat('en-US').format(value);

const getItemTextLength = (item: AdminItem) => {
    return [item.title, item.description, item.content]
        .filter(Boolean)
        .join('\n')
        .trim()
        .length;
};

const buildChartPath = (values: number[], width = 640, height = 210, padding = 30) => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = Math.max(max - min, 1);
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const points = values.map((value, index) => {
        const x = padding + (index / Math.max(values.length - 1, 1)) * innerWidth;
        const y = padding + (1 - (value - min) / span) * innerHeight;
        return [x, y] as const;
    });
    const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L ${(width - padding).toFixed(1)} ${(height - padding).toFixed(1)} L ${padding.toFixed(1)} ${(height - padding).toFixed(1)} Z`;
    return { line, area, points, max };
};

function TrendChart({
    title,
    range,
    onRangeChange,
    values,
    latestKey,
}: {
    title: string;
    range: ChartRange;
    onRangeChange: (range: ChartRange) => void;
    values: number[];
    latestKey: 'latestPeople' | 'latestTimes';
}) {
    const t = useTranslations('admin.chart');
    const { line, area, points, max } = buildChartPath(values);
    const latest = values[values.length - 1] || 0;
    const previous = values[values.length - 2] || latest;
    const delta = latest - previous;
    const grid = [0.2, 0.4, 0.6, 0.8];

    return (
        <section className="rounded-[4px] border border-neutral-900 bg-neutral-950/80 p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-bold text-neutral-200">{title}</h2>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                        {t.rich(latestKey, {
                            value: formatMetric(latest),
                            strong: (chunks) => <span className="text-neutral-400">{chunks}</span>,
                        })}
                        <span className={delta >= 0 ? 'ml-2 text-green-400/70' : 'ml-2 text-red-400/70'}>
                            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                        </span>
                    </p>
                </div>
                <div className="flex rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-0.5">
                    {(['7d', '30d'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onRangeChange(option)}
                            className={`h-7 rounded-[3px] px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${range === option
                                ? 'bg-neutral-800 text-white'
                                : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            {option === '7d' ? t('range7d') : t('range30d')}
                        </button>
                    ))}
                </div>
            </div>
            <svg viewBox="0 0 640 210" className="h-[230px] w-full overflow-visible" role="img" aria-label={title}>
                <defs>
                    <linearGradient id={`${title}-area`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#75a7ff" stopOpacity="0.36" />
                        <stop offset="100%" stopColor="#75a7ff" stopOpacity="0.04" />
                    </linearGradient>
                </defs>
                {grid.map((lineY) => {
                    const y = 30 + lineY * 150;
                    return <line key={lineY} x1="30" x2="610" y1={y} y2={y} stroke="var(--admin-grid)" strokeWidth="1" />;
                })}
                <line x1="30" x2="610" y1="180" y2="180" stroke="var(--admin-line-strong)" strokeWidth="1" />
                <text x="8" y="35" className="fill-neutral-600 font-mono text-[10px]">{max}</text>
                <text x="14" y="184" className="fill-neutral-600 font-mono text-[10px]">0</text>
                <path d={area} fill={`url(#${title}-area)`} />
                <path d={line} fill="none" stroke="#75a7ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map(([x, y], index) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={index === points.length - 1 ? 4 : 2.5} fill="#75a7ff" stroke="var(--admin-bg)" strokeWidth="2" />
                ))}
                <text x="30" y="205" className="fill-neutral-600 font-mono text-[10px]">{range === '7d' ? t('axis7dStart') : t('axis30dStart')}</text>
                <text x="566" y="205" className="fill-neutral-600 font-mono text-[10px]">{t('axisToday')}</text>
            </svg>
        </section>
    );
}

function DashboardView({
    data,
    loading,
}: {
    data: DashboardData;
    loading: boolean;
}) {
    const tr = useTranslations('admin');
    const [visitorRange, setVisitorRange] = useState<ChartRange>('7d');
    const [viewRange, setViewRange] = useState<ChartRange>('7d');
    const postCount = data.posts.length;
    const totalContent = data.posts.length + data.daily.length + data.moments.length;
    const totalWords = [...data.posts, ...data.daily, ...data.moments].reduce((sum, item) => sum + getItemTextLength(item), 0);

    const cards = [
        { label: tr('dash.posts.label'), value: postCount, meta: tr('dash.posts.meta'), icon: <FiEdit3 className="h-4 w-4" /> },
        { label: tr('dash.words.label'), value: totalWords, meta: tr('dash.words.meta'), icon: <FiTerminal className="h-4 w-4" /> },
        { label: tr('dash.total.label'), value: totalContent, meta: tr('dash.total.meta'), icon: <FiList className="h-4 w-4" /> },
        { label: tr('dash.visits.label'), value: totalVisits, meta: tr('dash.visits.meta'), icon: <FiTrendingUp className="h-4 w-4" /> },
    ];

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <section
                        key={card.label}
                        className="relative overflow-hidden rounded-[4px] border border-neutral-900 bg-neutral-950 p-5 shadow-sm"
                    >
                        <div className="absolute right-4 top-4 text-neutral-700">{card.icon}</div>
                        <p className="text-sm font-bold text-neutral-500">{card.label}</p>
                        <div className="mt-5 text-4xl font-semibold tracking-tight text-neutral-100">
                            {loading ? '...' : formatMetric(card.value)}
                        </div>
                        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">{card.meta}</p>
                    </section>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <TrendChart
                    title={tr('chart.visitors')}
                    range={visitorRange}
                    onRangeChange={setVisitorRange}
                    values={visitorSeries[visitorRange]}
                    latestKey="latestPeople"
                />
                <TrendChart
                    title={tr('chart.views')}
                    range={viewRange}
                    onRangeChange={setViewRange}
                    values={viewSeries[viewRange]}
                    latestKey="latestTimes"
                />
            </div>
        </div>
    );
}

function TokensView({
    tokens,
    loading,
    dbUnavailable,
    deleteTokenId,
    onRequestDelete,
    onConfirmDelete,
}: {
    tokens: ApiToken[];
    loading: boolean;
    dbUnavailable: boolean;
    deleteTokenId: string | null;
    onRequestDelete: (id: string) => void;
    onConfirmDelete: (id: string) => void;
}) {
    const tr = useTranslations('admin');
    const [nowMs] = useState(() => Date.now());
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.com';
    const endpoint = `${origin}/api/v1/posts`;

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        const ts = Date.parse(expiresAt.replace(' ', 'T') + 'Z');
        return !Number.isNaN(ts) && ts <= nowMs;
    };

    const curlExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer typos_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Post",
    "date": "2026-06-15",
    "category": ["随笔"],
    "content": "# Hello\\n\\nMarkdown body here."
  }'`;

    const markdownExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer typos_xxx" \\
  -H "Content-Type: text/markdown" \\
  --data-binary @post.md`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {dbUnavailable ? (
                <div className="py-12 text-center border border-dashed border-neutral-900 rounded-lg bg-neutral-900/20">
                    <p className="text-neutral-600 font-mono text-xs tracking-wide">{tr('tokens.needDb')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center gap-3 animate-pulse">
                            <div className="h-4 w-48 bg-neutral-900 rounded" />
                            <div className="h-3 w-32 bg-neutral-900 rounded" />
                        </div>
                    ) : tokens.length === 0 ? (
                        <div className="py-12 text-center border border-dashed border-neutral-900 rounded-lg bg-neutral-900/20">
                            <p className="text-neutral-600 font-mono text-xs uppercase tracking-[0.18em]">{tr('tokens.empty')}</p>
                        </div>
                    ) : (
                        tokens.map((token) => {
                            const expired = isExpired(token.expiresAt);
                            return (
                                <div
                                    key={token.id}
                                    className="group flex items-center justify-between p-5 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-800 transition-all shadow-sm"
                                >
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <h3 className="text-sm font-bold text-neutral-200 truncate">{token.name}</h3>
                                            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 tracking-normal shrink-0">{token.tokenPrefix}…</span>
                                            {expired ? (
                                                <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-normal shrink-0">{tr('tokens.expired')}</span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-green-500/70 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 uppercase tracking-normal shrink-0">{tr('tokens.active')}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 font-mono space-x-3">
                                            <span>{tr('tokens.created')}: {token.createdAt}</span>
                                            <span>{tr('tokens.lastUsed')}: {token.lastUsedAt || tr('tokens.neverUsed')}</span>
                                            <span>{tr('tokens.expires')}: {token.expiresAt || tr('tokens.neverExpires')}</span>
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => onRequestDelete(token.id)}
                                            className={`p-2 rounded-md transition-all cursor-pointer ${deleteTokenId === token.id ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100'}`}
                                            title={tr('tokens.delete')}
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                        {deleteTokenId === token.id && (
                                            <div className="absolute right-0 bottom-full mb-2 z-10 p-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 min-w-[160px]">
                                                <p className="text-[10px] font-mono tracking-normal text-neutral-400 mb-2 px-1">{tr('tokens.confirmDelete')}</p>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => onRequestDelete(token.id)}
                                                        className="flex-1 py-1 text-[10px] font-mono uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
                                                    >
                                                        {tr('confirm.no')}
                                                    </button>
                                                    <button
                                                        onClick={() => onConfirmDelete(token.id)}
                                                        className="flex-1 py-1 text-[10px] font-mono uppercase bg-red-900/40 hover:bg-red-900/60 text-red-200 rounded transition-colors border border-red-900/50"
                                                    >
                                                        {tr('confirm.yes')}
                                                    </button>
                                                </div>
                                                <div className="absolute top-full right-3 w-2 h-2 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 -translate-y-1" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* API Documentation */}
            <section className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 space-y-4">
                <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <FiKey className="w-3.5 h-3.5 text-neutral-500" />
                    {tr('tokens.docs.title')}
                </h2>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">{tr('tokens.docs.endpoint')}</p>
                    <code className="block bg-neutral-900 rounded px-3 py-2 text-xs font-mono text-blue-400 break-all">POST {endpoint}</code>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">{tr('tokens.docs.jsonExample')}</p>
                    <pre className="bg-neutral-900 rounded px-3 py-2 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre">{curlExample}</pre>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">{tr('tokens.docs.markdownExample')}</p>
                    <pre className="bg-neutral-900 rounded px-3 py-2 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre">{markdownExample}</pre>
                </div>
                <p className="text-[10px] text-amber-500/70 font-mono leading-relaxed">⚠ {tr('tokens.docs.note')}</p>
            </section>
        </div>
    );
}


const fencePattern = /^\s*```([^\s`]*)?.*$/;

const cleanFrontmatterValue = (value: string) => {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
};

const parseMarkdownUpload = (raw: string) => {
    const source = raw.replace(/^\uFEFF/, '');
    const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(source);

    if (!match) {
        return { data: {} as Record<string, string>, content: source };
    }

    const data: Record<string, string> = {};
    for (const line of match[1].split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separator = trimmed.indexOf(':');
        if (separator <= 0) continue;

        const key = trimmed.slice(0, separator).trim().toLowerCase();
        data[key] = cleanFrontmatterValue(trimmed.slice(separator + 1));
    }

    return { data, content: match[2] || '' };
};

const safeSlug = (value: string, fallback: string) => {
    const slug = value
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        ?.replace(/\.md$/i, '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || '';

    return slug || fallback;
};

const titleFromMarkdown = (content: string) => {
    let inCodeBlock = false;

    for (const line of content.replace(/\r\n/g, '\n').split('\n')) {
        if (fencePattern.test(line)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (inCodeBlock) continue;

        const heading = line.match(/^#\s+(.+)$/);
        if (heading?.[1]) return heading[1].trim();
    }

    return '';
};

const titleFromFilename = (filename: string) => {
    return filename
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        ?.replace(/\.md$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim() || 'Untitled';
};

// 下载用文件名：优先文章标题，清洗掉文件系统非法字符（保留中文），回退到原 filename。
const downloadNameFromItem = (item: AdminItem) => {
    const title = (item.title || '').trim();
    if (!title) return item.filename;
    const safe = title
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, ' ')
        .replace(/^[-.\s]+|[-.\s]+$/g, '')
        .trim();
    return safe ? `${safe}.md` : item.filename;
};

const buildPostDataFromMarkdown = (raw: string, filename: string, fallbackDate: string): PostData => {
    const { data, content } = parseMarkdownUpload(raw);
    const fallbackSlug = fallbackDate.replace(/-/g, '').slice(2);
    const fileSlug = safeSlug(filename, fallbackSlug);

    // 解析分类，支持字符串或数组
    let categories: string[] = [];
    if (data.category) {
        if (typeof data.category === 'string') {
            categories = data.category.split(',').map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(data.category)) {
            categories = data.category;
        }
    } else if (data.categories) {
        if (typeof data.categories === 'string') {
            categories = data.categories.split(',').map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(data.categories)) {
            categories = data.categories;
        }
    }

    return {
        title: data.title || titleFromMarkdown(content) || titleFromFilename(filename),
        date: (data.date || fallbackDate).split('T')[0],
        description: data.description || '',
        content: content.trimStart(),
        slug: safeSlug(data.slug || fileSlug, fallbackSlug),
        category: categories.length > 0 ? categories : ['随笔'],
        cover: data.cover || '',
    };
};

export default function AdminPage() {
    const postContentRef = useRef<HTMLTextAreaElement | null>(null);
    const postUploadInputRef = useRef<HTMLInputElement | null>(null);
    const tr = useTranslations('admin');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [type, setType] = useState<AdminType>('dashboard');
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState<StatusMessage | null>(null);


    // Form states
    const today = new Date().toISOString().split('T')[0];
    const defaultSlug = today.replace(/-/g, '').slice(2); // YYMMDD

    const [postData, setPostData] = useState<PostData>({ title: '', date: today, description: '', content: '', slug: defaultSlug, category: ['随笔'], cover: '' });
    const [isSlugModified, setIsSlugModified] = useState(false);
    const [categoryInput, setCategoryInput] = useState('');
    const [dailyData, setDailyData] = useState<DailyData>({ title: '', date: today, imageUrl: '', content: '' });
    const [momentData, setMomentData] = useState<MomentData>({ title: '', date: today, imageUrl: '', content: '' });
    const [existingPosts, setExistingPosts] = useState<AdminItem[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData>({ posts: [], daily: [], moments: [] });
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFilename, setCurrentFilename] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'list'>('list');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isImmersiveMode, setIsImmersiveMode] = useState(false);

    // 文章预览：在浏览器内复用文章页同一套渲染管线（renderArticle），
    // CPU 花在本机而非 Worker，规避 Cloudflare Free 套餐的 1102（见 docs/CLOUDFLARE_CPU_LIMITS.md）。
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewToc, setPreviewToc] = useState<{ depth: number; text: string; id: string }[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    // 最近一次客户端渲染结果（与当前正文对应），保存时一并送往服务端预热 D1 缓存（方案 C）。
    const lastRenderRef = useRef<{ content: string; html: string; toc: { depth: number; text: string; id: string }[] } | null>(null);
    // 原文 / 预览同步滚动开关。
    const [scrollSync, setScrollSync] = useState(false);
    const previewScrollRef = useRef<HTMLDivElement | null>(null);
    const scrollSyncLock = useRef(false);

    // API Token state
    const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
    const [tokensLoading, setTokensLoading] = useState(false);
    const [tokensDbUnavailable, setTokensDbUnavailable] = useState(false);
    const [createTokenModalOpen, setCreateTokenModalOpen] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [newTokenExpiry, setNewTokenExpiry] = useState<'never' | '30d' | '90d' | '1y'>('never');
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [tokenCopied, setTokenCopied] = useState(false);
    const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);

    // Delete Confirmation State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Reply Dialog State

    const [replyTarget, setReplyTarget] = useState<AdminItem | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyModalOpen, setReplyModalOpen] = useState(false);


    // Helper to format date to slug
    const dateToSlug = (dateStr: string) => {
        return dateStr.replace(/-/g, '').slice(2);
    };

    // Handle Authentication
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(false);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsAuthorized(true);
                setPassword('');
            } else {
                setAuthError(true);
                setPassword('');
            }
        } catch {
            setAuthError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            setDashboardLoading(true);
            const [postsRes, dailyRes, momentsRes] = await Promise.all(
                ['post', 'daily', 'moment'].map((targetType) => fetch(`/api/admin/list?type=${targetType}`, {
                    credentials: 'same-origin'
                }))
            );

            if ([postsRes, dailyRes, momentsRes].some((res) => res.status === 401)) {
                setIsAuthorized(false);
                return;
            }

            const [postsData, dailyDataRes, momentsData] = await Promise.all([
                postsRes.json() as Promise<{ items: AdminItem[] }>,
                dailyRes.json() as Promise<{ items: AdminItem[] }>,
                momentsRes.json() as Promise<{ items: AdminItem[] }>,
            ]);

            setDashboardData({
                posts: postsData.items || [],
                daily: dailyDataRes.items || [],
                moments: momentsData.items || [],
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setDashboardLoading(false);
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        if (type === 'dashboard') {
            await fetchDashboardData();
            return;
        }

        try {
            setListLoading(true);
            const res = await fetch(`/api/admin/list?type=${type}`, { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json() as { items: AdminItem[] };
                setExistingPosts(data.items || []);
            } else {
                if (res.status === 401) setIsAuthorized(false);
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setListLoading(false);
        }

    }, [fetchDashboardData, type]);

    const fetchTokens = useCallback(async () => {
        try {
            setTokensLoading(true);
            setTokensDbUnavailable(false);
            const res = await fetch('/api/admin/tokens', { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json() as { tokens: ApiToken[] };
                setApiTokens(data.tokens || []);
            } else if (res.status === 401) {
                setIsAuthorized(false);
            } else if (res.status === 503) {
                setTokensDbUnavailable(true);
                setApiTokens([]);
            }
        } catch (error) {
            console.error('Failed to fetch tokens', error);
        } finally {
            setTokensLoading(false);
        }
    }, []);

    const handleCreateToken = async () => {
        if (!newTokenName.trim()) return;
        const expiryMap: Record<typeof newTokenExpiry, number | null> = {
            never: null,
            '30d': 30,
            '90d': 90,
            '1y': 365,
        };

        setLoading(true);
        try {
            const res = await fetch('/api/admin/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ name: newTokenName.trim(), expiresInDays: expiryMap[newTokenExpiry] }),
            });
            if (res.ok) {
                const data = await res.json() as { token: string };
                setCreatedToken(data.token);
                setCreateTokenModalOpen(false);
                setNewTokenName('');
                setNewTokenExpiry('never');
                await fetchTokens();
            } else if (res.status === 401) {
                setIsAuthorized(false);
            } else {
                const err = await res.json() as { error?: string };
                setMessage({ text: `ERROR: ${err.error || 'Failed to create token'}`, isError: true });
            }
        } catch (error) {
            console.error('Create token error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteToken = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/tokens', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setApiTokens(prev => prev.filter(t => t.id !== id));
                setDeleteTokenId(null);
            } else if (res.status === 401) {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error('Delete token error:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToken = async (token: string) => {
        try {
            await navigator.clipboard.writeText(token);
            setTokenCopied(true);
            setTimeout(() => setTokenCopied(false), 2000);
        } catch {
            // Clipboard API may be unavailable; ignore silently
        }
    };


    useEffect(() => {
        let alive = true;

        async function checkSession() {
            try {
                const res = await fetch('/api/admin/auth', { credentials: 'same-origin' });
                const data = await res.json() as { authorized?: boolean };
                if (!alive) return;
                setIsAuthorized(Boolean(res.ok && data.authorized));
            } catch {
                if (alive) setIsAuthorized(false);
            } finally {
                if (alive) setCheckingAuth(false);
            }
        }

        checkSession();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (viewMode === 'list' && isAuthorized) {
            const timer = window.setTimeout(() => {
                fetchPosts();
            }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [viewMode, isAuthorized, fetchPosts]);

    useEffect(() => {
        if (type === 'tokens' && isAuthorized) {
            const timer = window.setTimeout(() => {
                fetchTokens();
            }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [type, isAuthorized, fetchTokens]);

    // 防抖请求服务端渲染预览（与文章页同一管线）。仅在编辑文章时启用。
    useEffect(() => {
        if (viewMode !== 'edit' || type !== 'post') return;

        const source = postData.content;
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            if (!source.trim()) {
                setPreviewHtml('');
                setPreviewToc([]);
                setPreviewLoading(false);
                lastRenderRef.current = { content: source, html: '', toc: [] };
                return;
            }

            setPreviewLoading(true);
            try {
                // 浏览器内渲染：与文章页 / 发布后完全同一套管线（remark/rehype + Shiki + KaTeX）。
                const { renderArticle } = await import('@/components/markdown-renderer');
                const { html, toc } = await renderArticle(source);
                if (cancelled) return;
                setPreviewHtml(html);
                setPreviewToc(toc);
                lastRenderRef.current = { content: source, html, toc };
            } catch (error) {
                if (!cancelled) console.error('Preview render error:', error);
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        }, 400);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [postData.content, viewMode, type]);

    // ESC key handler for immersive mode
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isImmersiveMode) {
                setIsImmersiveMode(false);
            }
        };

        if (isImmersiveMode) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isImmersiveMode]);

    // 通知统一以 toast 形式呈现，3.2s 后自动消失。
    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(() => setMessage(null), 3200);
        return () => window.clearTimeout(timer);
    }, [message]);

    // 原文与预览按滚动百分比同步。开启后任一侧滚动都会驱动另一侧。
    useEffect(() => {
        if (!(viewMode === 'edit' && type === 'post') || !scrollSync) return;
        const source = postContentRef.current;
        const preview = previewScrollRef.current;
        if (!source || !preview) return;

        const sync = (from: HTMLElement, to: HTMLElement) => {
            if (scrollSyncLock.current) return;
            scrollSyncLock.current = true;
            const fromMax = from.scrollHeight - from.clientHeight;
            const toMax = to.scrollHeight - to.clientHeight;
            to.scrollTop = fromMax > 0 ? (from.scrollTop / fromMax) * toMax : 0;
            requestAnimationFrame(() => { scrollSyncLock.current = false; });
        };

        const onSource = () => sync(source, preview);
        const onPreview = () => sync(preview, source);
        source.addEventListener('scroll', onSource, { passive: true });
        preview.addEventListener('scroll', onPreview, { passive: true });
        return () => {
            source.removeEventListener('scroll', onSource);
            preview.removeEventListener('scroll', onPreview);
        };
    }, [viewMode, type, scrollSync, previewHtml, isImmersiveMode]);

    const handleEditPost = (item: AdminItem) => {
        if (type === 'comment' || type === 'dashboard') return;

        if (type === 'post') {
            // Parse category: handle both string and array formats
            let categories: string[] = ['随笔'];
            if (item.category) {
                if (typeof item.category === 'string') {
                    categories = item.category.split(',').map(c => c.trim()).filter(Boolean);
                } else if (Array.isArray(item.category)) {
                    categories = item.category;
                }
            }

            setPostData({
                title: item.title || '',
                date: item.date,
                description: item.description || '',
                content: item.content || '',
                slug: item.slug || defaultSlug,
                category: categories.length > 0 ? categories : ['随笔'],
                cover: ''
            });
        } else if (type === 'daily') {
            setDailyData({
                title: item.title || '',
                date: item.date,
                content: item.content || '',
                imageUrl: item.imageUrl || ''
            });
        } else if (type === 'moment') {
            setMomentData({
                title: item.title || '',
                date: item.date,
                imageUrl: item.imageUrl || '',
                content: item.content || ''
            });
        }

        setCurrentFilename(item.filename);
        setIsEditing(true);
        setViewMode('edit');
    };

    const resetPostEditorState = () => {
        setPostData({ title: '', date: today, description: '', content: '', slug: defaultSlug, category: ['随笔'], cover: '' });
        setIsSlugModified(false);
        setIsEditing(false);
        setCurrentFilename(null);
    };

    const handleNewPost = () => {
        resetPostEditorState();
        setViewMode('edit');
    };

    const handleNewItem = () => {
        if (type === 'post') {
            handleNewPost();
        } else if (type === 'daily') {
            setDailyData({ title: '', date: today, imageUrl: '', content: '' });
            setIsEditing(false);
            setCurrentFilename(null);
            setViewMode('edit');
        } else if (type === 'moment') {
            setMomentData({ title: '', date: today, imageUrl: '', content: '' });
            setIsEditing(false);
            setCurrentFilename(null);
            setViewMode('edit');
        }
    };

    const updatePostContent = (content: string) => {
        setPostData(prev => ({ ...prev, content }));
    };

    const insertPostMarkdown = (before: string, after = '', placeholder = 'text') => {
        const textarea = postContentRef.current;
        const current = postData.content;
        const start = textarea?.selectionStart ?? current.length;
        const end = textarea?.selectionEnd ?? current.length;
        const selected = current.slice(start, end) || placeholder;
        const nextContent = `${current.slice(0, start)}${before}${selected}${after}${current.slice(end)}`;

        updatePostContent(nextContent);

        requestAnimationFrame(() => {
            textarea?.focus();
            const cursorStart = start + before.length;
            const cursorEnd = cursorStart + selected.length;
            textarea?.setSelectionRange(cursorStart, cursorEnd);
        });
    };

    // Markdown 快捷工具：图标化、分组，编辑器与沉浸模式工具栏共用。
    const mdTools: MdTool[] = [
        { Icon: Bold, title: 'Bold', run: () => insertPostMarkdown('**', '**', 'bold text') },
        { Icon: Italic, title: 'Italic', run: () => insertPostMarkdown('*', '*', 'italic text') },
        { divider: true },
        { Icon: Heading2, title: 'Heading 2', run: () => insertPostMarkdown('## ', '', 'Heading') },
        { Icon: Heading3, title: 'Heading 3', run: () => insertPostMarkdown('### ', '', 'Subheading') },
        { divider: true },
        { Icon: Quote, title: 'Quote', run: () => insertPostMarkdown('> ', '', tr('md.quote')) },
        { Icon: List, title: 'List', run: () => insertPostMarkdown('- ', '', 'list item') },
        { divider: true },
        { Icon: Link2, title: 'Link', run: () => insertPostMarkdown('[', '](https://)', 'link text') },
        { Icon: ImageIcon, title: 'Image', run: () => insertPostMarkdown('![', '](https://)', 'image alt') },
        { Icon: Code, title: 'Inline code', run: () => insertPostMarkdown('`', '`', 'code') },
        { Icon: SquareCode, title: 'Code block', run: () => insertPostMarkdown('```\n', '\n```', 'code block') },
    ];

    const renderMdTools = () =>
        mdTools.map((tool, index) => {
            if ('divider' in tool) {
                return <span key={`md-div-${index}`} className="mx-1 h-5 w-px bg-neutral-800/70" aria-hidden />;
            }
            const Icon = tool.Icon;
            return (
                <button
                    key={tool.title}
                    type="button"
                    title={tool.title}
                    aria-label={tool.title}
                    onClick={tool.run}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                </button>
            );
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        let data: (PostData & { filename?: string | null; rendered?: { html: string; toc: { depth: number; text: string; id: string }[] } }) | (DailyData & { filename?: string | null }) | MomentData;
        if (type === 'post') {
            data = { ...postData, filename: currentFilename };
            // 方案 C：发布时确保带上与当前正文匹配的客户端渲染结果，服务端直接写入
            // D1 渲染缓存，无需在 Worker 重跑 Shiki/KaTeX。
            let rendered = lastRenderRef.current;
            // 预览防抖未跑完 / 正文已变：发布前在客户端当场补渲染一次，避免落到 Worker 兜底。
            if (postData.content.trim() && (!rendered || rendered.content !== postData.content || !rendered.html)) {
                try {
                    const { renderArticle } = await import('@/components/markdown-renderer');
                    const { html, toc } = await renderArticle(postData.content);
                    rendered = { content: postData.content, html, toc };
                    lastRenderRef.current = rendered;
                } catch (error) {
                    // 客户端渲染异常（极少数，如内容触发管线 bug）：不带 rendered，
                    // 由服务端按需兜底渲染一次，保证发布不被阻断。
                    console.error('Publish-time render failed:', error);
                    rendered = null;
                }
            }
            if (rendered && rendered.content === postData.content && rendered.html) {
                data.rendered = { html: rendered.html, toc: rendered.toc };
            }
        }
        else if (type === 'daily') data = { ...dailyData, filename: currentFilename };
        else if (type === 'moment') data = momentData;
        else return;

        try {
            const res = await fetch('/api/admin/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ type, data }),
            });

            if (res.status === 401) {
                setIsAuthorized(false);
                setMessage({ text: 'PERMISSION_DENIED: AUTH_EXPIRED', isError: true });
                return;
            }

            const result = await res.json() as { success?: boolean; error?: string };
            if (result.success) {
                setMessage({ text: `SUCCESS: ${type.toUpperCase()} SAVED`, isError: false });
                if (type === 'post') {
                    resetPostEditorState();
                } else if (type === 'daily') {
                    setDailyData({ title: '', date: today, imageUrl: '', content: '' });
                } else if (type === 'moment') {
                    setMomentData({ title: '', date: today, imageUrl: '', content: '' });
                }
                // 发布/更新成功后统一刷新列表并回到列表视图（post/daily/moment 一致）。
                setCurrentFilename(null);
                setIsEditing(false);
                await fetchPosts();
                setViewMode('list');

                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ text: `ERROR: ${result.error}`, isError: true });
            }
        } catch {
            setMessage({ text: 'NETWORK ERROR: CONNECTION LOST', isError: true });
        } finally {
            setLoading(false);
        }
    };

    const handlePostMarkdownUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        input.value = '';

        if (!file) return;

        setMessage(null);

        try {
            if (!file.name.toLowerCase().endsWith('.md')) {
                setMessage({ text: 'ERROR: SELECT_A_MARKDOWN_FILE', isError: true });
                return;
            }

            const raw = await file.text();
            const importedPost = buildPostDataFromMarkdown(raw, file.name, today);
            setType('post');
            setPostData(importedPost);
            setIsSlugModified(true);
            setIsEditing(false);
            setCurrentFilename(null);
            setViewMode('edit');
            setMessage({ text: `MARKDOWN_LOADED: ${file.name}`, isError: false });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ text: 'ERROR: MARKDOWN_FILE_READ_FAILED', isError: true });
        }
    };

    const handleReply = (e: React.MouseEvent, item: AdminItem) => {
        e.stopPropagation();
        setReplyTarget(item);
        setReplyContent('');
        setReplyModalOpen(true);
    };

    const submitAdminReply = async () => {
        if (!replyTarget || !replyContent.trim()) return;
        if (!replyTarget.id || !replyTarget.slug) {
            setMessage({ text: 'ERROR: INVALID_COMMENT_TARGET', isError: true });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    slug: replyTarget.slug,
                    nickname: 'Admin',
                    content: replyContent,
                    parent_id: replyTarget.id
                }),
            });
            if (res.ok) {
                setMessage({ text: 'SUCCESS: REPLY_SENT', isError: false });
                setReplyModalOpen(false);
                setReplyTarget(null);
                setReplyContent('');
                fetchPosts();
            } else {
                setMessage({ text: 'ERROR: FAILED_TO_REPLY', isError: true });
            }
        } catch (error) {
            console.error('Reply error:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = (e: React.MouseEvent, filename: string) => {
        e.stopPropagation();
        setDeleteTargetId(deleteTargetId === filename ? null : filename);
    };

    const confirmDelete = async (targetType: AdminType, filename: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    type: targetType,
                    filename: filename
                })
            });

            if (res.ok) {
                setExistingPosts(prev => prev.filter(p => p.filename !== filename));
                setMessage({ text: 'SUCCESS: ITEM_DELETED', isError: false });
                setDeleteTargetId(null);
            } else if (res.status === 401) {
                setIsAuthorized(false);
                setMessage({ text: 'PERMISSION_DENIED: AUTH_EXPIRED', isError: true });
            } else {
                const err = await res.json() as { error?: string };
                setMessage({ text: `ERROR: ${err.error || 'Failed to delete'}`, isError: true });
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch('/api/admin/auth', { method: 'DELETE', credentials: 'same-origin' });
        } finally {
            setIsAuthorized(false);
            setExistingPosts([]);
            setDashboardData({ posts: [], daily: [], moments: [] });
            setPassword('');
        }
    };

    const downloadMarkdown = async (item: AdminItem) => {
        try {
            const res = await fetch(`/api/admin/download?type=${type}&filename=${encodeURIComponent(item.filename)}`, {
                credentials: 'same-origin'
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = downloadNameFromItem(item);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (res.status === 401) {
                setIsAuthorized(false);
            } else {
                setMessage({ text: 'ERROR: DOWNLOAD_FAILED', isError: true });
            }
        } catch (error) {
            console.error('Download error:', error);
            setMessage({ text: 'ERROR: DOWNLOAD_FAILED', isError: true });
        }
    };

    const downloadAllMarkdown = async () => {
        if (existingPosts.length === 0) return;

        setLoading(true);
        try {
            for (const post of existingPosts) {
                await downloadMarkdown(post);
                // 添加小延迟避免浏览器阻止多个下载
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            setMessage({ text: `SUCCESS: ${existingPosts.length} FILES DOWNLOADED`, isError: false });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Bulk download error:', error);
        } finally {
            setLoading(false);
        }
    };


    if (checkingAuth) {
        return (
            <div className="admin-shell min-h-screen bg-neutral-950 text-white flex items-center justify-center font-mono">
                <div className="fixed right-4 top-4 flex items-center gap-2">
                    <LangToggle compact />
                    <ThemeToggle compact />
                </div>
                {tr('checking')}
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="admin-shell min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans">
                <div className="fixed right-4 top-4 flex items-center gap-2">
                    <LangToggle compact />
                    <ThemeToggle compact />
                </div>
                <Card className="w-full max-w-[320px] border-neutral-800 bg-neutral-900/50 shadow-2xl">
                    <CardHeader className="space-y-1 text-center pb-2 pt-6">
                        <div className="flex justify-center mb-3">
                            <div className="h-8 w-8 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-950 shadow-inner">
                                <FiLock className="text-neutral-500 w-3 h-3" />
                            </div>
                        </div>
                        <CardTitle className="text-sm font-semibold tracking-tight text-white uppercase">{tr('login.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4">
                        <form onSubmit={handleLogin} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="password" title={tr('login.key')} className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
                                    {tr('login.key')}
                                </Label>
                                <Input
                                    id="password"
                                    autoFocus
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`bg-neutral-950 border-neutral-800 text-center tracking-[0.24em] focus:border-white/20 transition-all h-9 text-sm py-2 ${authError ? 'border-red-900/50' : ''}`}
                                />
                                {authError && (
                                    <p className="text-[10px] text-red-500 font-mono flex items-center justify-center gap-1 mt-1.5 uppercase tracking-normal">
                                        <FiAlertTriangle className="w-2.5 h-2.5" />
                                        {tr('login.denied')}
                                    </p>
                                )}
                            </div>
                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-white text-black hover:bg-neutral-200 transition-colors font-mono text-[10px] tracking-[0.18em] h-9"
                            >
                                <span className="text-trim-caps">{loading ? '...' : tr('login.enter')}</span>
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-neutral-800/50 py-3">
                        <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-[0.2em]">
                            {tr('login.version')}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    // 全局通知 toast：终端风格，半透明配色在明暗主题下均可读。
    const messageToast = message ? (
        <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 font-mono text-[11px] leading-tight shadow-2xl backdrop-blur-sm ${message.isError ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${message.isError ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                {message.text}
            </div>
        </div>
    ) : null;

    // 文章编辑视图：整页填满视口、不产生外层滚动，仅源码/预览面板内部滚动。
    const isPostEditor = viewMode === 'edit' && type === 'post';

    // Immersive mode full-screen editor
    if (isImmersiveMode && type === 'post' && viewMode === 'edit') {
        return (
            <div className="admin-shell fixed inset-0 z-50 bg-background text-neutral-200 font-sans animate-in fade-in duration-300">
                {/* Editor container */}
                <div className="flex h-full flex-col">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-900 bg-neutral-900/40 px-2 py-1.5">
                        <button type="button" onClick={() => setIsImmersiveMode(false)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" title={tr('btn.exitImmersive')}>
                            <FiMinimize2 className="h-3.5 w-3.5" />
                            <span className="text-trim-caps">{tr('btn.exitImmersive')}</span>
                        </button>
                        <span className="mx-1 h-5 w-px bg-neutral-800/70" aria-hidden />
                        {renderMdTools()}

                        <div className="ml-auto flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setScrollSync((v) => !v)}
                                title={tr('btn.syncScroll')}
                                aria-label={tr('btn.syncScroll')}
                                aria-pressed={scrollSync}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${scrollSync ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                            >
                                <ArrowDownUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(tr('confirm.clearContent'))) {
                                        setPostData({ ...postData, content: '' });
                                    }
                                }}
                                className="inline-flex h-8 items-center justify-center rounded-md px-3 font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                            >
                                <span className="text-trim-caps">{tr('btn.clear')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="inline-flex h-8 items-center justify-center rounded-md bg-white px-4 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="text-trim-caps">{loading ? tr('btn.publishing') : (isEditing ? tr('btn.update') : tr('btn.publish'))}</span>
                            </button>
                        </div>
                    </div>

                    {/* Editor and preview split */}
                    <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 overflow-hidden">
                        {/* Source editor */}
                        <div className="flex flex-col border-b border-neutral-900 lg:border-b-0 lg:border-r">
                            <textarea
                                ref={postContentRef}
                                rows={25}
                                value={postData.content}
                                onChange={(e) => updatePostContent(e.target.value)}
                                className="block h-full w-full resize-none select-text overflow-auto border-0 bg-neutral-950 p-4 font-mono text-sm leading-relaxed text-neutral-300 outline-none transition-colors placeholder:text-neutral-700 focus:bg-neutral-900/40"
                            />
                        </div>

                        {/* Preview */}
                        <div className="relative flex flex-col overflow-hidden bg-background">
                            {previewLoading && <span className="pointer-events-none absolute right-3 top-3 z-10 h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" aria-hidden />}
                            {previewHtml ? (
                                <div
                                    ref={previewScrollRef}
                                    className="article max-w-none flex-1 overflow-auto p-5 text-[15px]"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            ) : (
                                <div className="p-5 font-mono text-xs uppercase tracking-[0.18em] text-neutral-600">
                                    Preview_Waiting_For_Input
                                </div>
                            )}
                            <TocRail toc={previewToc} embedded revealOnHover containerRef={previewScrollRef} />
                        </div>
                    </div>
                </div>
                {messageToast}
            </div>
        );
    }

    return (
        <div className="admin-shell flex h-screen bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
            <aside
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`${isSidebarCollapsed ? 'w-16' : 'w-60'} border-r border-neutral-900 bg-neutral-950 flex flex-col h-full transition-all duration-300 relative group cursor-pointer`}
            >
                {/* Brand Area */}
                <div className="p-4 border-b border-neutral-900" onClick={(e) => e.stopPropagation()}>
                    {!isSidebarCollapsed && (
                        <span className="font-bold text-lg text-neutral-200 tracking-tight animate-in fade-in duration-300">Typos</span>
                    )}
                </div>

                <div className="p-4" onClick={(e) => e.stopPropagation()}>
                    <nav className="space-y-1">
                        {(['dashboard', 'post', 'daily', 'moment', 'comment', 'tokens'] as const).map((t) => (

                            <button
                                key={t}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExistingPosts([]); // 立即清空，防止闪烁
                                    setType(t);
                                    setViewMode('list');
                                }}

                                className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'px-0 justify-center py-2' : 'px-3 py-2.5'} rounded-md border border-transparent ${isSidebarCollapsed ? 'text-xs' : 'text-sm'} transition-all cursor-pointer ${type === t
                                    ? 'bg-neutral-900 text-white shadow-sm border-neutral-800'
                                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
                                    }`}
                            >
                                <span className={`p-1 rounded text-[11px] shrink-0 ${type === t ? 'bg-neutral-950 text-white shadow-inner' : 'bg-transparent text-neutral-600'}`}>
                                    {t === 'dashboard' && <FiBarChart2 className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                    {t === 'post' && <FiEdit3 className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                    {t === 'daily' && <FiTerminal className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                    {t === 'moment' && <FiImage className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                    {t === 'comment' && <FiMessageSquare className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                    {t === 'tokens' && <FiKey className={isSidebarCollapsed ? "w-3 h-3" : "w-3.5 h-3.5"} />}
                                </span>

                                {!isSidebarCollapsed && (
                                    <span className="font-medium tracking-normal truncate animate-in fade-in duration-300">{tr(`nav.${t}`)}</span>
                                )}
                                {!isSidebarCollapsed && type === t && <FiCheck className="ml-auto w-3 h-3 text-neutral-500 shrink-0" />}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <Separator className="bg-neutral-900" />
                    <nav className="space-y-1">
                        <Link href="/" className={`flex items-center gap-3 ${isSidebarCollapsed ? 'px-0 justify-center py-2' : 'px-3 py-2.5'} ${isSidebarCollapsed ? 'text-xs' : 'text-sm'} text-neutral-500 hover:text-white transition-colors group rounded-md hover:bg-neutral-900/50 cursor-pointer`}>
                            <FiHome className={isSidebarCollapsed ? "w-3.5 h-3.5 group-hover:scale-105 transition-transform shrink-0" : "w-4 h-4 group-hover:scale-105 transition-transform shrink-0"} />
                            {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">{tr('nav.viewSite')}</span>}
                        </Link>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 ${isSidebarCollapsed ? 'px-0 justify-center py-2' : 'px-3 py-2.5'} ${isSidebarCollapsed ? 'text-xs' : 'text-sm'} text-red-500/60 hover:text-red-500 transition-colors group rounded-md hover:bg-red-950/20 cursor-pointer`}
                        >
                            <FiLogOut className={isSidebarCollapsed ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
                            {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">{tr('nav.logout')}</span>}
                        </button>
                    </nav>
                </div>
            </aside>

            <main className="flex-1 bg-neutral-950 scroll-smooth flex flex-col overflow-hidden">
                <div className="max-w-[76rem] mx-auto w-full px-1 flex flex-1 flex-col min-h-0">
                    <div className="mb-6 flex h-[60px] shrink-0 items-center justify-between border-b border-neutral-900">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white mb-1 capitalize flex items-center gap-2">
                                {type === 'dashboard'
                                    ? tr('title.dashboard')
                                    : type === 'tokens'
                                    ? tr('title.tokens')
                                    : viewMode === 'list'
                                    ? tr('title.libraryTyped', { name: tr(`type.${type}`) })
                                    : (isEditing && type === 'post' ? tr('title.editPost') : (type === 'comment' ? tr('title.commentMgmt') : tr('title.newTyped', { name: tr(`type.${type}`) })))}

                                <span className="text-neutral-600 font-normal text-sm">/</span>
                                <span className="text-neutral-500 font-mono text-xs uppercase normal-case tracking-wider font-normal">
                                    {type === 'dashboard'
                                        ? tr('sub.overview')
                                        : type === 'tokens'
                                        ? tr('sub.tokens')
                                        : (type === 'post' || type === 'daily' || type === 'moment') && viewMode === 'list' ? tr('sub.library') : (type === 'comment' ? tr('sub.library') : tr('sub.editor'))}
                                </span>

                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <LangToggle compact />
                            <ThemeToggle compact />
                            {type === 'tokens' && (
                                <Button
                                    onClick={() => { setCreateTokenModalOpen(true); setNewTokenName(''); setNewTokenExpiry('never'); }}
                                    variant="outline"
                                    size="sm"
                                    className={adminActionButtonClass}
                                    disabled={tokensDbUnavailable}
                                >
                                    <FiPlus className="h-3 w-3" />
                                    <span className={adminActionButtonTextClass}>{tr('tokens.newToken')}</span>
                                </Button>
                            )}
                            {type !== 'comment' && type !== 'dashboard' && type !== 'tokens' && (
                                <>
                                    {type === 'post' && (
                                        <input
                                            ref={postUploadInputRef}
                                            type="file"
                                            accept=".md,text/markdown,text/plain"
                                            className="hidden"
                                            onChange={handlePostMarkdownUpload}
                                        />
                                    )}
                                    {viewMode === 'list' && existingPosts.length > 0 && (
                                        <Button
                                            onClick={downloadAllMarkdown}
                                            variant="outline"
                                            size="sm"
                                            className={adminActionButtonClass}
                                            disabled={loading}
                                        >
                                            <FiDownload className="h-3 w-3" />
                                            <span className={adminActionButtonTextClass}>{tr('action.downloadAll')}</span>
                                        </Button>
                                    )}
                                    {type === 'post' && (
                                        <Button
                                            onClick={() => postUploadInputRef.current?.click()}
                                            variant="outline"
                                            size="sm"
                                            className={adminActionButtonClass}
                                        >
                                            <FiUpload className="h-3 w-3" />
                                            <span className={adminActionButtonTextClass}>{tr('action.uploadMd')}</span>
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => viewMode === 'edit' ? setViewMode('list') : handleNewItem()}
                                        variant="outline"
                                        size="sm"
                                        className={adminActionButtonClass}
                                    >
                                        {viewMode === 'edit' ? <FiList className="h-3 w-3" /> : <FiPlus className="h-3 w-3" />}
                                        <span className={adminActionButtonTextClass}>
                                            {viewMode === 'edit' ? tr('action.library') : tr('title.newTyped', { name: tr(`type.${type}`) })}
                                        </span>
                                    </Button>
                                </>
                            )}
                        </div>


                    </div>

                    <div className={`bg-neutral-950 ${isPostEditor ? 'flex flex-1 flex-col min-h-0 pb-6' : 'flex-1 overflow-y-auto pb-8'}`}>
                        {type === 'dashboard' ? (
                            <DashboardView data={dashboardData} loading={dashboardLoading} />
                        ) : type === 'tokens' ? (
                            <TokensView
                                tokens={apiTokens}
                                loading={tokensLoading}
                                dbUnavailable={tokensDbUnavailable}
                                deleteTokenId={deleteTokenId}
                                onRequestDelete={(id) => setDeleteTokenId(deleteTokenId === id ? null : id)}
                                onConfirmDelete={handleDeleteToken}
                            />
                        ) : viewMode === 'list' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 gap-3">
                                    {listLoading ? (
                                        <div className="py-12 flex flex-col items-center gap-3 animate-pulse">
                                            <div className="h-4 w-48 bg-neutral-900 rounded" />
                                            <div className="h-3 w-32 bg-neutral-900 rounded" />
                                        </div>
                                    ) : existingPosts.length === 0 ? (
                                        <div className="py-12 text-center border border-dashed border-neutral-900 rounded-lg bg-neutral-900/20">
                                            <p className="text-neutral-600 font-mono text-xs uppercase tracking-[0.18em]">{tr('list.empty')}</p>
                                        </div>
                                    ) : (

                                        existingPosts.map((post) => (
                                            <div
                                                key={post.filename}
                                                className="group flex items-center justify-between p-5 rounded-xl border border-neutral-900 bg-neutral-950 hover:bg-neutral-900 hover:border-neutral-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                            >
                                                <div
                                                    className="flex-1 min-w-0 pr-6"
                                                    onClick={() => handleEditPost(post)}
                                                >
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h3 className="text-sm font-bold text-neutral-200 truncate group-hover:text-white transition-colors">
                                                            {type === 'daily'
                                                                ? (post.title?.trim() || (post.content ? post.content.trim().slice(0, 40) : post.date))
                                                                : (type === 'comment' ? post.content : post.title)}
                                                        </h3>
                                                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 uppercase tracking-normal shrink-0">{post.date || post.created_at}</span>
                                                        {type === 'comment' && (
                                                            <span className="text-[10px] font-mono text-green-500/60 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 uppercase tracking-normal shrink-0">
                                                                @{post.nickname} {post.contact && `(${post.contact})`}
                                                            </span>
                                                        )}
                                                        {type === 'comment' && post.articleTitle && (
                                                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-normal shrink-0 truncate max-w-[250px]">
                                                                {tr('list.from', { title: post.articleTitle })}
                                                            </span>
                                                        )}


                                                    </div>
                                                    <p className="text-xs text-neutral-500 truncate font-mono">
                                                        {type === 'post' ? (post.description || '...') : (type === 'comment' ? '' : (post.content ? post.content.substring(0, 60) : '...'))}
                                                    </p>

                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {type === 'comment' && (
                                                        <button
                                                            onClick={(e) => handleReply(e, post)}
                                                            className="p-2 text-neutral-600 hover:text-blue-400 hover:bg-blue-950/30 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title={tr('list.reply')}
                                                        >
                                                            <FiCornerUpLeft className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(type === 'post' || type === 'daily' || type === 'moment') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadMarkdown(post);
                                                            }}
                                                            className="p-2 text-neutral-600 hover:text-green-400 hover:bg-green-950/30 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            title={tr('list.download')}
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => handleDelete(e, post.filename)}
                                                            className={`p-2 rounded-md transition-all cursor-pointer ${deleteTargetId === post.filename ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100'}`}
                                                            title={tr('list.delete')}
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>

                                                        {/* Tactical Bubble Confirmation */}
                                                        {deleteTargetId === post.filename && (
                                                            <div
                                                                className="absolute right-0 bottom-full mb-2 z-10 p-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 min-w-[140px]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <p className="text-[10px] font-mono uppercase tracking-normal text-neutral-400 mb-2 px-1">{tr('confirm.purge')}</p>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => setDeleteTargetId(null)}
                                                                        className="flex-1 py-1 text-[10px] font-mono uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
                                                                    >
                                                                        {tr('confirm.no')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => confirmDelete(type, post.filename)}
                                                                        className="flex-1 py-1 text-[10px] font-mono uppercase bg-red-900/40 hover:bg-red-900/60 text-red-200 rounded transition-colors border border-red-900/50"
                                                                    >
                                                                        {tr('confirm.yes')}
                                                                    </button>
                                                                </div>
                                                                <div className="absolute top-full right-3 w-2 h-2 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 -translate-y-1" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div
                                                        className="p-2 text-neutral-600 hover:text-white transition-colors"
                                                        onClick={() => handleEditPost(post)}
                                                    >
                                                        <FiChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={`space-y-4 ${isPostEditor ? 'flex flex-1 flex-col min-h-0' : ''}`}>
                                {type === 'post' && (
                                    <div className="flex flex-1 flex-col min-h-0 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* 第一行：标题、日期、别名 */}
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-x-4 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-title" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.title')}</Label>
                                                <Input id="post-title" placeholder="New Entry..." value={postData.title} onChange={(e) => setPostData({ ...postData, title: e.target.value })} className="h-9 flex-1 bg-neutral-900/50 border-neutral-800 text-sm text-white focus:bg-neutral-900 placeholder:text-neutral-700" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-date" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.date')}</Label>
                                                <Input id="post-date" type="date" value={postData.date} onChange={(e) => { const val = e.target.value; setPostData(prev => ({ ...prev, date: val, slug: isSlugModified ? prev.slug : dateToSlug(val) })); }} className="h-9 flex-1 bg-neutral-900/50 border-neutral-800 text-sm text-white focus:bg-neutral-900 [&::-webkit-calendar-picker-indicator]:invert" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-slug" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.slug')}</Label>
                                                <Input id="post-slug" value={postData.slug} onChange={(e) => { setPostData({ ...postData, slug: e.target.value }); setIsSlugModified(true); }} className="h-9 flex-1 bg-neutral-900/50 border-neutral-800 text-sm font-mono text-neutral-400 focus:bg-neutral-900" />
                                            </div>
                                        </div>

                                        {/* 第二行：分类、描述、封面 */}
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-x-4 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-category" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.category')}</Label>
                                                {/* 标签输入框 */}
                                                <div className="flex min-h-[36px] flex-1 flex-wrap items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-1 focus-within:border-neutral-700">
                                                    {/* 已选分类标签 */}
                                                    {postData.category.map((cat, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 text-[11px] text-neutral-300 rounded font-mono">
                                                            {cat}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newCats = postData.category.filter((_, i) => i !== idx);
                                                                    setPostData({ ...postData, category: newCats });
                                                                }}
                                                                className="text-neutral-500 hover:text-white text-sm"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                    {/* 输入框 */}
                                                    <input
                                                        type="text"
                                                        value={categoryInput}
                                                        onChange={(e) => setCategoryInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && categoryInput.trim()) {
                                                                e.preventDefault();
                                                                const newCat = categoryInput.trim();
                                                                if (!postData.category.includes(newCat)) {
                                                                    setPostData({ ...postData, category: [...postData.category, newCat] });
                                                                }
                                                                setCategoryInput('');
                                                            } else if (e.key === 'Backspace' && !categoryInput && postData.category.length > 0) {
                                                                // 按删除键删除最后一个标签
                                                                const newCats = [...postData.category];
                                                                newCats.pop();
                                                                setPostData({ ...postData, category: newCats });
                                                            }
                                                        }}
                                                        placeholder=""
                                                        className="flex-1 min-w-[100px] bg-transparent border-0 outline-none text-sm text-neutral-300 placeholder:text-neutral-700 h-7"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-desc" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.description')}</Label>
                                                <Input id="post-desc" value={postData.description} onChange={(e) => setPostData({ ...postData, description: e.target.value })} className="h-9 flex-1 bg-neutral-900/50 border-neutral-800 text-sm text-neutral-300 focus:bg-neutral-900" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="post-cover" className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{tr('form.cover')}</Label>
                                                <Input id="post-cover" placeholder="https://..." value={postData.cover} onChange={(e) => setPostData({ ...postData, cover: e.target.value })} className="h-9 flex-1 bg-neutral-900/50 border-neutral-800 text-sm text-neutral-300 focus:bg-neutral-900 placeholder:text-neutral-700" />
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col min-h-0">
                                            <div className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
                                                <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-neutral-900 bg-neutral-900/40 px-2 py-1.5">
                                                    {renderMdTools()}

                                                    <div className="ml-auto flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setScrollSync((v) => !v)}
                                                            title={tr('btn.syncScroll')}
                                                            aria-label={tr('btn.syncScroll')}
                                                            aria-pressed={scrollSync}
                                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${scrollSync ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                                                        >
                                                            <ArrowDownUp className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirm(tr('confirm.clearContent'))) {
                                                                    setPostData({ ...postData, content: '' });
                                                                }
                                                            }}
                                                            className="inline-flex h-8 items-center justify-center rounded-md px-3 font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                                                        >
                                                            <span className="text-trim-caps">{tr('btn.clear')}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsImmersiveMode(true)}
                                                            title={tr('btn.immersiveMode')}
                                                            aria-label={tr('btn.immersiveMode')}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                                                        >
                                                            <FiMaximize2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSubmit}
                                                            disabled={loading}
                                                            className="inline-flex h-8 items-center justify-center rounded-md bg-white px-4 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <span className="text-trim-caps">{loading ? tr('btn.publishing') : (isEditing ? tr('btn.update') : tr('btn.publish'))}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
                                                    <div className="flex min-h-0 flex-col border-b border-neutral-900 lg:border-b-0 lg:border-r">
                                                        <textarea
                                                            ref={postContentRef}
                                                            id="post-content"
                                                            value={postData.content}
                                                            onChange={(e) => updatePostContent(e.target.value)}
                                                            className="block w-full min-h-0 flex-1 resize-none select-text overflow-auto border-0 bg-neutral-950 p-4 font-mono text-sm leading-relaxed text-neutral-300 outline-none transition-colors placeholder:text-neutral-700 focus:bg-neutral-900/40"
                                                        />
                                                    </div>
                                                    <div className="relative flex min-h-0 flex-col bg-background">
                                                        {previewLoading && <span className="pointer-events-none absolute right-3 top-3 z-10 h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-500" aria-hidden />}
                                                        {previewHtml ? (
                                                            <div
                                                                ref={previewScrollRef}
                                                                className="article max-w-none min-h-0 flex-1 overflow-auto p-5 text-[15px]"
                                                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                                                            />
                                                        ) : (
                                                            <div className="min-h-0 flex-1 overflow-auto p-5 font-mono text-xs uppercase tracking-[0.18em] text-neutral-600">
                                                                Preview_Waiting_For_Input
                                                            </div>
                                                        )}
                                                        <TocRail toc={previewToc} embedded revealOnHover containerRef={previewScrollRef} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {type === 'daily' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="daily-title" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.titleOptional')}</Label>
                                                <Input id="daily-title" value={dailyData.title} onChange={(e) => setDailyData({ ...dailyData, title: e.target.value })} className="bg-neutral-900/50 border-neutral-800 h-9 text-sm focus:bg-neutral-900 text-white" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="daily-date" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.date')}</Label>
                                                <Input id="daily-date" type="date" className="bg-neutral-900/50 border-neutral-800 h-9 text-xs text-white [&::-webkit-calendar-picker-indicator]:invert" value={dailyData.date} onChange={(e) => setDailyData({ ...dailyData, date: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="daily-url" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.imageUrlOptional')}</Label>
                                            <Input id="daily-url" value={dailyData.imageUrl} onChange={(e) => setDailyData({ ...dailyData, imageUrl: e.target.value })} className="bg-neutral-900/50 border-neutral-800 h-9 font-mono text-[10px] text-neutral-400 focus:bg-neutral-900" placeholder="https://..." />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="daily-content" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.log')}</Label>
                                            <Textarea id="daily-content" rows={10} value={dailyData.content} onChange={(e) => setDailyData({ ...dailyData, content: e.target.value })} className="bg-neutral-900/50 border-neutral-800 min-h-[200px] resize-none leading-relaxed p-4 text-sm font-mono text-neutral-300 focus:bg-neutral-900" />
                                        </div>
                                    </div>
                                )}

                                {type === 'moment' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="moment-title" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.title')}</Label>
                                                <Input id="moment-title" value={momentData.title} onChange={(e) => setMomentData({ ...momentData, title: e.target.value })} className="bg-neutral-900/50 border-neutral-800 h-9 text-sm focus:bg-neutral-900 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="moment-date" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.date')}</Label>
                                                <Input id="moment-date" type="date" value={momentData.date} onChange={(e) => setMomentData({ ...momentData, date: e.target.value })} className="bg-neutral-900/50 border-neutral-800 h-9 text-sm focus:bg-neutral-900 text-white [&::-webkit-calendar-picker-indicator]:invert" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="moment-url" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.imageUrl')}</Label>
                                            <Input id="moment-url" value={momentData.imageUrl} onChange={(e) => setMomentData({ ...momentData, imageUrl: e.target.value })} className="bg-neutral-900/50 border-neutral-800 h-9 font-mono text-[10px] text-neutral-400 focus:bg-neutral-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="moment-content" className="text-[10px] text-neutral-500 font-semibold px-0.5 uppercase tracking-wider">{tr('form.caption')}</Label>
                                            <Textarea id="moment-content" rows={4} value={momentData.content} onChange={(e) => setMomentData({ ...momentData, content: e.target.value })} className="bg-neutral-900/50 border-neutral-800 min-h-[100px] resize-none leading-relaxed p-3 text-sm focus:bg-neutral-900 text-neutral-300" />
                                        </div>
                                    </div>
                                )}

                                {type !== 'post' && (
                                    <div className="pt-4 border-t border-neutral-900">
                                        <Button disabled={loading} type="submit" size="sm" className="w-full md:w-auto min-w-[120px] bg-white text-black hover:bg-neutral-200 transition-all font-bold tracking-[0.18em] text-[10px] h-9 shadow-lg shadow-white/5 active:scale-95 cursor-pointer">
                                            {loading ? (
                                                <div className="flex items-center gap-2 italic">
                                                    <div className="animate-spin h-2.5 w-2.5 border-2 border-current border-t-transparent rounded-full" />
                                                    <span className="text-trim-caps">{tr('btn.saving')}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <FiSave className="w-3.5 h-3.5" />
                                                    <span className="text-trim-caps">{isEditing ? tr('btn.update') : tr('btn.publish')}</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </main>
            {messageToast}
            {/* Reply Dialog */}
            {replyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-neutral-400">{tr('reply.channel')}</h3>
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/50">
                                <p className="text-[10px] text-neutral-600 font-mono uppercase mb-1">{tr('reply.target')}</p>
                                <p className="text-xs text-neutral-400 italic">@{replyTarget?.nickname}: {replyTarget?.content}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reply-content" className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.18em]">{tr('reply.input')}</Label>
                                <Textarea
                                    id="reply-content"
                                    autoFocus
                                    className="min-h-[120px] bg-neutral-950 border-neutral-800 text-sm font-mono text-neutral-300 focus:border-blue-500/50 resize-none"
                                    placeholder={tr('reply.placeholder')}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyModalOpen(false)}
                                className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.18em] hover:text-white"
                            >
                                {tr('reply.cancel')}
                            </Button>
                            <Button
                                disabled={loading || !replyContent.trim()}
                                size="sm"
                                onClick={submitAdminReply}
                                className="bg-white text-black hover:bg-neutral-200 text-[10px] font-mono uppercase tracking-[0.18em] px-6"
                            >
                                {loading ? tr('reply.sending') : tr('reply.send')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog 已经移除，改为气泡式 */}

            {/* Create Token Modal */}
            {createTokenModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-neutral-400">{tr('tokens.create.title')}</h3>
                            <FiKey className="w-4 h-4 text-neutral-600" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token-name" className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.18em]">{tr('tokens.name')}</Label>
                                <Input
                                    id="token-name"
                                    autoFocus
                                    value={newTokenName}
                                    onChange={(e) => setNewTokenName(e.target.value)}
                                    placeholder={tr('tokens.namePlaceholder')}
                                    className="bg-neutral-950 border-neutral-800 text-sm text-neutral-300 focus:border-neutral-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.18em]">{tr('tokens.expiry.label')}</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['never', '30d', '90d', '1y'] as const).map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setNewTokenExpiry(opt)}
                                            className={`h-8 rounded-md border font-mono text-[10px] uppercase tracking-wider transition-colors ${newTokenExpiry === opt ? 'border-neutral-500 bg-neutral-800 text-white' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}
                                        >
                                            {tr(`tokens.expiry.${opt}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCreateTokenModalOpen(false)}
                                className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.18em] hover:text-white"
                            >
                                {tr('tokens.create.cancel')}
                            </Button>
                            <Button
                                disabled={loading || !newTokenName.trim()}
                                size="sm"
                                onClick={handleCreateToken}
                                className="bg-white text-black hover:bg-neutral-200 text-[10px] font-mono uppercase tracking-[0.18em] px-6"
                            >
                                {loading ? tr('tokens.create.creating') : tr('tokens.create.submit')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Created Token Result Modal */}
            {createdToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                            <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-green-400">{tr('tokens.result.title')}</h3>
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-stretch gap-2">
                                <code className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2.5 text-xs font-mono text-green-400 break-all">{createdToken}</code>
                                <button
                                    onClick={() => copyToken(createdToken)}
                                    className="shrink-0 flex items-center gap-1.5 px-3 rounded border border-neutral-700 text-neutral-300 font-mono text-[10px] uppercase tracking-wider hover:border-neutral-500 hover:text-white transition-colors"
                                >
                                    <FiCopy className="w-3 h-3" />
                                    {tokenCopied ? tr('tokens.result.copied') : tr('tokens.result.copy')}
                                </button>
                            </div>
                            <p className="text-[11px] text-amber-500/80 font-mono leading-relaxed">⚠ {tr('tokens.result.warning')}</p>
                        </div>
                        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => { setCreatedToken(null); setTokenCopied(false); }}
                                className="bg-white text-black hover:bg-neutral-200 text-[10px] font-mono uppercase tracking-[0.18em] px-6"
                            >
                                {tr('tokens.result.done')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
