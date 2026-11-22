import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = 32,
  alt = "Typos",
  className,
}: {
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src="/brand/typos/typos-mark.svg"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 dark:invert", className)}
    />
  );
}

export function BrandWordmark({
  alt = "Typos",
  className,
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src="/brand/typos/typos-lettering.svg"
      alt={alt}
      width={1600}
      height={360}
      className={cn("h-auto w-24 shrink-0 dark:invert", className)}
    />
  );
}
