'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { useTranslations } from "next-intl";

const navItems = [
  { key: "nav.home", href: "/" },
  { key: "nav.posts", href: "/posts" },
  { key: "nav.category", href: "/moments", target: "_blank", isIcon: true },
  { key: "nav.daily", href: "/daily" },
  { key: "nav.about", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const isMomentsPage = pathname === "/moments";
  const isAdminPage = pathname?.startsWith("/admin");
  const [viewCount, setViewCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
              <div className="h-8 w-8 rounded-full border border-hud-line flex items-center justify-center bg-hud-panel">
                <Image src="/icon3.svg" alt="Avatar" width={20} height={20} className="h-5 w-5 dark:invert dark:brightness-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-press-start text-[10px] text-hud-strong">TYPOS</span>
                <span className="font-mono text-[10px] text-hud-muted uppercase tracking-normal mt-1">
                  Views: {viewCount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Layout Switcher */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-hud-panel border border-hud-line cursor-pointer">
                {[2, 4, 6].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handleLayoutChange(cols.toString())}
                    className={`h-6 w-6 rounded flex items-center justify-center transition-all ${currentCols === cols.toString()
                      ? "bg-hud-soft text-hud-strong shadow-sm"
                      : "text-hud-faint hover:text-hud-muted hover:bg-hud-panel-strong"
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
                <span className="font-mono text-[10px] text-hud-dim uppercase tracking-[0.18em] leading-none">Live_Proto</span>
              </div>
              <LangToggle compact />
              <ThemeToggle compact />
            </div>
          </div>
        ) : (
          // Standard Global Navigation
          <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex mx-auto items-center gap-2">
              <nav className="flex items-center gap-2">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const label = t(item.key);
                  return (
                    <Link
                      key={item.key}
                      href={item.href ?? "#"}
                      target={item.target}
                      rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                      className={`px-3 py-1.5 text-sm transition-colors ${active ? 'text-hud-strong font-medium' : 'text-hud-muted hover:text-hud-strong'}`}
                      aria-label={label}
                      title={label}
                      onClick={(event) => {
                        if (!item.href) event.preventDefault();
                      }}
                    >
                      {item.isIcon ? (
                        <Image src="/icon3.svg" alt={label} width={42} height={42} className="opacity-90 dark:invert" />
                      ) : label}
                    </Link>
                  );
                })}
              </nav>
              <Link
                href="/admin"
                className="px-3 py-1.5 text-sm text-hud-muted hover:text-hud-strong transition-colors font-mono"
                title="Admin"
              >
                Typos
              </Link>
              <LangToggle compact />
              <ThemeToggle compact />
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden w-full items-center justify-between">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-hud-muted hover:text-hud-strong transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Site Logo/Name */}
              <Link href="/" className="font-press-start text-[10px] text-hud-strong">
                TYPOS
              </Link>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <LangToggle compact />
                <ThemeToggle compact />
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 top-14 z-40 md:hidden">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-background/95 backdrop-blur-lg"
                  onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu Content */}
                <nav className="relative h-full overflow-y-auto">
                  <div className="container mx-auto px-6 py-8 space-y-1">
                    {navItems.map((item) => {
                      const active = isActive(item.href);
                      const label = t(item.key);
                      return (
                        <Link
                          key={item.key}
                          href={item.href ?? "#"}
                          target={item.target}
                          rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                          className={`flex items-center justify-between px-4 py-4 text-base border-b border-hud-line-soft transition-colors ${
                            active ? 'text-hud-strong font-medium' : 'text-hud-muted'
                          }`}
                          onClick={(event) => {
                            if (!item.href) event.preventDefault();
                          }}
                        >
                          {item.isIcon ? (
                            <span className="flex items-center gap-3">
                              <Image src="/icon3.svg" alt={label} width={24} height={24} className="opacity-90 dark:invert" />
                              <span>{label}</span>
                            </span>
                          ) : (
                            <span>{label}</span>
                          )}
                          {active && <span className="text-hud-faint text-sm">•</span>}
                        </Link>
                      );
                    })}
                    <Link
                      href="/admin"
                      className="flex items-center justify-between px-4 py-4 text-base border-b border-hud-line-soft text-hud-muted font-mono"
                    >
                      <span>Typos</span>
                    </Link>
                  </div>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
