'use client';

import { useRouter, usePathname } from 'next/navigation';
import Dock from './dock/Dock';
import { VscHome, VscArchive, VscNote, VscAccount } from 'react-icons/vsc';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function DockNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dock');

  const items = [
    {
      icon: <VscHome size={18} />,
      label: t('home'),
      onClick: () => router.push('/'),
      active: pathname === '/'
    },
    {
      icon: <VscArchive size={18} />,
      label: t('posts'),
      onClick: () => router.push('/posts'),
      active: pathname.startsWith('/posts')
    },
    {
      icon: <Image src="/icon3.svg" alt={t('categoryAlt')} width={50} height={50} className="opacity-90 invert" />,
      label: t('moments'),
      onClick: () => window.open('/moments', '_blank'),
      active: pathname === '/moments'
    },
    {
      icon: <VscNote size={18} />,
      label: t('daily'),
      onClick: () => router.push('/daily'),
      active: pathname === '/daily'
    },
    {
      icon: <VscAccount size={18} />,
      label: t('about'),
      onClick: () => router.push('/about'),
      active: pathname === '/about'
    },
  ];

  return (
    <>
      <Dock
        items={items}
        panelHeight={70}
        baseItemSize={50}
        magnification={70}
      />
    </>
  );
}
