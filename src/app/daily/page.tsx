import { getDailyEntries } from "@/lib/content";
import MarkdownRenderer from "@/components/markdown-renderer";
import { getTranslations } from "next-intl/server";
export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const dailyPosts = await getDailyEntries();
  const t = await getTranslations('daily');
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      {/* Main Content Stream */}
      <div className="relative space-y-16">
        {/* Timeline Connector (Vertical Dotted Line) */}
        <div className="absolute left-[7px] top-2 bottom-0 w-px border-l border-dashed border-hud-line pointer-events-none"></div>

        {dailyPosts.map((post, index) => (
          <article key={`${post.date}-${index}`} className="relative group mb-[24px]">
            {/* Command Line Prompt - Refined Circle style */}
            <div className="flex items-center gap-4 text-[15px] font-mono mb-4 relative z-10">
              <div className="w-[15px] h-[15px] rounded-full bg-background border border-hud-line-strong flex items-center justify-center">
                <span className="text-[10px] text-hud-muted">➜</span>
              </div>
              <span className="text-hud-muted group-hover:text-hud-strong transition-colors uppercase tracking-[0.18em] text-[11px]">
                {t('logPrefix')} · {post.date}
              </span>
            </div>

            <div className="pl-10 space-y-5">
              {/* Media Content with HUD/Scanline */}
              {post.image && (
                <div className="relative inline-block scanline-effect group/image">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Daily entries accept arbitrary remote image URLs without known dimensions. */}
                  <img
                    src={post.image}
                    alt={post.title || post.date}
                    className="max-h-96 w-auto object-contain border border-hud-line opacity-80 group-hover/image:opacity-100 transition-opacity duration-700 rounded-[2px]"
                  />
                  {/* HUD Corner Accents on Image */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-hud-muted"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-hud-muted"></div>
                  {/* Metadata overlay on image */}
                  <div className="absolute top-2 right-2 font-mono text-[10px] text-white/30 px-1.5 py-0.5 bg-black/40">
                    {t('captureTag')}
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="space-y-3">
                {post.title && (
                  <div className="text-[15px] font-bold text-hud-strong font-mono uppercase tracking-tight">
                    {post.title}
                  </div>
                )}
                <MarkdownRenderer
                  content={post.content}
                  className="text-[15px] leading-7 font-sans sm:text-base sm:leading-8"
                />
              </div>

              {/* System Metadata Tags */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-hud-faint group-hover:text-hud-muted transition-colors">
                <span>[ {t('status')} ]</span>
                <span>[ {post.date} ]</span>
                <span>[ {t('source')} ]</span>
              </div>
            </div>
          </article>
        ))}

        {/* Terminal Footer Indicator */}
        <div className="relative group mb-[24px]">
          <div className="flex items-center gap-4 text-[10px] font-mono relative z-10">
            <div className="w-[15px] h-[15px] rounded-full bg-background border border-hud-line-strong flex items-center justify-center">
              <span className="text-[10px] text-hud-muted">➜</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-hud-dim tracking-[0.18em] uppercase">{t('systemIdle')}</span>
              <span className="w-2 h-4 bg-hud-muted cursor-blink ml-1"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
