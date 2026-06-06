'use client';

import { useSearchParams } from "next/navigation";
import { HeicImage } from "@/components/heic-image";
import { motion, AnimatePresence } from "framer-motion";

interface Moment {
    date: string;
    title: string;
    image: string;
    html?: string;
}

interface MomentsGridProps {
    moments: Moment[];
}

export function MomentsGrid({ moments }: MomentsGridProps) {
    const searchParams = useSearchParams();
    const cols = searchParams.get('cols') || '4';

    // Map cols to Tailwind classes
    const getColumnsClass = (c: string) => {
        switch (c) {
            case '2':
                return 'columns-1 sm:columns-2';
            case '6':
                return 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7';
            case '4':
            default:
                return 'columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6';
        }
    };

    return (
        <motion.div
            layout
            className={`${getColumnsClass(cols)} gap-px space-y-px transition-all duration-500`}
        >
            <AnimatePresence mode="popLayout">
                {moments.map((moment, index) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={`${moment.date}-${index}`}
                        className="group relative overflow-hidden bg-white/5 break-inside-avoid"
                    >
                        {moment.image ? (
                            <HeicImage
                                src={moment.image}
                                alt={moment.title || "Moment"}
                                className="w-full h-auto block transition-opacity duration-300"
                            />
                        ) : (
                            <div className="flex aspect-square w-full items-center justify-center text-[10px] text-white/10 uppercase font-mono">
                                No Image
                            </div>
                        )}

                        {/* Hover Overlay - Bottom-up gradient */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            {moment.title && (
                                <div className="text-[10px] text-white/90 line-clamp-2 px-6 font-mono uppercase tracking-widest text-center leading-relaxed">
                                    {moment.title}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
