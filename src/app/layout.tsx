import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const pressStart2P = localFont({
  variable: "--font-press-start",
  src: [
    {
      path: "../../public/overpass-desktop-fonts/overpass-mono/overpass-mono-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

const geistSans = localFont({
  variable: "--font-geist-sans",
  src: [
    {
      path: "../../public/overpass-desktop-fonts/overpass/overpass-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/overpass-desktop-fonts/overpass/overpass-semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/overpass-desktop-fonts/overpass/overpass-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: [
    {
      path: "../../public/overpass-desktop-fonts/overpass-mono/overpass-mono-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/overpass-desktop-fonts/overpass-mono/overpass-mono-semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/overpass-desktop-fonts/overpass-mono/overpass-mono-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Typos",
  description: "The darkness is boundless",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

import { Suspense } from "react";

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem('typos-theme');
    const theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen flex flex-col relative bg-background`}
      >
        <script
          id="typos-theme-script"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />

        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
