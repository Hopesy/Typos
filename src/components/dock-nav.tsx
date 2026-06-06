'use client';

import { useRouter, usePathname } from 'next/navigation';
import Dock from './dock/Dock';
import { VscHome, VscArchive, VscNote, VscAccount } from 'react-icons/vsc';
import Image from 'next/image';

export function DockNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      icon: <VscHome size={18} />,
      label: '首页',
      onClick: () => router.push('/'),
      active: pathname === '/'
    },
    {
      icon: <VscArchive size={18} />,
      label: '合集',
      onClick: () => router.push('/posts'),
      active: pathname.startsWith('/posts')
    },
    {
      icon: <Image src="/icon3.svg" alt="分类" width={50} height={50} className="opacity-90 invert" />,
      label: '瞬间',
      onClick: () => window.open('/moments', '_blank'),
      active: pathname === '/moments'
    },
    {
      icon: <VscNote size={18} />,
      label: '日常',
      onClick: () => router.push('/daily'),
      active: pathname === '/daily'
    },
    {
      icon: <VscAccount size={18} />,
      label: '关于',
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
