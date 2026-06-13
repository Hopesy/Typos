export type Locale = (typeof locales)[number];

export const locales = ['zh', 'en'] as const;
export const defaultLocale: Locale = 'zh';

// Cookie read server-side by src/i18n/request.ts and written by setUserLocale().
export const LOCALE_COOKIE = 'typos-lang';
