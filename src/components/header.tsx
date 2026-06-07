'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const navItems = [
  { name: "首页", href: "/" },
  { name: "合集", href: "/posts" },
  {
    name: "分类",
    href: "/moments",
    target: "_blank",
    icon: <Image src="/icon3.svg" alt="分类" width={42} height={42} className="opacity-90 invert" />,
  },
  { name: "日常", href: "/daily" },
  { name: "关于", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMomentsPage = pathname === "/moments";
  const isAdminPage = pathname?.startsWith("/admin");
  const [viewCount, setViewCount] = useState(0);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const currentCols = searchParams.get('cols') || '4';

  const handleLayoutChange = useCallback((cols: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('cols', cols);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Simple visitor count logic using LocalStorage
  useEffect(() => {
    if (isMomentsPage) {
      const storedCount = localStorage.getItem("moments_view_count");
      const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
      const newCount = currentCount + 1;
      localStorage.setItem("moments_view_count", newCount.toString());
      setViewCount(newCount);
    }
  }, [isMomentsPage]);

  if (isAdminPage) return null;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isMomentsPage
      ? "bg-background/10 backdrop-blur-2xl [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]"
      : "bg-background/95 border-b border-border/40 backdrop-blur-md"
      }`}>
      <div className={`container mx-auto flex h-14 items-center ${isMomentsPage ? 'max-w-full px-6' : 'max-w-4xl px-4'}`}>
        {isMomentsPage ? (
          // Moments Page Special Header
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Image src="/icon3.svg" alt="Avatar" width={20} height={20} className="h-5 w-5 invert brightness-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-press-start text-[10px] text-white/90">TYPOS</span>
                <span className="font-mono text-[8px] text-white/40 uppercase tracking-tighter mt-1">
                  Views: {viewCount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Layout Switcher */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 cursor-pointer">
                {[2, 4, 6].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handleLayoutChange(cols.toString())}
                    className={`h-6 w-6 rounded flex items-center justify-center transition-all ${currentCols === cols.toString()
                      ? "bg-white/10 text-white/90 shadow-sm"
                      : "text-white/20 hover:text-white/40 hover:bg-white/5"
                      }`}
                    title={`Switch to ${cols} columns`}
                  >
                    <div className={`grid gap-0.5 ${cols === 2 ? 'grid-cols-1' : cols === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      <div className="h-1 w-1 bg-current rounded-full" />
                      <div className="h-1 w-1 bg-current rounded-full" />
                      {cols >= 4 && <div className="h-1 w-1 bg-current rounded-full" />}
                      {cols >= 4 && <div className="h-1 w-1 bg-current rounded-full" />}
                      {cols === 6 && <div className="h-1 w-1 bg-current rounded-full" />}
                      {cols === 6 && <div className="h-1 w-1 bg-current rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Status Info */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest leading-none">Live_Proto</span>
              </div>
            </div>
          </div>
        ) : (
          // Standard Global Navigation
          <nav className="flex items-center gap-2 mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href ?? "#"}
                  target={item.target}
                  rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                  className={`px-3 py-1.5 text-sm transition-colors ${active ? 'text-white font-medium' : 'text-white/40 hover:text-white/90'}`}
                  aria-label={item.name}
                  title={item.name}
                  onClick={(event) => {
                    if (!item.href) event.preventDefault();
                  }}
                >
                  {item.icon ? item.icon : item.name}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
