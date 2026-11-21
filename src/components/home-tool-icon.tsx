import {
  FiBox,
  FiCode,
  FiCompass,
  FiCpu,
  FiFileText,
  FiGlobe,
  FiLayers,
  FiRefreshCw,
  FiTerminal,
  FiVideo,
} from 'react-icons/fi';
import type { HomeToolIconKey } from '@/lib/home-manage';

export function HomeToolIcon({
  name,
  className = 'w-6 h-6',
}: {
  name: HomeToolIconKey;
  className?: string;
}) {
  switch (name) {
    case 'file-text':
      return <FiFileText className={className} />;
    case 'layers':
      return <FiLayers className={className} />;
    case 'refresh':
      return <FiRefreshCw className={className} />;
    case 'video':
      return <FiVideo className={className} />;
    case 'terminal':
      return <FiTerminal className={className} />;
    case 'globe':
      return <FiGlobe className={className} />;
    case 'cpu':
      return <FiCpu className={className} />;
    case 'box':
      return <FiBox className={className} />;
    case 'compass':
      return <FiCompass className={className} />;
    case 'code':
    default:
      return <FiCode className={className} />;
  }
}
