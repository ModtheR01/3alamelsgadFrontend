'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';

/**
 * Curated pool of high-resolution, contemporary design, sculptural furniture,
 * and architectural photography from Unsplash to use as random fallbacks
 * whenever an image fails to load.
 */
export const FALLBACK_IMAGES: string[] = [
  // Sculptural furniture & pieces
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=80',
  // Architectural spaces & ateliers
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  // High-reliability local fallback
  '/images/hero_villa_clean.jpg',
];

/**
 * Returns a random fallback image from the curated pool, optionally different from the failed URL.
 */
export function getRandomFallbackImage(excludeUrl?: string): string {
  const pool = excludeUrl
    ? FALLBACK_IMAGES.filter((img) => img !== excludeUrl)
    : FALLBACK_IMAGES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || FALLBACK_IMAGES[0];
}

export interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | undefined | null;
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  alt = 'Tocco House design object',
  fallbackSrc,
  referrerPolicy = 'no-referrer',
  onError,
  className,
  ...rest
}: SafeImageProps) {
  const [prevSrc, setPrevSrc] = useState<string | undefined | null>(src);
  const [fallbackOverride, setFallbackOverride] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Synchronize state during render when prop changes (React recommended pattern)
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFallbackOverride(null);
    setRetryCount(0);
  }

  const cleanedSrc =
    typeof src === 'string' && src.includes('photo-1533090161767-e6ffed986b88')
      ? src.replace('photo-1533090161767-e6ffed986b88', 'photo-1616486338812-3dadae4b4ace')
      : src;

  const effectiveSrc =
    fallbackOverride || cleanedSrc || fallbackSrc || getRandomFallbackImage();

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Prevent infinite loop if multiple fallbacks fail
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        const nextFallback = fallbackSrc || getRandomFallbackImage(effectiveSrc);
        setFallbackOverride(nextFallback);
      } else if (effectiveSrc !== '/images/hero_villa_clean.jpg') {
        // Ultimate guaranteed local fallback
        setFallbackOverride('/images/hero_villa_clean.jpg');
      }

      if (onError) {
        onError(e);
      }
    },
    [effectiveSrc, fallbackSrc, onError, retryCount]
  );

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      referrerPolicy={referrerPolicy}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}

export { SafeImage };
