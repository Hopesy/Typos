import { getDailyEntries } from "@/lib/content";
export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const dailyPosts = await getDailyEntries();
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
      {/* Main Content Stream */}
      <div className="relative space-y-16">
        {/* Timeline Connector (Vertical Dotted Line) */}
        <div className="absolute left-[7px] top-2 bottom-0 w-px border-l border-dashed border-white/10 pointer-events-none"></div>

        {dailyPosts.map((post, index) => (
          <article key={`${post.date}-${index}`} className="relative group mb-[24px]">
            {/* Command Line Prompt - Refined Circle style */}
            <div className="flex items-center gap-4 text-[15px] font-mono mb-4 relative z-10">
              <div className="w-[15px] h-[15px] rounded-full bg-black border border-white/20 flex items-center justify-center">
                <span className="text-[8px] text-white/40">➜</span>
              </div>
              <span className="text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-widest text-[10px]">
                cat log_{post.date}.txt
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
                    className="max-h-96 w-auto object-contain border border-white/10 opacity-80 group-hover/image:opacity-100 transition-opacity duration-700 rounded-[2px]"
                  />
                  {/* HUD Corner Accents on Image */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40"></div>
                  {/* Metadata overlay on image */}
                  <div className="absolute top-2 right-2 font-mono text-[8px] text-white/20 px-1 bg-black/40">
                    CAPTURE_PROT_01
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="space-y-3">
                {post.title && (
                  <div className="text-[14px] font-bold text-white/90 font-mono uppercase tracking-tight">
                    {post.title}
                  </div>
                )}
                <div
                  className="prose prose-[14px] prose-invert max-w-none text-[14px] leading-relaxed font-sans text-white/70"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              </div>

              {/* System Metadata Tags */}
              <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-white/10 group-hover:text-white/30 transition-colors">
                <span>[STATUS: ARCHIVED]</span>
                <span>[CRC: 0x{post.date.slice(-4)}]</span>
                <span>[SOURCE: OMEGA_DRIVE]</span>
              </div>
            </div>
          </article>
        ))}

        {/* Terminal Footer Indicator */}
        <div className="relative group mb-[24px]">
          <div className="flex items-center gap-4 text-[10px] font-mono relative z-10">
            <div className="w-[15px] h-[15px] rounded-full bg-black border border-white/20 flex items-center justify-center">
              <span className="text-[8px] text-white/40">➜</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-white/20 tracking-widest uppercase">system_idle</span>
              <span className="w-2 h-4 bg-white/40 cursor-blink ml-1"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
