import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ArticleImageLightbox from "@/components/article-image-lightbox";

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
  description: "A minimal HUD-styled personal publishing system",
  icons: {
    icon: [
      { url: "/brand/typos/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/brand/typos/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/typos/typos-app-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/brand/typos/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem('typos-theme');
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    document.cookie = 'typos-theme=' + theme + '; path=/; max-age=31536000; samesite=lax';
  } catch {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  const initialTheme = cookieStore.get('typos-theme')?.value === 'light' ? 'light' : 'dark';

  return (
    <html
      lang={locale === 'en' ? 'en' : 'zh-CN'}
      className={initialTheme === 'dark' ? 'dark' : undefined}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script
          id="typos-theme-script"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen flex flex-col relative bg-background`}
      >
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
          <ArticleImageLightbox />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
