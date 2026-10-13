'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Product } from '@/types';
import { BackendOffer } from '@/types/offer';
import { Tag, Sparkles, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import Image from '@/components/SafeImage';

export interface DiscountedProductItem {
  product: Product;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  offerName?: string;
  inStock: boolean;
}

export function SpecialOffersSection() {
  const {
    products,
    categories,
    subcategories,
    offers,
    isOffersLoading,
    offersError,
    reloadOffers,
    isCatalogLoading,
    navigateTo,
  } = useToccoStore();
  const { t, isRtl, getName } = useLanguage();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mouse click-and-drag tracking refs (Desktop)
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStartLeft = useRef(0);
  const dragDistance = useRef(0);

  // Filter active valid offers within valid time range
  const activeOffers = useMemo(() => {
    const now = new Date();
    return (offers || []).filter((o) => {
      if (!o.is_active) return false;
      if (o.starts_at && new Date(o.starts_at) > now) return false;
      if (o.ends_at && new Date(o.ends_at) < now) return false;
      return true;
    });
  }, [offers]);

  // Compute products that have verified real discounts
  const discountedProducts = useMemo<DiscountedProductItem[]>(() => {
    const activeProducts = (products || []).filter(
      (p) => p.isPublished !== false && !(p as any).deleted_at
    );

    const items: DiscountedProductItem[] = [];

    activeProducts.forEach((product) => {
      let bestDiscountPct = 0;
      let calculatedOriginalPrice = 0;
      let calculatedDiscountedPrice = 0;
      let matchedOfferName: string | undefined = undefined;

      // 1. Check matching active backend PERCENTAGE offer
      const matchingOffer = activeOffers.find((o) => {
        if (o.offer_type !== 'PERCENTAGE' && (o as any).type !== 'PERCENTAGE') return false;
        const inProducts = (o.products || []).some(
          (p) => String(p.product_id) === String(product.id) || String(p.id) === String(product.id)
        );
        const inOfferProducts = (o.offer_products || []).some(
          (p) => String(p.product_id) === String(product.id)
        );
        return inProducts || inOfferProducts;
      });

      if (matchingOffer && matchingOffer.percentage) {
        const pct = Math.round(Number(matchingOffer.percentage));
        if (pct > 0 && pct < 100 && product.price > 0) {
          bestDiscountPct = pct;
          calculatedOriginalPrice = product.price;
          calculatedDiscountedPrice = Math.round(product.price * (1 - pct / 100));
          matchedOfferName = matchingOffer.name_ar || matchingOffer.name || undefined;
        }
      }

      // 2. Check direct discount data on product if exists and verify validity
      if (
        product.originalPrice &&
        product.price &&
        product.originalPrice > product.price
      ) {
        const directPct = product.discountPercentage && product.discountPercentage > 0
          ? Math.round(product.discountPercentage)
          : Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

        if (directPct > bestDiscountPct) {
          bestDiscountPct = directPct;
          calculatedOriginalPrice = product.originalPrice;
          calculatedDiscountedPrice = product.price;
        }
      }

      // Strictly include ONLY products with genuine discounts
      if (
        bestDiscountPct > 0 &&
        calculatedOriginalPrice > calculatedDiscountedPrice &&
        calculatedDiscountedPrice > 0
      ) {
        const savings = calculatedOriginalPrice - calculatedDiscountedPrice;
        items.push({
          product,
          originalPrice: calculatedOriginalPrice,
          discountedPrice: calculatedDiscountedPrice,
          discountPercentage: bestDiscountPct,
          savingsAmount: savings,
          offerName: matchedOfferName,
          inStock: product.inStock !== false,
        });
      }
    });

    // Sort by highest discount percentage first
    return items.sort((a, b) => b.discountPercentage - a.discountPercentage);
  }, [products, activeOffers]);

  // Resolve category / subcategory label
  const getCategoryLabel = useCallback(
    (product: Product): string => {
      if (product.subcategoryIds && product.subcategoryIds.length > 0) {
        const subId = product.subcategoryIds[0];
        const foundSub = subcategories.find((s) => String(s.id) === String(subId));
        if (foundSub) return getName(foundSub).toUpperCase();
      }
      if (product.categoryId) {
        const foundCat = categories.find((c) => String(c.id) === String(product.categoryId));
        if (foundCat) return getName(foundCat).toUpperCase();
      }
      return t('سجاد فاخر', 'FINE CARPET');
    },
    [categories, subcategories, getName, t]
  );

  // Mouse Drag Interactions for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isMouseDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollStartLeft.current = scrollContainerRef.current.scrollLeft;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = x - startX.current;
    dragDistance.current = Math.abs(walk);

    if (dragDistance.current > 6) {
      isDragging.current = true;
      scrollContainerRef.current.scrollLeft = scrollStartLeft.current - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    isMouseDown.current = false;
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleCardClick = (productId: string) => {
    if (isDragging.current) return;
    navigateTo('product', { productId });
  };

  // Desktop Arrow Navigation
  const scrollTrack = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    const factor = isRtl ? (direction === 'left' ? 1 : -1) : direction === 'left' ? -1 : 1;
    container.scrollBy({ left: factor * scrollAmount, behavior: 'smooth' });
  };

  // Format Egyptian currency
  const formatEgpPrice = (amount: number) => {
    const formatted = amount.toLocaleString('en-US');
    return isRtl ? `${formatted} ج.م` : `LE ${formatted} EGP`;
  };

  // Loading state
  const isLoading = isCatalogLoading || isOffersLoading;

  // If loading is complete and there are no real discounted products, hide section smoothly
  if (!isLoading && discountedProducts.length === 0 && !offersError) {
    return null;
  }

  return (
    <section
      id="special-offers-section"
      aria-label="عروض وتخفيضات عالم السجاد"
      className="py-10 sm:py-14 bg-[#FAF7F2] border-b border-[#EAE3D8] overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Title, Subtitle, Badges and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#94622D]/10 text-[#94622D] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#94622D]" />
              <span>{t('تخفيضات حصرية لفترة محدودة', 'Limited Time Exclusive Discounts')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1C1A19] tracking-tight">
              {t('عروض مميزة', 'Special Offers')}
            </h2>
            <p className="text-xs sm:text-sm text-[#8A796B] mt-1.5 max-w-xl">
              {t(
                'وفّر أكثر مع عروضنا الحالية وتخفيضات حقيقية على أرقى أنواع السجاد التركي والشرقي',
                'Save more with our active discounts and verified offers on fine Turkish & Oriental carpets'
              )}
            </p>
          </div>

          {/* Desktop Arrow Controls and View All */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollTrack('right')}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-[#D5C7B6] bg-white text-[#21160F] hover:bg-[#F3ECE0] hover:border-[#94622D] flex items-center justify-center transition-colors shadow-2xs cursor-pointer touch-manipulation"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack('left')}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-[#D5C7B6] bg-white text-[#21160F] hover:bg-[#F3ECE0] hover:border-[#94622D] flex items-center justify-center transition-colors shadow-2xs cursor-pointer touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error State Banner with Arabic Retry Button */}
        {offersError && !isLoading && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF6F6] border border-[#F5C2C2] text-right mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[#B91C1C]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {t('تعذر تحميل أحدث العروض من الخادم', 'Unable to load active offers from server')}
                </p>
                <p className="text-xs text-[#7F1D1D] mt-0.5">{offersError}</p>
              </div>
            </div>
            {reloadOffers && (
              <button
                type="button"
                onClick={() => reloadOffers()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#94622D] text-white text-xs font-semibold hover:bg-[#7D5225] transition-colors touch-manipulation cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('إعادة المحاولة', 'Retry')}</span>
              </button>
            )}
          </div>
        )}

        {/* Carousel / Slider Track — Dual-Axis Native Touch Gesture pan-x pan-y */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex gap-3.5 sm:gap-6 overflow-x-auto scrollbar-none pb-4 select-none lg:cursor-grab lg:active:cursor-grabbing snap-x snap-proximity scroll-smooth"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            overscrollBehaviorX: 'contain',
          }}
        >
          {isLoading && discountedProducts.length === 0
            ? // Skeleton loading cards
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`offer-skeleton-${idx}`}
                  className="w-[185px] sm:w-[245px] md:w-[265px] lg:w-[280px] shrink-0 animate-pulse flex flex-col snap-start"
                >
                  <div className="aspect-[4/5] bg-[#EFE9DF] rounded-xl" />
                  <div className="pt-3 space-y-2">
                    <div className="h-4 bg-[#EAE3D8] rounded w-3/4" />
                    <div className="h-3 bg-[#EAE3D8] rounded w-1/3" />
                    <div className="h-4 bg-[#EAE3D8] rounded w-1/2" />
                    <div className="h-10 bg-[#EAE3D8] rounded-lg mt-3" />
                  </div>
                </div>
              ))
            : discountedProducts.map((item) => {
                const { product, originalPrice, discountedPrice, discountPercentage, savingsAmount, offerName, inStock } = item;
                const categoryLabel = getCategoryLabel(product);
                const primaryImage = product.images?.[0];

                return (
                  <article
                    key={`offer-card-${product.id}`}
                    onClick={() => handleCardClick(product.id)}
                    className="w-[185px] sm:w-[245px] md:w-[265px] lg:w-[280px] shrink-0 flex flex-col group cursor-pointer snap-start bg-white rounded-2xl p-3 sm:p-4 border border-[#EAE3D8] hover:border-[#94622D] hover:shadow-md transition-all duration-300"
                  >
                    {/* Product Image Box */}
                    <div className="relative aspect-[4/5] bg-[#F7F5F0] overflow-hidden rounded-xl p-2 flex items-center justify-center border border-[#EFE9DF]">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={getName(product)}
                          fill
                          draggable={false}
                          className="object-contain object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none p-1"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#B5A595] p-4 text-center">
                          <ShoppingBag className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-[10px]">{getName(product)}</span>
                        </div>
                      )}

                      {/* Floating Discount Badge */}
                      <div className="absolute top-2.5 start-2.5 bg-[#94622D] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs flex items-center gap-1 select-none">
                        <span>-{discountPercentage}%</span>
                        <span className="text-[9px] font-normal">{t('خصم', 'OFF')}</span>
                      </div>

                      {/* Floating Offer Title Pill if specific named offer */}
                      {offerName && (
                        <div className="absolute bottom-2.5 end-2.5 max-w-[85%] truncate bg-[#21160F]/85 text-[#FAF7F2] text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs select-none">
                          {offerName}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="pt-3 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Subcategory / Collection Tag */}
                        <span className="text-[10px] sm:text-[11px] text-[#8A796B] uppercase tracking-wider block font-medium">
                          {categoryLabel}
                        </span>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm md:text-base font-normal text-[#1C1A19] group-hover:text-[#94622D] transition-colors line-clamp-1 leading-snug mt-0.5">
                          {getName(product)}
                        </h3>

                        {/* Inventory & Stock Badge */}
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                          {inStock ? (
                            <span className="text-[#3A704D] flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3A704D] inline-block animate-pulse" />
                              {t('متوفر في المعرض والمخزن', 'In Stock')}
                            </span>
                          ) : (
                            <span className="text-[#8A796B] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8A796B] inline-block" />
                              {t('نفد المخزون', 'Out of stock')}
                            </span>
                          )}
                        </div>

                        {/* Pricing Details */}
                        <div className="mt-2.5 pt-2 border-t border-[#F2ECE1]">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm sm:text-base md:text-lg font-bold text-[#94622D] leading-tight">
                              {formatEgpPrice(discountedPrice)}
                            </span>
                            <span className="text-xs text-[#8A796B] line-through leading-tight">
                              {formatEgpPrice(originalPrice)}
                            </span>
                          </div>

                          {/* Savings Pill */}
                          {savingsAmount > 0 && (
                            <div className="mt-1">
                              <span className="inline-block bg-[#94622D]/10 text-[#94622D] text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded">
                                {t(`وفّر ${savingsAmount.toLocaleString('en-US')} ج.م`, `Save LE ${savingsAmount.toLocaleString('en-US')}`)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Primary CTA Button: «تسوق العرض» */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(product.id);
                        }}
                        className="w-full mt-3.5 py-2 px-3 sm:py-2.5 sm:px-4 bg-[#94622D] hover:bg-[#7D5225] text-white active:scale-[0.98] text-xs sm:text-sm font-semibold transition-all duration-200 text-center rounded-xl touch-manipulation min-h-[40px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{t('تسوق العرض', 'Shop Offer')}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
        </div>
      </div>
    </section>
  );
}

export default SpecialOffersSection;
