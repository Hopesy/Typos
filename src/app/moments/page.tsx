import { getMomentsEntries } from "@/lib/content";
import { MomentsGrid } from "@/components/moments-grid";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
export const dynamic = 'force-dynamic';

export default async function MomentsPage() {
    const moments = await getMomentsEntries();
    const t = await getTranslations('moments');

    return (
        <div className="w-full py-0">
            {/* Dynamic Waterfall Grid controlled by Header */}
            <Suspense fallback={<div className="min-h-screen animate-pulse bg-hud-panel" />}>
                <MomentsGrid moments={moments} />
            </Suspense>

            {/* Bottom info */}
            <div className="mt-16 text-center text-[10px] font-mono text-hud-faint uppercase tracking-[0.2em]">
                {t('endOfStream')} // {t('totalFragments')}: {moments.length}
            </div>
        </div>
    );
}
