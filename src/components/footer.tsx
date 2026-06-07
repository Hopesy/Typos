'use client';

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;

  return (
    <footer className="mt-auto border-t border-white/5 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto px-6 py-10">
        <div className="flex justify-center font-mono text-[9px] tracking-[0.15em] text-white/40 uppercase">
          Typos © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
