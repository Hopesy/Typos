import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test } from 'vitest';
import en from '../../../messages/en.json';
import zh from '../../../messages/zh.json';
import { SidebarToggle } from './sidebar-toggle';

test('sidebar toggle renders distinct expand and collapse states in Chinese and English', () => {
    for (const [locale, messages] of [
        ['zh', zh],
        ['en', en],
    ] as const) {
        const expandedHtml = renderToStaticMarkup(
            <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
                <SidebarToggle collapsed={false} onToggle={() => {}} />
            </NextIntlClientProvider>
        );
        const collapsedHtml = renderToStaticMarkup(
            <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
                <SidebarToggle collapsed={true} onToggle={() => {}} />
            </NextIntlClientProvider>
        );

        const expectedCollapseLabel = messages.admin.nav.collapseSidebar;
        const expectedExpandLabel = messages.admin.nav.expandSidebar;

        expect(expandedHtml).toContain(`aria-label="${expectedCollapseLabel}"`);
        expect(expandedHtml).toContain(`title="${expectedCollapseLabel}"`);
        expect(expandedHtml).toContain('aria-expanded="true"');
        expect(expandedHtml).toContain('aria-controls="admin-sidebar"');
        expect(expandedHtml).toContain('data-sidebar-state="expanded"');

        expect(collapsedHtml).toContain(`aria-label="${expectedExpandLabel}"`);
        expect(collapsedHtml).toContain(`title="${expectedExpandLabel}"`);
        expect(collapsedHtml).toContain('aria-expanded="false"');
        expect(collapsedHtml).toContain('aria-controls="admin-sidebar"');
        expect(collapsedHtml).toContain('data-sidebar-state="collapsed"');

        const expandedSvg = expandedHtml.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
        const collapsedSvg = collapsedHtml.match(/<svg\b[\s\S]*?<\/svg>/)?.[0];
        expect(expandedSvg).toBeTruthy();
        expect(collapsedSvg).toBeTruthy();
        expect(expandedSvg).not.toBe(collapsedSvg);
    }
});
