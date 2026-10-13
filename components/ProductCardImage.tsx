'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

export interface ProductCardImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  fallbackClassName?: string;
}

/**
 * ProductCardImage:
 * Renders product images with width: 100% and height: auto so the image file dictates
 * its exact rendered height naturally without letterboxing (vertical bars) or
 * pillarboxing (horizontal bars).
 *
 * Designed specifically for carpet products which have diverse authentic aspect ratios
 * (runners, rectangular rugs, square mats) so there is zero dead space above or below the image.
 */
export function ProductCardImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackIcon,
  fallbackText,
  fallbackClassName = '',
}: ProductCardImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // If no source is provided or the image failed to load, show a clean, proportional fallback
  if (!src || hasError) {
    return (
      <div
        className={`w-full aspect-[4/3] flex flex-col items-center justify-center text-[#B5A595] p-4 text-center bg-[#F7F5F0] select-none ${fallbackClassName}`}
      >
        {fallbackIcon || <ShoppingBag className="w-8 h-8 opacity-40 mb-1" />}
        <span className="text-[10px] text-[#8A796B] font-medium line-clamp-1">
          {fallbackText || alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-transparent select-none ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-auto block transition-transform duration-500 group-hover:scale-105 pointer-events-none ${className}`}
      />
    </div>
  );
}

export default ProductCardImage;
