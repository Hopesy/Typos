'use client';

import { useTranslations } from "next-intl";

export function PostNotFound() {
    const t = useTranslations('posts');
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold">{t('notFound')}</h1>
        </div>
    );
}
