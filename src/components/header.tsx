'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { BrandMark, BrandWordmark } from "@/components/brand-mark";
import { createPortal } from "react-dom";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { useTranslations } from "next-intl";

const navItems = [
  { key: "nav.home", href: "/" },
  { key: "nav.posts", href: "/posts" },
  { key: "nav.moments", href: "/moments", target: "_blank" },
  { key: "nav.daily", href: "/daily" },
  { key: "nav.about", href: "/about" },
];

const adminEntryClassName = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-hud-muted transition-colors hover:bg-hud-soft hover:text-hud-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const isHomePage = pathname === "/";
  const isMomentsPage = pathname === "/moments";
  const isAdminPage = pathname?.startsWith("/admin");
  const [viewCount, setViewCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  if (isAdminPage) return null;

  const mobileMenu =
    mounted && mobileMenuOpen
      ? createPortal(
        <div
          className="fixed inset-0 z-[100] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('aria.mobileNavigation')}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-background/75 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t('aria.closeNavigation')}
          />

          <aside
            id="mobile-navigation-panel"
            className="relative z-10 flex h-dvh w-[min(82vw,20rem)] flex-col overflow-y-auto border-r border-hud-line bg-background/95 shadow-[18px_0_48px_rgba(0,0,0,0.22)] dark:bg-background/95"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-hud-line-soft px-4">
              <Link
                href="/"
                className="inline-flex items-center text-hud-strong"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BrandWordmark className="w-24" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-hud-muted transition-colors hover:text-hud-strong"
                aria-label={t('aria.closeNavigation')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-5" aria-label={t('aria.mainNavigation')}>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const label = t(item.key);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      target={item.target}
                      rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                      aria-label={label}
                      aria-current={active ? 'page' : undefined}
                      title={label}
                      className={`flex min-h-12 items-center justify-between border-b border-hud-line-soft px-3 text-base transition-colors ${
                        active ? 'text-hud-link font-medium' : 'text-hud-muted hover:text-hud-link'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{label}</span>
                      {active && <span className="text-hud-accent dark:text-hud-faint text-sm">•</span>}
                    </Link>
                  );
                })}
                <Link
                  href="/admin"
                  className={`${adminEntryClassName} mt-5`}
                  aria-label={t('nav.admin')}
                  title={t('nav.admin')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                </Link>
              </div>
            </nav>
          </aside>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isMomentsPage
        ? "bg-background/10 backdrop-blur-2xl [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]"
        : `bg-background/95 border-b backdrop-blur-md ${isHomePage ? 'border-transparent' : 'border-border/40'}`
        }`}>
        <div className={`mx-auto flex w-full items-center ${isMomentsPage ? 'h-14 max-w-full px-3 sm:px-6' : 'container h-14 max-w-5xl px-4 md:h-16'}`}>
          {isMomentsPage ? (
            // Moments Page Special Header
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-hud-line flex items-center justify-center bg-hud-panel">
                  <BrandMark size={20} alt="" className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex flex-col">
                  <BrandWordmark className="w-16 sm:w-[72px]" />
                  <span className="font-mono text-[9px] sm:text-[10px] text-hud-muted uppercase tracking-normal mt-0.5 sm:mt-1">
                    Views: {viewCount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                {/* Layout Switcher */}
                <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg bg-hud-panel border border-hud-line cursor-pointer">
                  {[2, 4, 6].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => handleLayoutChange(cols.toString())}
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded flex items-center justify-center transition-all ${currentCols === cols.toString()
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

                {/* Status Info - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
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
              <div className="hidden w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 md:grid lg:gap-8">
                <Link
                  href="/"
                  aria-label={`Typos · ${t('nav.home')}`}
                  className="justify-self-start rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud-strong"
                >
                  <BrandWordmark className="w-28" />
                </Link>
                <nav className="flex items-center gap-5 lg:gap-8" aria-label={t('aria.mainNavigation')}>
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    const label = t(item.key);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        target={item.target}
                        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                        className={`relative inline-flex h-9 items-center whitespace-nowrap rounded-md text-sm leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hud-strong ${active ? 'text-hud-link font-medium' : 'text-hud-muted hover:text-hud-link'}`}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        title={label}
                      >
                        {label}
                        <span aria-hidden className={`absolute bottom-[3px] left-1/2 h-0.5 -translate-x-1/2 bg-hud-accent transition-all duration-200 dark:h-px ${active ? 'w-5 dark:w-4' : 'w-0'}`} />
                      </Link>
                    );
                  })}
                </nav>
                <div className="flex items-center justify-self-end gap-1.5 lg:gap-2">
                  <LangToggle compact appearance="plain" />
                  <ThemeToggle compact appearance="plain" />
                  <Link
                    href="/admin"
                    className={adminEntryClassName}
                    aria-label={t('nav.admin')}
                    title={t('nav.admin')}
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex w-full items-center justify-between gap-4 md:hidden">
                <Link href="/" className="inline-flex items-center text-hud-strong">
                  <BrandWordmark className="w-24" />
                </Link>
                <div className="flex items-center gap-1.5">
                  <LangToggle compact appearance="plain" />
                  <ThemeToggle compact appearance="plain" />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-hud transition-colors hover:bg-hud-soft hover:text-hud-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hud-strong"
                    aria-label={mobileMenuOpen ? t('aria.closeNavigation') : t('aria.openNavigation')}
                    aria-controls="mobile-navigation-panel"
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? <X className="h-4 w-4" strokeWidth={1.7} /> : <Menu className="h-4 w-4" strokeWidth={1.7} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
      {mobileMenu}
    </>
  );
}
