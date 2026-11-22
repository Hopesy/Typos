'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ActivityStats } from '@/lib/content';

type HeatmapProps = {
  activities: ActivityStats[];
  showPreviewInTitle?: boolean;
};

type DayCell = { date: string; activity: ActivityStats | null };

function getDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeeksData(activities: ActivityStats[]) {
  const activityMap = new Map<string, ActivityStats>();
  activities.forEach((activity) => {
    activityMap.set(activity.date, activity);
  });

  const today = new Date();
  const endDate = new Date(today); // 结束日期设为今天

  const weeks: Array<Array<DayCell>> = [];

  // 生成52周的数据
  for (let weekIndex = 0; weekIndex < 52; weekIndex++) {
    const week: Array<DayCell> = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() - (51 - weekIndex) * 7 - (6 - dayIndex));

      const dateString = getDateString(currentDate);
      const activity = activityMap.get(dateString) || null;

      week.push({ date: dateString, activity });
    }

    weeks.push(week);
  }

  return weeks;
}

function getIntensityClass(total: number): string {
  // 浅色使用实色分阶，保留陶土橙的饱和度；深色沿用灰阶。
  if (total === 0) return 'bg-black/[0.03] dark:bg-white/[0.03]';  // 无活动 - 几乎透明
  if (total === 1) return 'bg-hud-accent dark:bg-white/10';      // 1条活动
  if (total === 2) return 'bg-hud-link dark:bg-white/20';        // 2条活动
  if (total >= 3) return 'bg-[color-mix(in_srgb,var(--hud-accent),var(--hud-strong)_35%)] dark:bg-white/40'; // 3+条活动
  return 'bg-black/[0.03] dark:bg-white/[0.03]';
}

export function ActivityHeatmap({ activities, showPreviewInTitle = false }: HeatmapProps) {
  const t = useTranslations();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null);
  const weeks = getWeeksData(activities);

  const totalActivities = activities.reduce((sum, a) => sum + a.total, 0);
  const activeCell = hoveredCell ?? selectedCell;
  const fallbackFocusDate =
    [...activities].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ??
    weeks[weeks.length - 1]?.[weeks[weeks.length - 1].length - 1]?.date;
  const focusDate = selectedCell?.date ?? fallbackFocusDate;

  useEffect(() => {
    if (!selectedCell) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setSelectedCell(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCell(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedCell]);

  return (
    <div ref={rootRef} className="relative">
      {/* 预览信息 - 悬浮在色块上方标题行右侧，不透明毛玻璃避免透字 */}
      {showPreviewInTitle && activeCell && (
        <div
          role="status"
          className="absolute -top-10 right-0 z-20 rounded-md border border-hud-line-strong/80 bg-card/96 px-2.5 py-1 text-[10px] font-mono shadow-sm backdrop-blur-md"
        >
          <span className="text-hud-strong mr-2 tabular-nums">{activeCell.date}</span>
          {activeCell.activity ? (
            <span className="text-hud tabular-nums">
              {activeCell.activity.posts > 0 && `${t('home.footprint.posts')}:${activeCell.activity.posts} `}
              {activeCell.activity.daily > 0 && `${t('home.footprint.daily')}:${activeCell.activity.daily} `}
              {activeCell.activity.moments > 0 && `${t('home.footprint.moments')}:${activeCell.activity.moments} `}
              <span className="text-hud-strong">| {t('home.footprint.total')}:{activeCell.activity.total}</span>
            </span>
          ) : (
            <span className="text-hud-muted">{t('home.footprint.noActivity')}</span>
          )}
        </div>
      )}

      <div className="overflow-hidden p-1">
        <div className="grid grid-cols-[repeat(52,1fr)] gap-[2px]">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const key = `${weekIndex}-${dayIndex}`;
              const intensity = day.activity ? getIntensityClass(day.activity.total) : 'bg-hud/[0.03]';
              const isSelected = selectedCell?.date === day.date;
              const label = day.activity
                ? `${day.date} ${t('home.footprint.total')}:${day.activity.total}`
                : `${day.date} ${t('home.footprint.noActivity')}`;

              return (
                <button
                  key={key}
                  type="button"
                  tabIndex={day.date === focusDate ? 0 : -1}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={`block min-h-0 min-w-0 w-full aspect-square rounded-[1px] border-0 p-0 transition-colors duration-300 cursor-pointer hover:ring-1 hover:ring-hud-line focus-visible:outline-1 focus-visible:outline-hud-strong ${
                    isSelected ? 'ring-1 ring-hud-strong' : ''
                  } ${intensity}`}
                  onMouseEnter={() => setHoveredCell(day)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onFocus={() => setHoveredCell(day)}
                  onBlur={() => setHoveredCell(null)}
                  onClick={() => setSelectedCell((current) => (current?.date === day.date ? null : day))}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center text-[10px] font-mono text-hud-muted uppercase tracking-normal">
        <span>{t('home.footprint.totalActivities')}: {totalActivities}</span>
        <span>{t('home.footprint.past52Weeks')}</span>
      </div>
    </div>
  );
}

// 导出空的 Preview 组件以保持兼容性
export function ActivityHeatmapPreview() {
  return null;
}
