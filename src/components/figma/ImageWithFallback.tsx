"use client";

import React, { useState } from "react";
import Image from "next/image";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

/** Domains configured in next.config.ts remotePatterns */
const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "www.hok.com",
  "miro.medium.com",
  "blog.novatr.com",
]);

function isOptimizable(src: string | undefined): boolean {
  if (!src) return false;
  // Local/static imports (relative paths or Next.js internal)
  if (src.startsWith("/") || src.startsWith("/_next")) return true;
  try {
    const { hostname } = new URL(src);
    return OPTIMIZED_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

/**
 * Detect if the image is absolutely positioned inside a sized parent.
 * In that case, next/image `fill` mode is safe (parent defines dimensions).
 */
function shouldUseFill(className: string | undefined): boolean {
  if (!className) return false;
  return /\babsolute\b/.test(className) || /\binset-0\b/.test(className);
}

type ImageWithFallbackProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "width" | "height"
> & {
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const {
    src,
    alt = "",
    style,
    className,
    loading = "lazy",
    priority,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px",
    quality,
    ...rest
  } = props;

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ERROR_IMG_SRC}
            alt="Error loading image"
            {...rest}
            data-original-url={src}
          />
        </div>
      </div>
    );
  }

  // Use Next.js Image for optimizable sources with absolute/fill layout
  if (src && typeof src === "string" && isOptimizable(src) && shouldUseFill(className)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes}
        loading={priority ? undefined : (loading as "lazy" | "eager")}
        priority={priority}
        quality={quality}
        onError={() => setDidError(true)}
      />
    );
  }

  // For all other images: use <img> with lazy loading
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}
