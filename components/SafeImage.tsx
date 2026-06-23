"use client";

import Image, { type ImageProps } from "next/image";
import { Maximize } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SafeImageProps = ImageProps & {
  /** Extra classes for the fallback placeholder wrapper. */
  fallbackClassName?: string;
};

/**
 * next/image wrapper that renders a placeholder icon instead of triggering
 * an optimizer request when the source is missing or fails to load
 * (e.g. seed/demo URLs that 404).
 */
export function SafeImage({ src, alt, fallbackClassName, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gray-100 text-gray-300",
          fallbackClassName,
        )}
      >
        <Maximize className="h-10 w-10" />
      </div>
    );
  }

  return <Image src={src} alt={alt} onError={() => setFailed(true)} {...props} />;
}
