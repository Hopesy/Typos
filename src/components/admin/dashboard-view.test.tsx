import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import en from '../../../messages/en.json';
import zh from '../../../messages/zh.json';
import { DashboardView } from './dashboard-view';

test('dashboard chart paint references remain valid and geometry stays the same in both languages', () => {
  const chartPaths: string[][] = [];
  for (const [locale, messages] of [['zh', zh], ['en', en]] as const) {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
        <DashboardView data={{ posts: [], daily: [], moments: [] }} loading={false} />
      </NextIntlClientProvider>
    );
    const charts = [...html.matchAll(/<svg\b[^>]*role="img"[^>]*>[\s\S]*?<\/svg>/g)].map(match => match[0]);
    expect(charts).toHaveLength(2);
    const ids = charts.map(chart => chart.match(/<linearGradient\b[^>]*id="([^"]+)"/)?.[1]);
    expect(new Set(ids).size).toBe(2);
    for (const [index, chart] of charts.entries()) {
      const id = ids[index];
      expect(id).toBeTruthy();
      // Unquoted CSS url() fragments must not contain whitespace or delimiters.
      expect(id).not.toMatch(/[\s"'()\\]/);
      expect(chart).toContain(`fill="url(#${id})"`);
    }
    chartPaths.push(charts.flatMap(chart => [...chart.matchAll(/<path\b[^>]*d="([^"]+)"/g)].map(match => match[1])));
  }
  expect(chartPaths[0]).toEqual(chartPaths[1]);
});
