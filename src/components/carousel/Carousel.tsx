'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue, PanInfo, Transition } from 'motion/react';
// replace icons with your own if needed
import { FiCircle, FiCode, FiFileText, FiLayers, FiLayout } from 'react-icons/fi';

import './Carousel.css';

const DEFAULT_ITEMS = [
    {
        title: 'Text Animations',
        description: 'Cool text animations for your projects.',
        id: 1,
        icon: <FiFileText className="carousel-icon" />
    },
    {
        title: 'Animations',
        description: 'Smooth animations for your projects.',
        id: 2,
        icon: <FiCircle className="carousel-icon" />
    },
    {
        title: 'Components',
        description: 'Reusable components for your projects.',
        id: 3,
        icon: <FiLayers className="carousel-icon" />
    },
    {
        title: 'Backgrounds',
        description: 'Beautiful backgrounds and patterns for your projects.',
        id: 4,
        icon: <FiLayout className="carousel-icon" />
    },
    {
        title: 'Common UI',
        description: 'Common UI components are coming soon!',
        id: 5,
        icon: <FiCode className="carousel-icon" />
    }
];

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface CarouselItemData {
    id?: number | string;
    title: string;
    description: string;
    icon: ReactNode;
    link?: string;
}

interface CarouselItemProps {
    item: CarouselItemData;
    index: number;
    itemWidth: number;
    round: boolean;
    trackItemOffset: number;
    x: MotionValue<number>;
    transition: Transition;
}

function CarouselItem({ item, index, itemWidth, round, trackItemOffset, x, transition }: CarouselItemProps) {
    const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
    const outputRange = [90, 0, -90];
    const rotateY = useTransform(x, range, outputRange, { clamp: false });

    return (
        <motion.div
            key={`${item?.id ?? index}-${index}`}
            className={`carousel-item ${round ? 'round' : ''}`}
            style={{
                width: itemWidth,
                height: round ? itemWidth : '100%',
                rotateY: rotateY,
                ...(round && { borderRadius: '50%' })
            }}
            transition={transition}
        >
            <div className={`carousel-item-header ${round ? 'round' : ''}`}>
                <span className="carousel-icon-container">{item.icon}</span>
            </div>
            <div className="carousel-item-content">
                <div className="carousel-item-title">{item.title}</div>
                <p className="carousel-item-description">{item.description}</p>
                {item.link && (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="carousel-item-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        查看 →
                    </a>
                )}
            </div>
        </motion.div>
    );
}

interface CarouselProps {
    items?: CarouselItemData[];
    baseWidth?: number;
    autoplay?: boolean;
    autoplayDelay?: number;
    pauseOnHover?: boolean;
    loop?: boolean;
    round?: boolean;
}

