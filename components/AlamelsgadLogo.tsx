'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';

interface AlamelsgadLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'horizontal' | 'compact' | 'text-only';
  theme?: 'dark' | 'light' | 'gold';
  showTagline?: boolean;
}

/**
 * Authentic Alamelsgad (عالم السجاد) Brand Logo Component
 * Faithful to the primary visual identity:
 * - Circular warm cream seal with soft palm shadow
 * - Traditional geometric diamond carpet motif at the top
 * - Arabic calligraphy "عالم السجاد" with diamond diacritic
 * - Elegant gold separator with diamond
 * - Tagline: "لمسة تغيّر شكل بيتك"
 * - Hand-woven carpet fringe along the lower border
 */
export function AlamelsgadMark({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label="شعار عالم السجاد - Alamelsgad"
    >
      <defs>
        {/* Warm cream gradient matching the emblem */}
        <radialGradient id="sealBg" cx="45%" cy="40%" r="65%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#F9F6F0" />
          <stop offset="60%" stopColor="#EDE5DC" />
          <stop offset="100%" stopColor="#E2D7CC" />
        </radialGradient>

        {/* Soft shadow for depth */}
        <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2A1C12" floodOpacity="0.1" />
        </filter>

        {/* Clip path for circular seal */}
        <clipPath id="circleClip">
          <circle cx="100" cy="100" r="96" />
        </clipPath>
      </defs>

      {/* Main Circular Seal */}
      <g clipPath="url(#circleClip)">
        <circle cx="100" cy="100" r="96" fill="url(#sealBg)" />

        {/* Subtle decorative wheat/palm leaf shadow on left */}
        <path
          d="M 15 130 C 25 110 32 80 28 50 C 26 40 22 30 18 20"
          stroke="#D6C7B7"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 22 95 C 28 90 35 92 38 98"
          stroke="#D6C7B7"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 26 80 C 33 75 40 78 43 85"
          stroke="#D6C7B7"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M 27 65 C 34 60 41 63 43 70"
          stroke="#D6C7B7"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Top Carpet Geometric Diamond Motif (Stepped Lozenge) */}
        <g transform="translate(100, 36)" stroke="#A27B5C" strokeWidth="2" fill="none">
          {/* Outer stepped diamond */}
          <path d="M 0 -14 L 14 0 L 0 14 L -14 0 Z" strokeWidth="1.8" />
          {/* Inner diamond */}
          <path d="M 0 -7 L 7 0 L 0 7 L -7 0 Z" fill="#A27B5C" opacity="0.3" strokeWidth="1.5" />
          {/* Stepped corner accents */}
          <path d="M -9 -9 L -13 -13 M 9 -9 L 13 -13 M -9 9 L -13 13 M 9 9 L 13 13" strokeWidth="1.5" />
          {/* Center dot */}
          <circle cx="0" cy="0" r="1.5" fill="#A27B5C" />
        </g>

        {/* Main Calligraphy: "عالم السجاد" in Deep Charcoal-Brown */}
        <text
          x="100"
          y="84"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif"
          fontWeight="800"
          fontSize="36"
          letterSpacing="-0.5px"
          fill="#251811"
        >
          عالم
        </text>

        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif"
          fontWeight="800"
          fontSize="34"
          letterSpacing="-0.5px"
          fill="#251811"
        >
          السجاد
        </text>

        {/* Traditional Diamond Dot under the "ج" */}
        <g transform="translate(112, 126)">
          <path d="M 0 -3 L 3 0 L 0 3 L -3 0 Z" fill="#A27B5C" />
        </g>

        {/* Gold Separator Hairline with Centered Diamond */}
        <g transform="translate(100, 133)">
          <line x1="-55" y1="0" x2="-6" y2="0" stroke="#B8946E" strokeWidth="0.8" opacity="0.8" />
          <path d="M 0 -3 L 3 0 L 0 3 L -3 0 Z" fill="#B8946E" />
          <line x1="6" y1="0" x2="55" y2="0" stroke="#B8946E" strokeWidth="0.8" opacity="0.8" />
        </g>

        {/* Tagline: "لمسة تغيّر شكل بيتك" */}
        <text
          x="100"
          y="146"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif"
          fontWeight="500"
          fontSize="10.5"
          letterSpacing="0.2px"
          fill="#3E2B20"
        >
          لمسة تغيّر شكل بيتك
        </text>

        {/* Woven Carpet Fringe Border at the Bottom */}
        <g transform="translate(100, 172)">
          {/* Carpet edge patterned band */}
          <path
            d="M -75 -4 C -40 6, 40 6, 75 -4 L 80 8 C 40 18, -40 18, -80 8 Z"
            fill="#5D3A24"
          />
          <path
            d="M -72 -2 C -40 7, 40 7, 72 -2"
            stroke="#C49F74"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* Carpet tassels/fringes along the lower curve */}
          {[-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60].map((x, i) => {
            const yOffset = Math.sin(((x + 60) / 120) * Math.PI) * 5;
            return (
              <line
                key={i}
                x1={x}
                y1={yOffset - 3}
                x2={x}
                y2={yOffset + 12}
                stroke="#D8C8B5"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Subtle rim border */}
        <circle cx="100" cy="100" r="95" stroke="#CBB9A5" strokeWidth="1" fill="none" opacity="0.7" />
      </g>
    </svg>
  );
}

export default function AlamelsgadLogo({
  className = '',
  size = 'md',
  variant = 'horizontal',
  theme = 'dark',
  showTagline = true,
}: AlamelsgadLogoProps) {
  const { isRtl } = useLanguage();

  const sizeMap = {
    xs: { mark: 30, title: 'text-sm', tag: 'text-[9px]', gap: 'gap-2' },
    sm: { mark: 38, title: 'text-base', tag: 'text-[10px]', gap: 'gap-2.5' },
    md: { mark: 48, title: 'text-lg', tag: 'text-[11px]', gap: 'gap-3' },
    lg: { mark: 60, title: 'text-xl', tag: 'text-xs', gap: 'gap-3.5' },
    xl: { mark: 76, title: 'text-2xl', tag: 'text-sm', gap: 'gap-4' },
  };

  const s = sizeMap[size];

  // Palette styling
  const textColor =
    theme === 'light'
      ? 'text-white'
      : theme === 'gold'
      ? 'text-[#A27B5C]'
      : 'text-[#251811]';

  const subTextColor =
    theme === 'light'
      ? 'text-[#F5EFEB]/80'
      : theme === 'gold'
      ? 'text-[#875F3E]'
      : 'text-[#6B5A4D]';

  if (variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <AlamelsgadMark size={s.mark * 1.5} />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${s.gap} ${className}`}>
        <AlamelsgadMark size={s.mark} />
        <span className={`font-bold tracking-tight ${s.title} ${textColor}`}>
          عالم السجاد
        </span>
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`flex flex-col leading-tight ${className}`}>
        <div className="flex items-baseline gap-2">
          <span className={`font-extrabold tracking-tight ${s.title} ${textColor}`}>
            عالم السجاد
          </span>
          <span className="text-[10px] tracking-wider uppercase text-[#A27B5C] font-semibold">
            ALAMELSGAD
          </span>
        </div>
        {showTagline && (
          <span className={`font-normal ${s.tag} ${subTextColor} mt-0.5`}>
            لمسة تغيّر شكل بيتك
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${s.gap} select-none ${className}`}>
      <AlamelsgadMark size={s.mark} />
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-2">
          <span className={`font-extrabold tracking-tight ${s.title} ${textColor}`}>
            عالم السجاد
          </span>
          <span className="text-[10px] sm:text-[11px] tracking-widest uppercase text-[#A27B5C] font-semibold">
            ALAMELSGAD
          </span>
        </div>
        {showTagline && (
          <span className={`font-normal ${s.tag} ${subTextColor} mt-0.5`}>
            لمسة تغيّر شكل بيتك
          </span>
        )}
      </div>
    </div>
  );
}
