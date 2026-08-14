'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiEdit3, FiList, FiTerminal, FiTrendingUp } from 'react-icons/fi';

export type DashboardItem = {
  title?: string;
  description?: string;
  content?: string;
};

export type DashboardData = {
  posts: DashboardItem[];
  daily: DashboardItem[];
  moments: DashboardItem[];
};

type ChartRange = '7d' | '30d';

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

const getItemTextLength = (item: DashboardItem) => [item.title, item.description, item.content]
  .filter(Boolean)
  .join('\n')
  .trim()
  .length;

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
              className={`h-7 rounded-[3px] px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${range === option ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {option === '7d' ? t('range7d') : t('range30d')}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 640 210" className="h-[180px] w-full overflow-visible md:h-[230px]" role="img" aria-label={title}>
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

export function DashboardView({ data, loading }: { data: DashboardData; loading: boolean }) {
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
          <section key={card.label} className="relative overflow-hidden rounded-[4px] border border-neutral-900 bg-neutral-950 p-5 shadow-sm">
            <div className="absolute right-4 top-4 text-neutral-700">{card.icon}</div>
            <p className="text-sm font-bold text-neutral-500">{card.label}</p>
            <div className="mt-5 text-4xl font-semibold tracking-tight text-neutral-100">{loading ? '...' : formatMetric(card.value)}</div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600">{card.meta}</p>
          </section>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TrendChart title={tr('chart.visitors')} range={visitorRange} onRangeChange={setVisitorRange} values={visitorSeries[visitorRange]} latestKey="latestPeople" />
        <TrendChart title={tr('chart.views')} range={viewRange} onRangeChange={setViewRange} values={viewSeries[viewRange]} latestKey="latestTimes" />
      </div>
    </div>
  );
}
