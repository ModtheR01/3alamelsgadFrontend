'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import { INITIAL_PRODUCTS } from '@/lib/initialData';
import { offerService } from '@/lib/api/services/offerService';
import { BackendOffer } from '@/types/offer';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import Image from '@/components/SafeImage';
import { AlamelsgadMark } from './AlamelsgadLogo';

// High-fidelity luxury carpet photography assets
const CARPET_ASSETS = {
  heroSlide1: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1920&q=85',
  heroSlide2: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1920&q=85',
  heroSlide3: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85',
  turkish: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80',
  oriental: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
  alternatives: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
  arawal: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  showroom: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
};

/**
 * 1. HERO SLIDESHOW (Harir EG Inspired Slideshow)
 * Features auto-play, slick arrow controls, and clean luxury typography
 * Pagination numbers and dots indicators removed as requested.
 */
// Hero Slides static data
const HERO_SLIDES = [
  {
    id: 0,
    image: CARPET_ASSETS.heroSlide1,
    badgeAr: 'تشكيلة ٢٠٢٦ الفاخرة',
    badgeEn: 'Luxury 2026 Collection',
    titleAr: 'أفخم تشكيلات السجاد التركي والشرقي',
    titleEn: 'Fine Turkish & Oriental Carpets',
    subtitleAr: 'تصاميم استثنائية وأصواف تركية فائقة الكثافة تضفي على صالوناتك الدفء والجاذبية.',
    subtitleEn: 'Exceptional craftsmanship, high density weaves, and timeless luxury for your living spaces.',
    ctaPrimaryAr: 'تسوق التشكيلة الآن',
    ctaPrimaryEn: 'Shop Collection',
    ctaSecondaryAr: 'وصل حديثاً',
    ctaSecondaryEn: 'New Arrivals',
  },
  {
    id: 1,
    image: CARPET_ASSETS.heroSlide2,
    badgeAr: 'الأروال والمشايات بالمتر',
    badgeEn: 'Runner Rolls by Length',
    titleAr: 'رولات أروال ومشايات تناسب مقاساتك',
    titleEn: 'Runner Rolls Tailored to Your Length',
    subtitleAr: 'نوفر لك خيارات عرض متعددة مع تحديد الطول المطلوب بدقة متناهية لممراتك ومداخلك.',
    subtitleEn: 'Curated widths sold by exact meter length to complement any corridor or entryway.',
    ctaPrimaryAr: 'استعراض الأروال بالمتر',
    ctaPrimaryEn: 'Explore Runners',
    ctaSecondaryAr: 'الأسعار والمواصفات',
    ctaSecondaryEn: 'Specs & Prices',
  },
  {
    id: 2,
    image: CARPET_ASSETS.heroSlide3,
    badgeAr: 'بدائل السجاد العصرية',
    badgeEn: 'Modern Carpet Alternatives',
    titleAr: 'بدائل سجاد خفيفة، أنيقة، وعملية',
    titleEn: 'Modern, Washable & Practical Carpets',
    subtitleAr: 'خفيفة الوزن، سهلة التنظيف، وتدوم لسنوات بثبات عالٍ ومظهر يخطف الأنظار.',
    subtitleEn: 'Lightweight, washable, non-slip alternatives designed for seamless everyday living.',
    ctaPrimaryAr: 'اكتشف بدائل السجاد',
    ctaPrimaryEn: 'Browse Alternatives',
    ctaSecondaryAr: 'معرض المنصورة',
    ctaSecondaryEn: 'Visit Showroom',
  },
];

