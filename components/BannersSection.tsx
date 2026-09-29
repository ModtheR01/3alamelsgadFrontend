'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToccoStore } from '@/lib/store';
import { BannerItem, BannerType } from '@/types';
import Image from '@/components/SafeImage';
import {
  Sparkles,
  Tag,
  Calendar,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Flame,
} from 'lucide-react';

export default function BannersSection() {
  const { banners, navigateTo } = useToccoStore();
  const [selectedFilter, setSelectedFilter] = useState<BannerType>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active banners filtered by status and category tab
  const activeBanners = banners
    .filter((b) => b.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const displayedBanners =
    selectedFilter === 'all'
      ? activeBanners
      : activeBanners.filter((b) => b.type === selectedFilter);

  // Scroll listener to update active slide index on mobile / horizontal swipe
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth * 0.85;
    if (itemWidth > 0) {
      const index = Math.round(scrollLeft / itemWidth);
      setActiveSlideIndex(Math.min(Math.max(0, index), displayedBanners.length - 1));
    }
  };

  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const children = container.children;
    if (children && children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveSlideIndex(index);
    }
  };

  const handlePrev = () => {
    const newIdx = Math.max(0, activeSlideIndex - 1);
    scrollToSlide(newIdx);
  };

  const handleNext = () => {
    const newIdx = Math.min(displayedBanners.length - 1, activeSlideIndex + 1);
    scrollToSlide(newIdx);
  };

  // Copy promo code handler with feedback
  const handleCopyCode = (e: React.MouseEvent, code?: string) => {
    e.stopPropagation();
    if (!code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2800);
  };

  // Banner action handler
  const handleBannerClick = (banner: BannerItem) => {
    if (banner.actionType === 'copy_code' && banner.promoCode) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(banner.promoCode);
      }
      setCopiedCode(banner.promoCode);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2800);
      if (banner.targetView) {
        navigateTo(banner.targetView as any);
      }
      return;
    }

    if (banner.targetView) {
      if (banner.targetView === 'product' && banner.targetId) {
        navigateTo('product', { productId: banner.targetId });
      } else {
        navigateTo(banner.targetView as any);
      }
    }
  };

  if (activeBanners.length === 0) return null;

  // Filter options for tabs
  const filterOptions: { id: BannerType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Highlights', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'new_product', label: 'New Pieces', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'special_offer', label: 'Exclusive Privileges', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'upcoming_event', label: 'Atelier Events', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'custom_service', label: 'Bespoke Studio', icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  return (
    <section
      id="atelier-banners-section"
      className="relative py-10 sm:py-16 bg-[#F5F1EB] border-b border-[#E8E1D5] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B85D38] animate-pulse" />
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium text-[#B85D38]">
                Atelier Current · أحدث المستجدات والعروض
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[#1C1A19]">
              Highlights & Privileges
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] max-w-xl leading-relaxed">
              Discover recently unveiled monolithic pieces, limited atelier privileges, and upcoming architectural exhibitions.
            </p>
          </div>

          {/* Desktop Slide Navigation Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              id="banners-nav-prev-btn"
              onClick={handlePrev}
              disabled={activeSlideIndex === 0}
              aria-label="Previous highlight"
              className="w-10 h-10 rounded-full border border-[#DCD5C9] bg-white text-[#1C1A19] flex items-center justify-center hover:bg-[#FAF8F5] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-[#736B63] px-1">
              0{activeSlideIndex + 1} / 0{displayedBanners.length}
            </span>
            <button
              id="banners-nav-next-btn"
              onClick={handleNext}
              disabled={activeSlideIndex >= displayedBanners.length - 1}
              aria-label="Next highlight"
              className="w-10 h-10 rounded-full border border-[#DCD5C9] bg-white text-[#1C1A19] flex items-center justify-center hover:bg-[#FAF8F5] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile & Desktop Category Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.id;
            return (
              <button
                key={opt.id}
                id={`banner-filter-tab-${opt.id}`}
                onClick={() => {
                  setSelectedFilter(opt.id);
                  setActiveSlideIndex(0);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all touch-manipulation min-h-[40px] shrink-0 ${
                  isSelected
                    ? 'bg-[#1C1A19] text-white shadow-sm'
                    : 'bg-white/80 text-[#524B45] hover:bg-white hover:text-[#1C1A19] border border-[#E2DAD0]'
                }`}
              >
                <span className={isSelected ? 'text-[#EFEBE3]' : 'text-[#8E867D]'}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Horizontal Swipe Carousel (Engineered for Mobile Touch & Responsive Grid) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {displayedBanners.map((banner, index) => {
            const isCopied = copiedCode === banner.promoCode;

            // Icon by banner type
            let TypeIcon = Sparkles;
            if (banner.type === 'special_offer') TypeIcon = Tag;
            if (banner.type === 'upcoming_event') TypeIcon = Calendar;
            if (banner.type === 'custom_service') TypeIcon = Compass;

            return (
              <div
                key={banner.id}
                id={`banner-card-${banner.id}`}
                onClick={() => handleBannerClick(banner)}
                className="group relative w-[86vw] sm:w-[380px] lg:w-[410px] shrink-0 snap-center rounded-2xl overflow-hidden bg-[#1C1A19] text-white cursor-pointer shadow-[0_8px_24px_rgba(28,26,25,0.08)] hover:shadow-[0_16px_36px_rgba(28,26,25,0.16)] transition-all duration-300 flex flex-col justify-between"
                style={{ minHeight: '460px' }}
              >
                {/* Background Architectural Photography with Premium Gradient */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-85"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Multi-stage Dark Gradient to ensure WCAG AAA readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A19] via-[#1C1A19]/60 to-black/35" />
                </div>

                {/* Bottom Content Container */}
                <div className="relative z-10 p-5 sm:p-6 space-y-3.5 sm:space-y-4">
                  {/* Highlight pill (e.g. promo code or event location) */}
                  {banner.tagHighlight && (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/15 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-mono text-[#F4EFEA]">
                        {banner.type === 'upcoming_event' && <Calendar className="w-3 h-3 text-[#E0A96D]" />}
                        {banner.type === 'special_offer' && <Tag className="w-3 h-3 text-[#E0A96D]" />}
                        {banner.type === 'new_product' && <Sparkles className="w-3 h-3 text-[#E0A96D]" />}
                        {banner.type === 'custom_service' && <Compass className="w-3 h-3 text-[#E0A96D]" />}
                        <span>{banner.tagHighlight}</span>
                      </div>

                      {/* Quick Copy Button if it contains a promo code */}
                      {banner.promoCode && (
                        <button
                          id={`banner-copy-btn-${banner.id}`}
                          type="button"
                          onClick={(e) => handleCopyCode(e, banner.promoCode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] text-[#1C1A19] text-[11px] font-medium hover:bg-white active:scale-95 transition-all touch-manipulation shadow-xs"
                          title="Click to copy code"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#524B45]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white leading-snug group-hover:text-[#F3EFE6] transition-colors">
                      {banner.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#E0D8CC] line-clamp-3 leading-relaxed font-light">
                      {banner.subtitle}
                    </p>
                  </div>


                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Pagination Dots & Counter */}
        <div className="mt-5 flex sm:hidden items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {displayedBanners.map((_, idx) => (
              <button
                key={idx}
                id={`banner-dot-${idx}`}
                onClick={() => scrollToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 touch-manipulation ${
                  activeSlideIndex === idx ? 'w-7 bg-[#1C1A19]' : 'w-2 bg-[#D4CDC1]'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-[#736B63] uppercase tracking-wider">
            Swipe to view (0{activeSlideIndex + 1}/0{displayedBanners.length})
          </span>
        </div>
      </div>
    </section>
  );
}
