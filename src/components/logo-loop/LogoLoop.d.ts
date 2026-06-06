import { ReactNode, CSSProperties } from 'react';

export interface LogoItem {
    node?: ReactNode;
    src?: string;
    srcSet?: string;
    sizes?: string;
    width?: number | string;
    height?: number | string;
    alt?: string;
    title?: string;
    href?: string;
    ariaLabel?: string;
}

export interface LogoLoopProps {
    logos: LogoItem[];
    speed?: number;
    direction?: 'left' | 'right' | 'up' | 'down';
    width?: string | number;
    logoHeight?: string | number;
    gap?: number;
    pauseOnHover?: boolean;
    hoverSpeed?: number;
    fadeOut?: boolean;
    fadeOutColor?: string;
    scaleOnHover?: boolean;
    renderItem?: (item: LogoItem, index: string) => ReactNode;
    ariaLabel?: string;
    className?: string;
    style?: CSSProperties;
}

declare const LogoLoop: React.MemoExoticComponent<(props: LogoLoopProps) => JSX.Element>;

export default LogoLoop;
