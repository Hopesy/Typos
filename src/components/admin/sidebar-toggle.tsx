'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

type SidebarToggleProps = {
    collapsed: boolean;
    onToggle: () => void;
    controlsId?: string;
};

export function SidebarToggle({
    collapsed,
    onToggle,
    controlsId = 'admin-sidebar',
}: SidebarToggleProps) {
    const tr = useTranslations('admin');
    const label = collapsed ? tr('nav.expandSidebar') : tr('nav.collapseSidebar');
    const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={label}
            aria-expanded={!collapsed}
            aria-controls={controlsId}
            data-sidebar-state={collapsed ? 'collapsed' : 'expanded'}
            className="hidden md:inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 transition-colors hover:border-neutral-600 hover:bg-neutral-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong"
        >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </button>
    );
}
