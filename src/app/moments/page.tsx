import { getMomentsEntries } from "@/lib/content";
import { MomentsGrid } from "@/components/moments-grid";
import { Suspense } from "react";
export const dynamic = 'force-dynamic';

export default async function MomentsPage() {
    const moments = await getMomentsEntries();

    return (
        <div className="w-full py-0">
            {/* Dynamic Waterfall Grid controlled by Header */}
            <Suspense fallback={<div className="min-h-screen animate-pulse bg-white/5" />}>
                <MomentsGrid moments={moments} />
            </Suspense>

            {/* Bottom info */}
            <div className="mt-16 text-center text-[10px] font-mono text-white/10 uppercase tracking-[0.2em]">
                End_of_Stream // Total_Fragments: {moments.length}
            </div>
        </div>
    );
}