function CarouselInner({
    items = DEFAULT_ITEMS,
    baseWidth = 300,
    autoplay = false,
    autoplayDelay = 3000,
    pauseOnHover = false,
    loop = false,
    round = false
}: CarouselProps) {
    const containerPadding = 16;
    const itemWidth = baseWidth - containerPadding * 2;
    const trackItemOffset = itemWidth + GAP;
    const itemsForRender = useMemo(() => {
        if (!loop) return items;
        if (items.length === 0) return [];
        return [items[items.length - 1], ...items, items[0]];
    }, [items, loop]);

    const initialPosition = loop ? 1 : 0;
    const [position, setPosition] = useState(initialPosition);
    const x = useMotionValue(-initialPosition * trackItemOffset);
    const [isHovered, setIsHovered] = useState(false);
    const [isJumping, setIsJumping] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (pauseOnHover && containerRef.current) {
            const container = containerRef.current;
            const handleMouseEnter = () => setIsHovered(true);
            const handleMouseLeave = () => setIsHovered(false);
            container.addEventListener('mouseenter', handleMouseEnter);
            container.addEventListener('mouseleave', handleMouseLeave);
            return () => {
                container.removeEventListener('mouseenter', handleMouseEnter);
                container.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, [pauseOnHover]);

    useEffect(() => {
        if (!autoplay || itemsForRender.length <= 1) return undefined;
        if (pauseOnHover && isHovered) return undefined;

        const timer = setInterval(() => {
            setPosition(prev => Math.min(prev + 1, itemsForRender.length - 1));
        }, autoplayDelay);

        return () => clearInterval(timer);
    }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

    const effectivePosition = loop
        ? position
        : Math.max(0, Math.min(position, Math.max(itemsForRender.length - 1, 0)));

    const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

    const handleAnimationStart = () => {
        setIsAnimating(true);
    };

    const handleAnimationComplete = () => {
        if (!loop || itemsForRender.length <= 1) {
            setIsAnimating(false);
            return;
        }
        const lastCloneIndex = itemsForRender.length - 1;

        if (position === lastCloneIndex) {
            setIsJumping(true);
            const target = 1;
            setPosition(target);
            x.set(-target * trackItemOffset);
            requestAnimationFrame(() => {
                setIsJumping(false);
                setIsAnimating(false);
            });
            return;
        }

        if (position === 0) {
            setIsJumping(true);
            const target = items.length;
            setPosition(target);
            x.set(-target * trackItemOffset);
            requestAnimationFrame(() => {
                setIsJumping(false);
                setIsAnimating(false);
            });
            return;
        }

        setIsAnimating(false);
    };

    const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
        const { offset, velocity } = info;
        const direction =
            offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
                ? 1
                : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
                    ? -1
                    : 0;

        if (direction === 0) return;

        setPosition(prev => {
            const next = prev + direction;
            const max = itemsForRender.length - 1;
            return Math.max(0, Math.min(next, max));
        });
    };

    const dragProps = loop
        ? {}
        : {
            dragConstraints: {
                left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
                right: 0
            }
        };

    const activeIndex =
        items.length === 0
            ? 0
            : loop
                ? (effectivePosition - 1 + items.length) % items.length
                : Math.min(effectivePosition, items.length - 1);

    return (
        <div
            ref={containerRef}
            className={`carousel-container ${round ? 'round' : ''}`}
            style={{
                width: `${baseWidth}px`,
                ...(round && { height: `${baseWidth}px`, borderRadius: '50%' })
            }}
        >
            <motion.div
                className="carousel-track"
                drag={isAnimating ? false : 'x'}
                {...dragProps}
                style={{
                    width: itemWidth,
                    gap: `${GAP}px`,
                    perspective: 1000,
                    perspectiveOrigin: `${effectivePosition * trackItemOffset + itemWidth / 2}px 50%`,
                    x
                }}
                onDragEnd={handleDragEnd}
                animate={{ x: -(effectivePosition * trackItemOffset) }}
                transition={effectiveTransition}
                onAnimationStart={handleAnimationStart}
                onAnimationComplete={handleAnimationComplete}
            >
                {itemsForRender.map((item, index) => (
                    <CarouselItem
                        key={`${item?.id ?? index}-${index}`}
                        item={item}
                        index={index}
                        itemWidth={itemWidth}
                        round={round}
                        trackItemOffset={trackItemOffset}
                        x={x}
                        transition={effectiveTransition}
                    />
                ))}
            </motion.div>
            <div className={`carousel-indicators-container ${round ? 'round' : ''}`}>
                <div className="carousel-indicators">
                    {items.map((_, index) => (
                        <motion.div
                            key={index}
                            className={`carousel-indicator ${activeIndex === index ? 'active' : 'inactive'}`}
                            animate={{
                                scale: activeIndex === index ? 1.2 : 1
                            }}
                            onClick={() => setPosition(loop ? index + 1 : index)}
                            transition={{ duration: 0.15 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Carousel(props: CarouselProps) {
    const { items = DEFAULT_ITEMS, loop = false } = props;
    const resetKey = `${items.length}-${loop}`;
    return <CarouselInner key={resetKey} {...props} items={items} loop={loop} />;
}
