'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { APP_BUILD_INFO, APP_VERSION_LABEL } from "@/lib/app-version";

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;

  return (
    <footer className="mt-auto border-t border-hud-line-soft bg-background/50 backdrop-blur-md">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted sm:flex-row">
          <span title={APP_BUILD_INFO}>
            Typos {APP_VERSION_LABEL} © {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Hopesy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-hud-strong"
            >
              GitHub
            </a>
            <span aria-hidden="true" className="h-2.5 w-px bg-hud-line" />
            <a
              href="mailto:zhlhopesy@gmail.com"
              className="transition-colors hover:text-hud-strong"
            >
              Email
            </a>
            <span aria-hidden="true" className="h-2.5 w-px bg-hud-line" />
            <Link
              href="/about"
              className="transition-colors hover:text-hud-strong"
            >
              {t('about')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