export function HomeHero() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = HERO_SLIDES;

  // Auto-play slideshow
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeSlide = slides[currentSlide];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Touch & Mouse horizontal swipe/drag handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isMouseDown = useRef(false);

  const handleSwipeDelta = useCallback((deltaX: number) => {
    const threshold = 45;
    if (Math.abs(deltaX) < threshold) return;

    if (deltaX < -threshold) {
      // Swiped left
      if (isRtl) {
        nextSlide();
      } else {
        nextSlide();
      }
    } else if (deltaX > threshold) {
      // Swiped right
      if (isRtl) {
        prevSlide();
      } else {
        prevSlide();
      }
    }
  }, [isRtl, nextSlide, prevSlide]);

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - (touchStartY.current || 0);

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      handleSwipeDelta(deltaX);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setIsPaused(false);
  };

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
    setIsPaused(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartX.current === null) return;
    const mouseEndX = e.clientX;
    const deltaX = mouseEndX - mouseStartX.current;
    handleSwipeDelta(deltaX);
    isMouseDown.current = false;
    mouseStartX.current = null;
    setIsPaused(false);
  };

  const handleMouseLeave = () => {
    isMouseDown.current = false;
    mouseStartX.current = null;
    setIsPaused(false);
  };

  return (
    <section
      id="homepage-hero-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="relative min-h-[82vh] sm:min-h-[88vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#1A1009] select-none cursor-grab active:cursor-grabbing touch-pan-y"
    >
      {/* Background Slides with Crossfade */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105 pointer-events-none'
          }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <Image
            src={slide.image}
            alt={slide.titleAr}
            fill
            priority={idx === 0}
            className="object-cover object-center brightness-[0.42] contrast-[1.08] pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Subtle Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#150D07] via-[#150D07]/45 to-[#150D07]/30 pointer-events-none" />
        </div>
      ))}

      {/* Main Slide Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center pt-24 sm:pt-28 pb-16 pointer-events-none">

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.14] text-white max-w-4xl drop-shadow-sm transition-all duration-700">
          {t(activeSlide.titleAr, activeSlide.titleEn)}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-lg md:text-xl text-[#E8DED3] font-light max-w-2xl mx-auto leading-relaxed">
          {t(activeSlide.subtitleAr, activeSlide.subtitleEn)}
        </p>

        {/* Action Buttons */}
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto pointer-events-auto">
          <button
            onClick={() => navigateTo('shop')}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-white hover:bg-[#F4ECE1] text-[#1F150F] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2.5 active:scale-95 group cursor-pointer"
          >
            <span>{t(activeSlide.ctaPrimaryAr, activeSlide.ctaPrimaryEn)}</span>
            <ArrowRight className={`w-4 h-4 text-[#A27B5C] transition-transform duration-200 ${isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </button>

        </div>
      </div>
    </section>
  );
}

/**
 * 2. NEW ARRIVALS CAROUSEL SECTION
 * Directly matches the reference luxury design (HARIR style):
 * - Clean "وصل حديثاً" / "New Arrivals" heading
 * - Horizontal carousel of product cards (6 visible on desktop in a single row)
 * - Large carpet photography with -X% OFF discount pill badge
 * - Product title, Brand name (عالم السجاد / ALAMELSGAD)
 * - Strikethrough old price + Current price
 * - Elegant gold/brown outlined "Buy Now" button
 * - Horizontal carousel navigation (< 1/12 >) with counter and arrow controls
 */
export function NewArrivalsSection() {
  const { products, isCatalogLoading, navigateTo } = useToccoStore();
  const { t, isRtl, language } = useLanguage();
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Fetch active backend offers to apply dynamic discounts
  useEffect(() => {
    let active = true;
    offerService
      .getOffers()
      .then((data) => {
        if (active) setOffers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setOffers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter published products & sort by newest; fallback to INITIAL_PRODUCTS so it never fails to show
  const newestProducts = useMemo(() => {
    const rawList = products && products.length > 0 ? products : INITIAL_PRODUCTS;
    const published = rawList.filter((p) => p.isPublished);
    const validList = published.length > 0 ? published : rawList;

    return [...validList].sort((a, b) => {
      const timeB = new Date(b.createdAt).getTime();
      const timeA = new Date(a.createdAt).getTime();
      if (!isNaN(timeB) && !isNaN(timeA) && timeB !== timeA) {
        return timeB - timeA;
      }
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [products]);

  // Reliable scroll left/right that works across Chrome, Safari, Firefox in both RTL and LTR
  const scroll = (direction: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector('[data-card="product"]') as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 16 : 240;
    const countToScroll = Math.max(1, Math.floor(container.clientWidth / cardWidth) || 1);
    const step = cardWidth * countToScroll;

    // In modern browsers, RTL next means scrolling towards negative left coordinates
    const delta = direction === 'next' ? (isRtl ? -step : step) : (isRtl ? step : -step);

    container.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  };

  // Mouse Drag to Scroll handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleProductNavigate = (productId: string) => {
    if (hasMovedRef.current) return; // Prevent navigation if the user was dragging
    navigateTo('product', { productId: String(productId) });
  };

  // If catalog is loading and no products yet, render matching skeleton placeholders
  const showSkeleton = isCatalogLoading && newestProducts.length === 0;
  const itemsToRender = showSkeleton
    ? Array.from({ length: 6 }).map((_, i) => ({ id: `skel-${i}` }))
    : newestProducts;

  const ArrowPrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const ArrowNextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section id="new-arrivals-section" className="py-12 sm:py-16 bg-white border-b border-[#EAE3D8] overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="mb-6 sm:mb-8 text-start flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-light text-[#251811] tracking-tight">
            {t('وصل حديثاً', 'New Arrivals')}
          </h2>

          {/* Top-Right Quick Arrows for Desktop */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('prev')}
              aria-label="Previous"
              className="w-8 h-8 rounded-full border border-[#DED4C7] hover:border-[#251811] hover:bg-[#FAF8F5] flex items-center justify-center text-[#5C4A3E] hover:text-[#251811] transition-all cursor-pointer"
            >
              <ArrowPrevIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('next')}
              aria-label="Next"
              className="w-8 h-8 rounded-full border border-[#DED4C7] hover:border-[#251811] hover:bg-[#FAF8F5] flex items-center justify-center text-[#5C4A3E] hover:text-[#251811] transition-all cursor-pointer"
            >
              <ArrowNextIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Container with Side Arrows */}
        <div className="relative group/carousel">
          {/* Side Arrow: Prev */}
          <button
            type="button"
            onClick={() => scroll('prev')}
            aria-label="Previous Products"
            className="hidden lg:flex absolute -start-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#251811] shadow-lg border border-[#EAE3D8] items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowPrevIcon className="w-5 h-5 text-[#4A3B32]" />
          </button>

          {/* Side Arrow: Next */}
          <button
            type="button"
            onClick={() => scroll('next')}
            aria-label="Next Products"
            className="hidden lg:flex absolute -end-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#251811] shadow-lg border border-[#EAE3D8] items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowNextIcon className="w-5 h-5 text-[#4A3B32]" />
          </button>

          {/* Horizontal Scroll / Drag Area */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1 scroll-smooth cursor-grab active:cursor-grabbing select-none [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {itemsToRender.map((item: any) => {
              if (showSkeleton) {
                return (
                  <div
                    key={item.id}
                    data-card="product"
                    className="w-[240px] sm:w-[220px] md:w-[calc((100%-2*16px)/3)] lg:w-[calc((100%-5*16px)/6)] shrink-0 flex flex-col justify-between animate-pulse"
                  >
                    <div className="aspect-[4/5] bg-[#EFEBE4] rounded-xs" />
                    <div className="pt-3 space-y-2">
                      <div className="h-4 bg-[#EFEBE4] rounded w-3/4" />
                      <div className="h-3 bg-[#EFEBE4] rounded w-1/3" />
                      <div className="h-4 bg-[#EFEBE4] rounded w-1/2" />
                      <div className="h-9 bg-[#EFEBE4] rounded w-full mt-3" />
                    </div>
                  </div>
                );
              }

              const product = item;
              // Check for matching active offer
              const productOffer = offers.find(
                (o) =>
                  o.is_active &&
                  Array.isArray(o.products) &&
                  o.products.some((p) => String(p.product_id) === String(product.id))
              );

              let discountPercent: number | null = null;
              let originalPrice: number | null = null;
              let currentPrice: number = product.price || 0;

              if (productOffer) {
                if (productOffer.percentage && Number(productOffer.percentage) > 0) {
                  discountPercent = Math.round(Number(productOffer.percentage));
                  originalPrice = Number(productOffer.original_price) || product.price;
                  currentPrice =
                    Number(productOffer.offer_price) ||
                    Math.round(product.price * (1 - discountPercent / 100));
                } else if (
                  Number(productOffer.discount_amount) > 0 &&
                  Number(productOffer.original_price) > 0
                ) {
                  originalPrice = Number(productOffer.original_price);
                  currentPrice =
                    Number(productOffer.offer_price) ||
                    originalPrice - Number(productOffer.discount_amount);
                  discountPercent = Math.round(
                    (Number(productOffer.discount_amount) / originalPrice) * 100
                  );
                }
              }

              const hasDiscount =
                discountPercent !== null && discountPercent > 0 && originalPrice !== null;
              const hasMultipleOptions =
                (product.sizes && product.sizes.length > 1) || product.isArawal;
              const productImage =
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={product.id}
                  data-card="product"
                  className="w-[240px] sm:w-[220px] md:w-[calc((100%-2*16px)/3)] lg:w-[calc((100%-5*16px)/6)] shrink-0 flex flex-col justify-between group select-none"
                >
                  {/* Image Container with Discount Badge */}
                  <div
                    onClick={() => handleProductNavigate(product.id)}
                    className="relative aspect-[4/5] bg-[#F5F2EB] overflow-hidden cursor-pointer rounded-xs"
                  >
                    <Image
                      src={productImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute bottom-3 start-3 z-10 pointer-events-none">
                        <span className="bg-[#A26D2B] text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shadow-xs tracking-wider select-none">
                          -{discountPercent}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="pt-3.5 pb-1 flex flex-col justify-between flex-1">
                    <div>
                      {/* Product Title */}
                      <h3
                        onClick={() => handleProductNavigate(product.id)}
                        className="text-xs sm:text-sm font-normal text-[#251811] line-clamp-1 group-hover:text-[#A27B5C] transition-colors cursor-pointer"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      {/* Brand Name */}
                      <span className="text-[10px] uppercase tracking-wider text-[#8A796B] font-medium block mt-1">
                        {language === 'ar' ? 'عالم السجاد' : 'ALAMELSGAD'}
                      </span>

                      {/* Price Section */}
                      <div className="mt-1.5 space-y-0.5">
                        {hasDiscount && originalPrice && (
                          <span className="text-[11px] text-[#8A796B] line-through block">
                            {language === 'ar'
                              ? `${originalPrice.toLocaleString()} ج.م`
                              : `LE ${originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`}
                          </span>
                        )}

                        <span className="text-xs sm:text-sm font-semibold text-[#251811] block">
                          {language === 'ar'
                            ? `${hasMultipleOptions ? 'من ' : ''}${currentPrice.toLocaleString()} ج.م`
                            : `${hasMultipleOptions ? 'From ' : ''}LE ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`}
                        </span>
                      </div>
                    </div>

                    {/* Buy Now Action Button */}
                    <div className="mt-3.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductNavigate(product.id);
                        }}
                        className="w-full py-2.5 px-3 border border-[#B08968] hover:border-[#8C6239] hover:bg-[#8C6239] text-[#8C6239] hover:text-white text-xs font-normal tracking-wide transition-all duration-200 text-center flex items-center justify-center cursor-pointer active:scale-[0.99] rounded-xs"
                      >
                        {t('اشتري الآن', 'Buy Now')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 3. CATEGORIES SHOWCASE (Curated Collections)
 */
export function CategoriesShowcase() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const collections = [
    {
      id: 'turkish',
      titleAr: 'سجاد تركي فاخر',
      titleEn: 'Luxury Turkish Carpets',
      descAr: 'نعومة فائقة وألوان عصرية بتصاميم تناسب الصالونات وغرف المعيشة.',
      descEn: 'Ultra-soft pile and contemporary motifs crafted for living rooms.',
      image: CARPET_ASSETS.turkish,
      tagAr: 'الأكثر طلباً',
      tagEn: 'Bestseller',
    },
    {
      id: 'oriental',
      titleAr: 'سجاد شرقي وأصيل',
      titleEn: 'Oriental & Classic Rugs',
      descAr: 'نقوش كلاسيكية وزخارف تراثية غنية بالفخامة والأناقة الخالدة.',
      descEn: 'Timeless oriental patterns with rich heritage and enduring craftsmanship.',
      image: CARPET_ASSETS.oriental,
      tagAr: 'أصالة وفخامة',
      tagEn: 'Classic Heritage',
    },
    {
      id: 'arawal',
      titleAr: 'رولات أروال ومشايات',
      titleEn: 'Runner Rolls by Length',
      descAr: 'تشكيلة راقية من رولات الأروال والمشايات بمختلف العروض تباع بالطول المطلوب.',
      descEn: 'Hallway runners and custom cut rolls sold by meter length.',
      image: CARPET_ASSETS.arawal,
      tagAr: 'تباع بالطول',
      tagEn: 'Sold by Length',
    },
    {
      id: 'alternatives',
      titleAr: 'بدائل السجاد العصرية',
      titleEn: 'Modern Carpet Alternatives',
      descAr: 'خفيفة الوزن، سهلة التنظيف، ومقاومة للانزلاق بأسعار اقتصادية وعملية.',
      descEn: 'Lightweight, washable, non-slip alternatives for daily comfort.',
      image: CARPET_ASSETS.alternatives,
      tagAr: 'عملي ومقاوم',
      tagEn: 'Easy Care',
    },
  ];

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="categories-showcase-section" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
            {t('المجموعات والتشكيلات', 'Curated Collections')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('اختر ما يناسب مساحة منزلك', 'Explore Collections for Every Room')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
            {t(
              'كل تشكيلة صُممت بعناية لتجمع بين المتانة العالية والراحة والملمس الذي يزين أرضياتك.',
              'Each collection balances durability, tactile comfort, and visual warmth for your spaces.'
            )}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop')}
              className="group relative rounded-2xl overflow-hidden bg-[#FBF9F5] border border-[#EAE3D8] hover:border-[#D5C6B5] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Image Container with Consistent Aspect Ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE9DF]">
                <Image
                  src={cat.image}
                  alt={cat.titleAr}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute top-3 start-3 bg-[#1F150F]/85 backdrop-blur-xs text-[#EED8BE] text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {t(cat.tagAr, cat.tagEn)}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#241710] group-hover:text-[#A27B5C] transition-colors">
                    {t(cat.titleAr, cat.titleEn)}
                  </h3>
                  <p className="text-xs text-[#7A6A5E] leading-relaxed line-clamp-2">
                    {t(cat.descAr, cat.descEn)}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EFE7DC] flex items-center justify-between text-xs font-bold text-[#A27B5C]">
                  <span>{t('تصفح التشكيلة', 'Explore Pieces')}</span>
                  <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 3. BRAND STORY & SHOWROOM HIGHLIGHT
 */
export function StoryTeaserSection() {
  const { navigateTo } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="story-teaser-section" className="py-16 sm:py-24 bg-white border-b border-[#EAE3D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 items-center">
          {/* Quote & Brand Vision (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-full bg-[#FAF5EB] border border-[#EAE3D8] flex items-center justify-center">
              <AlamelsgadMark size={40} />
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
                {t('معرضنا وقصة علامتنا', 'Our Heritage & Showroom')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#241710] leading-tight">
                {t(
                  '«السجاد ليس مجرد غطاء للأرضيات، بل هو روح البيت ولمسته التي تجمع بين الأصالة والراحة.»',
                  '«A carpet is not merely a floor covering, but the soul of a home connecting warmth with quiet luxury.»'
                )}
              </h2>
              <p className="text-sm sm:text-base text-[#5C4A3E] font-light leading-relaxed">
                {t(
                  'في عالم السجاد، نسعى جاهدين لاختيار أجود الخامات التركية والشرقية وبدائل السجاد التي تلائم أجواء البيوت العصرية. نؤمن بأن كل غرفة تستحق سجادة تمنحها هوية دافئة وتصميماً مريحاً يرحب بكل ضيف.',
                  'At Alamelsgad, we curate only high-pile, tightly woven Turkish and Oriental rugs and modern alternatives that endure beautifully and bring authentic warmth.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 border-t border-[#EAE3D8]">
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">100%</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('جودة وخيوط معتمدة', 'Certified Weaves')}
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">27+</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('محافظة في مصر', 'Egyptian Governorates')}
                </span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-bold text-[#241710]">10–11</span>
                <span className="text-[11px] text-[#7A6A5E] block font-medium">
                  {t('يومياً في معرضنا', 'Daily Showroom Hours')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigateTo('our-story')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#241710] hover:text-[#A27B5C] transition-colors"
              >
                <span>{t('تعرف على قصة عالم السجاد', 'Discover Our Story')}</span>
                <ArrowIcon className="w-4 h-4 text-[#A27B5C]" />
              </button>

              <span className="text-[#C49F74]">·</span>

              <a
                href={BRAND_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A27B5C] hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('موقع المعرض على خرائط جوجل', 'View Mansoura Showroom')}</span>
              </a>
            </div>
          </div>

          {/* Showroom Visual (6 cols) */}
          <div className="lg:col-span-6 relative h-72 sm:h-[460px] rounded-3xl overflow-hidden shadow-xl border border-[#EAE3D8]">
            <Image
              src={CARPET_ASSETS.showroom}
              alt="معرض عالم السجاد بالمنصورة"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute bottom-5 inset-x-5 text-white flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sm block">{t('معرض عالم السجاد · المنصورة', 'Alamelsgad Showroom · Mansoura')}</span>
                <span className="text-[11px] text-white/80">{t('يومياً من 10 صباحاً حتى 11 مساءً', 'Daily from 10 AM to 11 PM')}</span>
              </div>
              <a
                href={`tel:${BRAND_CONFIG.phone}`}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#1F150F] backdrop-blur-xs font-bold transition-all flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>{t('اتصل الآن', 'Call Us')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 4. CUSTOMER TESTIMONIALS (Verified Testimonials)
 */
export function CustomersReviewsSection() {
  const { t } = useLanguage();

  const reviews = [
    {
      nameAr: 'م. أحمد خليل',
      nameEn: 'Eng. Ahmed Khalil',
      cityAr: 'القاهرة (التجمع الخامس)',
      cityEn: 'Cairo',
      stars: 5,
      reviewAr: 'السجاد التركي خامته ممتازة وألوانه مطابقة للصور تماماً. التوصيل كان سريعاً والمعاينة قبل الدفع أعطتني راحة واطمئناناً كبيراً.',
      reviewEn: 'The Turkish rug weave is exceptional and looks exactly like the images. Safe delivery and preview before payment made it worry-free.',
    },
    {
      nameAr: 'د. سارة محمود',
      nameEn: 'Dr. Sarah Mahmoud',
      cityAr: 'المنصورة',
      cityEn: 'Mansoura',
      stars: 5,
      reviewAr: 'الأروال بالمتر كانت الحل المثالي لممرات الشقة، تم قصها وتشطيبها بحرفية عالية جداً وخامتها ثقيلة وتتحمل الاستخدام اليومي.',
      reviewEn: 'The custom runner rolls fit my hallway dimensions seamlessly. High quality finishing and durable texture.',
    },
    {
      nameAr: 'أ. طارق الشربيني',
      nameEn: 'Tarek El-Sherbini',
      cityAr: 'الإسكندرية',
      cityEn: 'Alexandria',
      stars: 5,
      reviewAr: 'تعامل راقٍ جداً عبر الواتساب، طلبت بديل سجاد وسجادة صالون، والقطع وصلت بحالة ممتازة حتى باب البيت في الإسكندرية.',
      reviewEn: 'Top-tier customer support on WhatsApp. My living room carpet arrived in pristine condition right to my doorstep.',
    },
  ];

  return (
    <section id="customers-saying-section" className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#EAE3D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A27B5C]">
            {t('ثقة عملائنا', 'Verified Testimonials')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('آراء عملائنا وتجاربهم', 'Customers Are Saying')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357]">
            {t(
              'نفخر بثقة آلاف العملاء في مختلف المحافظات بخدمتنا وجودة سجادنا.',
              'Thousands of satisfied homes across all Egyptian governorates.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#C49F74]">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#4A3B30] leading-relaxed italic">
                  «{t(rev.reviewAr, rev.reviewEn)}»
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#241710]">{t(rev.nameAr, rev.nameEn)}</h4>
                  <span className="text-[10px] text-[#8A796B]">{t(rev.cityAr, rev.cityEn)}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {t('شراء مؤكد', 'Verified Buyer')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Deprecated / Removed sections: exported as null to prevent broken imports
export function ValueTrustRibbon() {
  return null;
}

export function SignaturePiecesSection() {
  return null;
}

export function NewsletterSection() {
  return null;
}

export function ProjectsAndInstagramSection() {
  return null;
}

export function BannersSection() {
  return null;
}

export function CustomDesignTeaser() {
  return null;
}

export function CollaborationsSection() {
  return null;
}
