'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ActivityStats } from '@/lib/content';

type HeatmapProps = {
  activities: ActivityStats[];
  showPreviewInTitle?: boolean;
};

function getDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeeksData(activities: ActivityStats[]) {
  const activityMap = new Map<string, ActivityStats>();
  activities.forEach((activity) => {
    activityMap.set(activity.date, activity);
  });

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - endDate.getDay()); // 本周日

  const weeks: Array<Array<{ date: string; activity: ActivityStats | null }>> = [];

  // 生成52周的数据
  for (let weekIndex = 0; weekIndex < 52; weekIndex++) {
    const week: Array<{ date: string; activity: ActivityStats | null }> = [];

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
  // 使用与原版伪随机相同的透明度方案
  if (total === 0) return 'bg-hud/[0.03]';  // 无活动 - 3% 不透明度（几乎透明）
  if (total === 1) return 'bg-hud/10';      // 1条活动 - 10% 不透明度
  if (total === 2) return 'bg-hud/20';      // 2条活动 - 20% 不透明度
  if (total >= 3) return 'bg-hud/40';       // 3+条活动 - 40% 不透明度
  return 'bg-hud/[0.03]';
}

export function ActivityHeatmap({ activities, showPreviewInTitle = false }: HeatmapProps) {
  const t = useTranslations();
  const [hoveredCell, setHoveredCell] = useState<{ date: string; activity: ActivityStats | null } | null>(null);
  const weeks = getWeeksData(activities);

  const totalActivities = activities.reduce((sum, a) => sum + a.total, 0);

  return (
    <div className="relative">
      {/* 预览信息 - 悬浮在色块上方 */}
      {showPreviewInTitle && hoveredCell && (
        <div className="absolute -top-12 right-0 px-3 py-1 border border-hud-line bg-hud-panel/95 backdrop-blur-sm rounded text-[10px] font-mono z-10">
          <span className="text-hud-strong mr-2">{hoveredCell.date}</span>
          {hoveredCell.activity ? (
            <span className="text-hud">
              {hoveredCell.activity.posts > 0 && `${t('home.footprint.posts')}:${hoveredCell.activity.posts} `}
              {hoveredCell.activity.daily > 0 && `${t('home.footprint.daily')}:${hoveredCell.activity.daily} `}
              {hoveredCell.activity.moments > 0 && `${t('home.footprint.moments')}:${hoveredCell.activity.moments} `}
              <span className="text-hud-strong">| {t('home.footprint.total')}:{hoveredCell.activity.total}</span>
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

              return (
                <div
                  key={key}
                  className={`aspect-square rounded-[1px] transition-colors duration-300 cursor-pointer hover:ring-1 hover:ring-hud-line ${intensity}`}
                  onMouseEnter={() => setHoveredCell(day)}
                  onMouseLeave={() => setHoveredCell(null)}
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
