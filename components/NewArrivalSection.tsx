'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Product } from '@/types';
import { BackendOffer } from '@/types/offer';
import { offerService } from '@/lib/api/services/offerService';
import Image from '@/components/SafeImage';

export default function NewArrivalSection() {
  const { products, categories, subcategories, navigateTo, addToCart, isCatalogLoading } = useToccoStore();
  const { t, isRtl } = useLanguage();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [offers, setOffers] = useState<BackendOffer[]>([]);

  // Mouse click-and-drag tracking refs (Desktop)
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStartLeft = useRef(0);
  const dragDistance = useRef(0);

  // Fetch active offers to dynamically assign discounts to products if available
  useEffect(() => {
    let active = true;
    offerService
      .getOffers()
      .then((data) => {
        if (!active) return;
        setOffers(Array.isArray(data) ? data.filter((o) => o.is_active) : []);
      })
      .catch(() => {
        if (active) setOffers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter and sort products:
  // 1. Only active products (isPublished !== false, deleted_at == null)
  // 2. Sorted newest first based on createdAt (newest arrival)
  const newArrivals = useMemo(() => {
    const active = products.filter((p) => p.isPublished !== false && !(p as any).deleted_at);
    return [...active].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [products]);

  // Helper to resolve category or subcategory name for card header (e.g. HARIR)
  const getCategoryLabel = useCallback(
    (product: Product): string => {
      if (product.subcategoryIds && product.subcategoryIds.length > 0) {
        const subId = product.subcategoryIds[0];
        const foundSub = subcategories.find((s) => String(s.id) === String(subId));
        if (foundSub?.name) return foundSub.name.toUpperCase();
      }
      if (product.categoryId) {
        const foundCat = categories.find((c) => String(c.id) === String(product.categoryId));
        if (foundCat?.name) return foundCat.name.toUpperCase();
      }
      return 'HARIR';
    },
    [categories, subcategories]
  );

  // Helper to determine discount details for a product
  const getProductDiscount = useCallback(
    (product: Product) => {
      // 1. Direct product discount if attached
      if (product.discountPercentage && product.discountPercentage > 0) {
        return {
          hasDiscount: true,
          percentage: product.discountPercentage,
          originalPrice: product.originalPrice || Math.round(product.price / (1 - product.discountPercentage / 100)),
          currentPrice: product.price,
        };
      }
      if (product.originalPrice && product.originalPrice > product.price) {
        const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        return {
          hasDiscount: true,
          percentage: pct,
          originalPrice: product.originalPrice,
          currentPrice: product.price,
        };
      }

      // 2. Check active backend offers
      const matchingOffer = offers.find(
        (o) => o.is_active && o.products?.some((op) => String(op.product_id) === String(product.id))
      );
      if (matchingOffer) {
        const pct = matchingOffer.percentage
          ? Number(matchingOffer.percentage)
          : matchingOffer.original_price && matchingOffer.offer_price
          ? Math.round(
              ((Number(matchingOffer.original_price) - Number(matchingOffer.offer_price)) /
                Number(matchingOffer.original_price)) *
                100
            )
          : 15;
        const origPrice = matchingOffer.original_price
          ? Number(matchingOffer.original_price)
          : Math.round(product.price * 1.18);
        const currPrice = matchingOffer.offer_price ? Number(matchingOffer.offer_price) : product.price;
        return {
          hasDiscount: true,
          percentage: pct,
          originalPrice: origPrice,
          currentPrice: currPrice,
        };
      }

      return {
        hasDiscount: false,
        percentage: 0,
        originalPrice: product.price,
        currentPrice: product.price,
      };
    },
    [offers]
  );

  // Smooth mouse drag interactions on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Main button only
    const container = scrollContainerRef.current;
    if (!container) return;

    isMouseDown.current = true;
    isDragging.current = false;
    dragDistance.current = 0;
    startX.current = e.pageX;
    scrollStartLeft.current = container.scrollLeft;

    // Temporarily disable smooth scroll so dragging responds instantly to mouse
    container.style.scrollBehavior = 'auto';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const deltaX = e.pageX - startX.current;
    dragDistance.current += Math.abs(deltaX);

    if (Math.abs(deltaX) > 4) {
      isDragging.current = true;
    }

    // Modern browsers handle scrollLeft in RTL with either negative or inverted offsets
    const isDocRtl = document.documentElement.dir === 'rtl' || isRtl;
    const directionMultiplier = isDocRtl ? -1 : 1;
    container.scrollLeft = scrollStartLeft.current - deltaX * directionMultiplier;
  };

  const handleMouseUpOrLeave = () => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const container = scrollContainerRef.current;
    if (container) {
      container.style.scrollBehavior = 'smooth';
    }
    // Release drag lock slightly delayed so that clicking doesn't fire after drag
    setTimeout(() => {
      isDragging.current = false;
    }, 60);
  };

  // Card click handler (prevent navigation when user was dragging)
  const handleCardClick = (productId: string) => {
    if (isDragging.current) return;
    navigateTo('product', { productId });
  };

  // Buy Now click handler
  const handleBuyNow = (e: React.MouseEvent, product: Product, finalPrice: number) => {
    e.stopPropagation();
    if (isDragging.current) return;

    if (product.isArawal) {
      // Custom dimension products need meter length selection
      navigateTo('product', { productId: product.id });
      return;
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
      unitPrice: finalPrice,
      selectedFinish: product.finishes?.[0] || 'MATTE',
      selectedColor: product.colors?.[0] || { id: 'c-default', name: 'البيج الطبيعي', hex: '#D2C1AF' },
      quantity: 1,
    });
  };

  // Format currency matching the reference screenshot:
  // "LE 23,161.00 EGP" / "From LE 19,465.00 EGP"
  const formatEgpPrice = (amount: number, prefixFrom = false) => {
    const formattedNum = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (isRtl) {
      return prefixFrom
        ? `من ${amount.toLocaleString('ar-EG')} ج.م`
        : `${amount.toLocaleString('ar-EG')} ج.م`;
    }
    return prefixFrom ? `From LE ${formattedNum} EGP` : `LE ${formattedNum} EGP`;
  };

  if (newArrivals.length === 0 && !isCatalogLoading) {
    return null;
  }

  return (
    <section
      id="new-arrival-section"
      className="py-10 sm:py-14 bg-white border-b border-[#EAE3D8] overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title — Clean, minimal, left/start aligned */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1C1A19] tracking-tight">
            {t('وصل حديثاً', 'New arrival')}
          </h2>
        </div>

        {/* Carousel / Slider Track — No Arrow Buttons, Smooth Mouse Drag & Touch Swipe */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 select-none cursor-grab active:cursor-grabbing scroll-smooth"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
        >
          {isCatalogLoading && newArrivals.length === 0
            ? // Loading skeleton cards
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="w-[195px] sm:w-[250px] md:w-[270px] lg:w-[280px] shrink-0 animate-pulse flex flex-col"
                >
                  <div className="aspect-[4/5] bg-[#EFE9DF] rounded-none sm:rounded-xs" />
                  <div className="pt-3 space-y-2">
                    <div className="h-4 bg-[#EAE3D8] rounded w-3/4" />
                    <div className="h-3 bg-[#EAE3D8] rounded w-1/3" />
                    <div className="h-4 bg-[#EAE3D8] rounded w-1/2" />
                    <div className="h-10 bg-[#EAE3D8] rounded mt-3" />
                  </div>
                </div>
              ))
            : newArrivals.map((product) => {
                const discount = getProductDiscount(product);
                const categoryLabel = getCategoryLabel(product);

                return (
                  <article
                    key={product.id}
                    onClick={() => handleCardClick(product.id)}
                    className="w-[195px] sm:w-[250px] md:w-[270px] lg:w-[280px] shrink-0 flex flex-col group cursor-pointer"
                  >
                    {/* Product Image Container (object-contain preserving carpet edges) */}
                    <div className="relative aspect-[4/5] bg-[#F7F5F0] overflow-hidden rounded-xl p-2.5 flex items-center justify-center">
                      <Image
                        src={
                          product.images[0] ||
                          'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'
                        }
                        alt={product.name}
                        fill
                        draggable={false}
                        className="object-contain object-center transition-transform duration-500 group-hover:scale-105 pointer-events-none p-1"
                        referrerPolicy="no-referrer"
                      />

                      {/* Discount Badge (e.g. -15% OFF) in bottom-left */}
                      {discount.hasDiscount && (
                        <div className="absolute bottom-3 start-3 bg-[#94622D] text-white text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full shadow-sm select-none">
                          -{discount.percentage}% {t('خصم', 'OFF')}
                        </div>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="pt-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Product Name */}
                        <h3 className="text-sm sm:text-base font-normal text-[#1C1A19] group-hover:text-[#9E734F] transition-colors line-clamp-1 leading-snug">
                          {product.name}
                        </h3>

                        {/* Category / Subcategory Label */}
                        <span className="text-[11px] sm:text-xs text-[#8A796B] uppercase tracking-wider block mt-1">
                          {categoryLabel}
                        </span>

                        {/* Pricing */}
                        <div className="mt-2 min-h-[42px] flex flex-col justify-end">
                          {discount.hasDiscount ? (
                            <>
                              <span className="text-xs text-[#8A796B] line-through block leading-tight">
                                {formatEgpPrice(discount.originalPrice)}
                              </span>
                              <span className="text-sm sm:text-base font-medium text-[#1C1A19] block leading-snug">
                                {formatEgpPrice(discount.currentPrice, true)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm sm:text-base font-medium text-[#1C1A19] block leading-snug">
                              {formatEgpPrice(discount.currentPrice, Boolean(product.isArawal))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Buy Now Button — Outlined style from reference */}
                      <button
                        type="button"
                        onClick={(e) => handleBuyNow(e, product, discount.currentPrice)}
                        className="w-full mt-3.5 py-2.5 px-4 border border-[#9E734F] text-[#9E734F] hover:bg-[#9E734F] hover:text-white active:scale-[0.99] text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 text-center rounded-none sm:rounded-xs"
                      >
                        {t('شراء الآن', 'Buy Now')}
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
