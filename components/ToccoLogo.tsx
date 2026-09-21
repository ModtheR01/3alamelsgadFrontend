import React from 'react';

interface ToccoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol-only' | 'wordmark-only' | 'circular';
  theme?: 'dark' | 'light' | 'terracotta' | 'contrast';
  showSubtitle?: boolean;
}

/**
 * Authentic Tocco House Brand Mark & Logo Component
 * Based on the original Egyptian design studio identity:
 * - Circular brown seal
 * - Overhead architectural lintel beam
 * - Fluid sculptural arch / portal with flared feet
 */
export function ToccoMark({
  size = 40,
  fillColor = '#FFFFFF',
  circleBg = '#5E3B26',
  hasCircle = true,
  className = '',
}: {
  size?: number;
  fillColor?: string;
  circleBg?: string;
  hasCircle?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block transition-transform duration-300 ${className}`}
      aria-label="Tocco House Mark"
    >
      {hasCircle && (
        <circle cx="50" cy="50" r="50" fill={circleBg} />
      )}
      
      {/* Upper Lintel Beam */}
      <rect
        x="41"
        y="30"
        width="18"
        height="2.2"
        rx="0.5"
        fill={fillColor}
      />

      {/* Architectural Sculptural Arch with flared feet */}
      <path
        d="M 35 69.5 
           C 36.5 69.5 41.5 69 41.8 68
           C 41 64 34.5 57 34.5 49
           C 34.5 40 41 38 50 38
           C 59 38 65.5 40 65.5 49
           C 65.5 57 59 64 58.2 68
           C 58.5 69 63.5 69.5 65 69.5
           C 68.5 69.5 67 65 67.8 61
           C 68.6 52 61.5 41.5 50 41.5
           C 38.5 41.5 31.4 52 32.2 61
           C 33 65 31.5 69.5 35 69.5 Z"
        fill={fillColor}
      />
    </svg>
  );
}

export default function ToccoLogo({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'dark',
  showSubtitle = false,
}: ToccoLogoProps) {
  const sizeMap = {
    sm: { markSize: 28, textClass: 'text-sm tracking-[0.25em]', subTextClass: 'text-[9px] tracking-[0.25em]' },
    md: { markSize: 36, textClass: 'text-base tracking-[0.3em]', subTextClass: 'text-[10px] tracking-[0.3em]' },
    lg: { markSize: 48, textClass: 'text-xl tracking-[0.35em]', subTextClass: 'text-[11px] tracking-[0.35em]' },
    xl: { markSize: 64, textClass: 'text-3xl tracking-[0.4em]', subTextClass: 'text-[13px] tracking-[0.4em]' },
  };

  const currentSize = sizeMap[size];

  // Colors
  const textColor =
    theme === 'light'
      ? 'text-white'
      : theme === 'terracotta'
      ? 'text-[#643D26]'
      : 'text-[#1C1A19]';

  const subTextColor =
    theme === 'light'
      ? 'text-[#F5F2EB]/70'
      : theme === 'terracotta'
      ? 'text-[#8A5636]'
      : 'text-[#736B63]';

  const markFill = theme === 'light' ? '#FFFFFF' : '#FFFFFF';
  const circleBg =
    theme === 'light'
      ? '#442817'
      : theme === 'terracotta'
      ? '#8A5636'
      : '#5E3B26';

  if (variant === 'symbol-only') {
    return (
      <ToccoMark
        size={currentSize.markSize}
        circleBg={circleBg}
        fillColor={markFill}
        className={className}
      />
    );
  }

  if (variant === 'wordmark-only') {
    return (
      <div className={`flex flex-col items-start leading-none ${className}`}>
        <span className={`font-medium uppercase select-none ${currentSize.textClass} ${textColor}`}>
          TOCCO HOUSE
        </span>
        {showSubtitle && (
          <span className={`uppercase font-light mt-1 select-none ${currentSize.subTextClass} ${subTextColor}`}>
            The Touch That Elevates
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <ToccoMark
        size={currentSize.markSize}
        circleBg={circleBg}
        fillColor={markFill}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-medium uppercase tracking-[0.28em] ${currentSize.textClass} ${textColor}`}>
          TOCCO HOUSE
        </span>
        {showSubtitle && (
          <span className={`uppercase font-light tracking-[0.28em] mt-1 ${currentSize.subTextClass} ${subTextColor}`}>
            The Touch That Elevates
          </span>
        )}
      </div>
    </div>
  );
}
