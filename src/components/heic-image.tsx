"use client";

import React, { useState, useEffect } from "react";

interface HeicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

// DB Config
const DB_NAME = "heic-cache";
const STORE_NAME = "images";
const DB_VERSION = 1;

/**
 * 获取 IndexedDB 实例
 */
function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 从缓存获取图片
 */
async function getFromCache(key: string): Promise<Blob | null> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("Cache access failed:", e);
        return null;
    }
}

/**
 * 存入缓存
 */
async function saveToCache(key: string, blob: Blob) {
    try {
        const db = await getDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(blob, key);
    } catch (e) {
        console.warn("Cache save failed:", e);
    }
}

export function HeicImage({ src, alt, className, ...props }: HeicImageProps) {
    const [displaySrc, setDisplaySrc] = useState<string>(src);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const isHeic = src.toLowerCase().endsWith(".heic");

        if (!isHeic) {
            const timer = window.setTimeout(() => {
                setDisplaySrc(src);
            }, 0);
            return () => window.clearTimeout(timer);
        }

        let isMounted = true;
        let objectUrl: string | null = null;

        const loadAndConvert = async () => {
            setLoading(true);
            setError(false);

            try {
                // 1. 尝试从 IndexedDB 获取
                const cachedBlob = await getFromCache(src);
                if (cachedBlob && isMounted) {
                    objectUrl = URL.createObjectURL(cachedBlob);
                    setDisplaySrc(objectUrl);
                    setLoading(false);
                    return;
                }

                // 2. 缓存未命中，开始转换
                const heic2any = (await import("heic2any")).default;
                const response = await fetch(src);
                const blob = await response.blob();

                const converted = await heic2any({
                    blob,
                    toType: "image/jpeg",
                    quality: 0.8
                });

                const finalBlob = Array.isArray(converted) ? converted[0] : converted;

                // 3. 存入缓存
                await saveToCache(src, finalBlob);

                if (isMounted) {
                    objectUrl = URL.createObjectURL(finalBlob);
                    setDisplaySrc(objectUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error("HEIC processing error:", err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        loadAndConvert();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    if (loading) {
        return (
            <div className={`${className} bg-white/5 flex items-center justify-center animate-pulse min-h-[200px]`}>
                <span className="font-mono text-[8px] text-white/20">PREPARING_IMAGE...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} bg-red-500/10 flex items-center justify-center min-h-[100px]`}>
                <span className="font-mono text-[8px] text-red-400/50">UNABLE_TO_LOAD_IMAGE</span>
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element -- HEIC conversion renders blob URLs that next/image cannot optimize.
        <img
            src={displaySrc}
            alt={alt}
            className={className}
            {...props}
        />
    );
}
