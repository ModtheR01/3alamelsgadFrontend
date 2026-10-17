'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToccoStore, mapBackendProduct } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { productService } from '@/lib/api/services/productService';
import { offerService } from '@/lib/api/services/offerService';
import { Product } from '@/types';
import { BackendOffer } from '@/types/offer';
import SafeImage from '@/components/SafeImage';
import { ProductCardImage } from '@/components/ProductCardImage';
import {
  Search,
  Ruler,
  Sparkles,
  X,
  Tag,
  ArrowRight,
  ArrowLeft,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export default function ShopCatalog() {
  const {
    products,
    categories,
    subcategories,
    selectedCategoryId,
    selectedSubcategoryId,
    setSelectedCategoryId,
    setSelectedSubcategoryId,
    navigateTo,
    searchQuery,
    setSearchQuery,
    isCatalogLoading,
    catalogError,
    reloadCatalog,
  } = useToccoStore();

  const { t, isRtl, getName, getDescription } = useLanguage();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(
    selectedCategoryId || 'all'
  );
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string>(
    selectedSubcategoryId || 'all'
  );
  const [showAllCategoryProducts, setShowAllCategoryProducts] = useState<boolean>(false);
  const [arawalOnlyFilter, setArawalOnlyFilter] = useState<boolean>(false);
  const [offersOnlyFilter, setOffersOnlyFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');

  // Backend Offers state for catalog
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);

  // Server-side search results (debounced)
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Sync with store when store navigation values change
  useEffect(() => {
    if (selectedCategoryId) {
      setActiveCategoryFilter(selectedCategoryId);
      setShowAllCategoryProducts(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    if (selectedSubcategoryId) {
      setActiveSubcategoryFilter(selectedSubcategoryId);
    }
  }, [selectedSubcategoryId]);

  // Read URL query parameters on mount & on browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFiltersFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      const subcat = params.get('subcategory');
      const isOffers = params.get('offers');
      const isArawal = params.get('arawal');

      if (cat) {
        setActiveCategoryFilter(cat);
        setSelectedCategoryId(cat);
      } else {
        setActiveCategoryFilter('all');
        setSelectedCategoryId(null);
      }

      if (subcat) {
        setActiveSubcategoryFilter(subcat);
        setSelectedSubcategoryId(subcat);
      } else {
        setActiveSubcategoryFilter('all');
        setSelectedSubcategoryId(null);
        setShowAllCategoryProducts(false);
      }

      setOffersOnlyFilter(isOffers === 'true');
      setArawalOnlyFilter(isArawal === 'true');
    };

    syncFiltersFromUrl();
    window.addEventListener('popstate', syncFiltersFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFiltersFromUrl);
    };
  }, [setSelectedCategoryId, setSelectedSubcategoryId]);

  // Keep URL search parameters updated without page reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);

    if (activeCategoryFilter && activeCategoryFilter !== 'all') {
      url.searchParams.set('category', activeCategoryFilter);
    } else {
      url.searchParams.delete('category');
    }

    if (activeSubcategoryFilter && activeSubcategoryFilter !== 'all') {
      url.searchParams.set('subcategory', activeSubcategoryFilter);
    } else {
      url.searchParams.delete('subcategory');
    }

    if (offersOnlyFilter) {
      url.searchParams.set('offers', 'true');
    } else {
      url.searchParams.delete('offers');
    }

    if (arawalOnlyFilter) {
      url.searchParams.set('arawal', 'true');
    } else {
      url.searchParams.delete('arawal');
    }

    window.history.replaceState({}, '', url.toString());
  }, [activeCategoryFilter, activeSubcategoryFilter, offersOnlyFilter, arawalOnlyFilter]);

  // Fetch real offers for catalog
  useEffect(() => {
    let active = true;
    setIsOffersLoading(true);
    offerService
      .getOffers()
      .then((data) => {
        if (active && data) setOffers(data);
      })
      .catch(() => {
        if (active) setOffers([]);
      })
      .finally(() => {
        if (active) setIsOffersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter valid active offers
  const activeOffers = useMemo(() => {
    const now = new Date();
    return offers.filter((o) => {
      if (!o.is_active) return false;
      if (o.starts_at && new Date(o.starts_at) > now) return false;
      if (o.ends_at && new Date(o.ends_at) < now) return false;
      return true;
    });
  }, [offers]);

  // Set of product IDs currently enrolled in active offers
  const offerProductIds = useMemo(() => {
    const ids = new Set<number>();
    activeOffers.forEach((o) => {
      (o.products || []).forEach((p) => ids.add(p.product_id));
    });
    return ids;
  }, [activeOffers]);

  // Helper to determine discount and final price for a product
  const getProductPricing = useCallback(
    (product: Product) => {
      // 1. Direct discount data on product itself (price is final discounted price, originalPrice is base price)
      if (product.originalPrice && product.originalPrice > product.price) {
        const pct = product.discountPercentage && product.discountPercentage > 0
          ? Math.round(product.discountPercentage)
          : Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        return {
          hasDiscount: true,
          finalPrice: product.price,
          originalPrice: product.originalPrice,
          discountPercentage: pct,
        };
      }

      // If product has discountPercentage and price > 0, but originalPrice is missing
      if (product.discountPercentage && product.discountPercentage > 0 && product.price > 0) {
        const origPrice = Math.round(product.price / (1 - product.discountPercentage / 100));
        return {
          hasDiscount: true,
          finalPrice: product.price,
          originalPrice: origPrice,
          discountPercentage: Math.round(product.discountPercentage),
        };
      }

      // 2. Active backend percentage offers
      const matchingOffer = activeOffers.find(
        (o) =>
          (o.offer_type === 'PERCENTAGE' || (o as any).type === 'PERCENTAGE') &&
          ((o.products || []).some((p) => String(p.product_id) === String(product.id) || String(p.id) === String(product.id)) ||
            ((o as any).offer_products || []).some((p: any) => String(p.product_id) === String(product.id)))
      );
      if (matchingOffer && matchingOffer.percentage) {
        const pct = Math.round(Number(matchingOffer.percentage));
        if (pct > 0 && pct < 100 && product.price > 0) {
          return {
            hasDiscount: true,
            finalPrice: Math.round(product.price * (1 - pct / 100)),
            originalPrice: product.price,
            discountPercentage: pct,
          };
        }
      }

      return {
        hasDiscount: false,
        finalPrice: product.price,
        originalPrice: undefined,
        discountPercentage: 0,
      };
    },
    [activeOffers]
  );

  // Debounced server search
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      return;
    }

    let active = true;
    const handle = setTimeout(() => {
      setIsSearching(true);
      productService
        .getProducts({ search: query })
        .then((backendProducts) => {
          if (!active) return;
          setSearchResults(backendProducts.map((p) => mapBackendProduct(p, subcategories)));
        })
        .catch(() => {
          if (active) setSearchResults([]);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [searchQuery, subcategories]);

  // Available subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (activeCategoryFilter === 'all') return [];
    return (subcategories || []).filter(
      (sub) => String(sub.category_id) === String(activeCategoryFilter) && !sub.deleted_at
    );
  }, [activeCategoryFilter, subcategories]);

  const visibleCategories = categories.filter((c) => c.isVisible);
  const selectedCategoryObj = visibleCategories.find((c) => String(c.id) === String(activeCategoryFilter));
  const selectedSubcategoryObj = availableSubcategories.find((s) => String(s.id) === String(activeSubcategoryFilter));

  // Determine which browsing view stage to render:
  // Stage 1: Category chosen, no subcategory selected, not forcing all products, and category has subcategories -> Subcategories Grid
  // Stage 2: Subcategory chosen -> Subcategory Products Grid
  // Stage 0: All categories or Category showing all products directly -> Standard Products Grid
  const isShowingSubcategoriesHub =
    activeCategoryFilter !== 'all' &&
    activeSubcategoryFilter === 'all' &&
    !showAllCategoryProducts &&
    availableSubcategories.length > 0 &&
    !arawalOnlyFilter &&
    !offersOnlyFilter &&
    !searchQuery.trim();

  // Products belonging to the selected category
  const categoryProductsCount = useMemo(() => {
    if (activeCategoryFilter === 'all') return products.length;
    return products.filter((p) => String(p.categoryId) === String(activeCategoryFilter) && p.isPublished).length;
  }, [products, activeCategoryFilter]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const baseList = searchQuery.trim() ? searchResults || [] : products;
    return baseList
      .filter((product) => {
        if (!product.isPublished) return false;

        // Category filter
        if (activeCategoryFilter !== 'all' && String(product.categoryId) !== String(activeCategoryFilter)) {
          return false;
        }

        // Subcategory filter
        if (activeSubcategoryFilter !== 'all') {
          const hasSubcat = (product.subcategoryIds || []).some(
            (id) => String(id) === String(activeSubcategoryFilter)
          );
          if (!hasSubcat) return false;
        }

        // Arawal specific filter
        if (arawalOnlyFilter && !product.isArawal && !/أروال|arawal|رول/i.test(`${product.name_ar || ''} ${product.name_en || ''} ${product.name || ''}`)) {
          return false;
        }

        // Offers filter
        if (offersOnlyFilter) {
          const pricing = getProductPricing(product);
          if (!pricing.hasDiscount) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price-asc') {
          const priceA = getProductPricing(a).finalPrice ?? 999999;
          const priceB = getProductPricing(b).finalPrice ?? 999999;
          return priceA - priceB;
        }
        if (sortBy === 'price-desc') {
          const priceA = getProductPricing(a).finalPrice ?? 0;
          const priceB = getProductPricing(b).finalPrice ?? 0;
          return priceB - priceA;
        }
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [
    products,
    searchResults,
    activeCategoryFilter,
    activeSubcategoryFilter,
    arawalOnlyFilter,
    offersOnlyFilter,
    searchQuery,
    sortBy,
    getProductPricing,
  ]);

  return (
    <div id="shop-catalog-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Dynamic Multi-Stage Breadcrumbs Bar */}
        <nav
          aria-label="Breadcrumbs"
          className="py-3 px-3.5 sm:px-4 rounded-xl bg-white border border-[#EAE3D8] text-xs text-[#8A796B] mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shadow-2xs"
        >
          <button
            onClick={() => navigateTo('home')}
            className="hover:text-[#251811] transition-colors shrink-0 font-medium cursor-pointer"
          >
            {t('الرئيسية', 'Home')}
          </button>

          <span>/</span>

          {activeCategoryFilter === 'all' && !arawalOnlyFilter && !offersOnlyFilter && (
            <span className="text-[#251811] font-bold">
              {t('جميع الأقسام والمنتجات', 'All Collections')}
            </span>
          )}

          {offersOnlyFilter && (
            <span className="text-[#94622D] font-bold flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{t('العروض والتخفيضات', 'Special Offers')}</span>
            </span>
          )}

          {arawalOnlyFilter && (
            <span className="text-[#865F3E] font-bold flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              <span>{t('مشايات وأروال بالمتر', 'Arawal Runners')}</span>
            </span>
          )}

          {selectedCategoryObj && (
            <>
              {activeSubcategoryFilter === 'all' && !showAllCategoryProducts ? (
                <span className="text-[#251811] font-bold">
                  {getName(selectedCategoryObj)}
                </span>
              ) : (
                <button
                  onClick={() => {
                    setActiveSubcategoryFilter('all');
                    setSelectedSubcategoryId('all');
                    setShowAllCategoryProducts(false);
                  }}
                  className="hover:text-[#251811] transition-colors shrink-0 font-medium cursor-pointer"
                >
                  {getName(selectedCategoryObj)}
                </button>
              )}
            </>
          )}

          {selectedSubcategoryObj && (
            <>
              <span>/</span>
              <span className="text-[#251811] font-bold">
                {getName(selectedSubcategoryObj)}
              </span>
            </>
          )}

          {showAllCategoryProducts && selectedCategoryObj && (
            <>
              <span>/</span>
              <span className="text-[#251811] font-bold">
                {t('جميع منتجات القسم', 'All Products in Category')}
              </span>
            </>
          )}
        </nav>

        {/* Global Catalog Loading Skeletons */}
        {isCatalogLoading && (
          <div className="py-12 space-y-6 animate-pulse">
            <div className="h-8 bg-[#EFE9DF] rounded-xl w-1/3" />
            <div className="h-4 bg-[#EFE9DF] rounded w-1/2" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-72 bg-white rounded-2xl border border-[#EAE3D8] p-3 space-y-3">
                  <div className="aspect-[4/3] bg-[#EFE9DF] rounded-xl" />
                  <div className="h-4 bg-[#EFE9DF] rounded w-3/4" />
                  <div className="h-3 bg-[#EFE9DF] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Error Banner */}
        {!isCatalogLoading && catalogError && products.length === 0 && (
          <div className="my-10 p-8 rounded-2xl bg-[#FFF6F3] border border-[#F6D0C5] text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FCE2DB] text-[#C04928] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#241710]">
              {t('تعذر تحميل بيانات المتجر من الخادم', 'Unable to load catalog from server')}
            </h3>
            <p className="text-xs text-[#7A6A5E]">{catalogError}</p>
            <button
              onClick={() => reloadCatalog()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#241710] hover:bg-[#3D2619] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('إعادة المحاولة', 'Try Again')}</span>
            </button>
          </div>
        )}

        {/* STAGE 1: SUBCATEGORIES HUB VIEW */}
        {!isCatalogLoading && isShowingSubcategoriesHub && selectedCategoryObj && (
          <div className="space-y-8">
            {/* Category Header */}
            <div className="pb-6 border-b border-[#EAE3D8] flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
                  {t('الأقسام الفرعية المتوفرة', 'Available Subcategories')}
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
                  {getName(selectedCategoryObj)}
                </h1>
                <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
                  {getDescription(selectedCategoryObj) ||
                    t(
                      'اختر القسم الفرعي المناسب لتصفح القطع والمقاسات المتوفرة ضمن هذا القسم.',
                      'Choose a subcategory below to explore curated carpet models and sizes.'
                    )}
                </p>
              </div>

              {/* View All Products of this Category Button */}
              <button
                onClick={() => setShowAllCategoryProducts(true)}
                className="px-5 py-2.5 rounded-full bg-[#251811] hover:bg-[#402B1F] text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{t(`عرض كل منتجات القسم (${categoryProductsCount})`, `View All (${categoryProductsCount})`)}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subcategories Grid */}
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6"
              style={{ touchAction: 'pan-x pan-y' }}
            >
              {availableSubcategories.map((subcat) => {
                const subTitle = getName(subcat) || subcat.name || subcat.name_ar || '';
                const hasImage = Boolean(subcat.image && subcat.image.trim() !== '');
                const subcatProductsCount = products.filter(
                  (p) => (p.subcategoryIds || []).includes(String(subcat.id)) && p.isPublished
                ).length;

                return (
                  <div
                    key={subcat.id}
                    onClick={() => {
                      setActiveSubcategoryFilter(String(subcat.id));
                      setSelectedSubcategoryId(String(subcat.id));
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveSubcategoryFilter(String(subcat.id));
                        setSelectedSubcategoryId(String(subcat.id));
                      }
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-[#EAE3D8] hover:border-[#A27B5C] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col focus:outline-none focus:ring-2 focus:ring-[#A27B5C]/50 active:scale-[0.99] touch-manipulation"
                  >
                    {/* Subcategory Image or Clean Brand Fallback */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#2D1E15] via-[#21160F] to-[#170E0A] flex items-center justify-center p-3">
                      {hasImage ? (
                        <>
                          <SafeImage
                            src={subcat.image!}
                            alt={subTitle}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-108"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        </>
                      ) : (
                        <div className="relative w-full h-full rounded-xl flex flex-col items-center justify-center text-center p-3 border border-[#C49F74]/25 bg-gradient-to-br from-[#332218] to-[#1E130D]">
                          <div className="w-10 h-10 rounded-full bg-[#C49F74]/15 border border-[#C49F74]/35 flex items-center justify-center mb-1.5 shadow-inner">
                            <FolderOpen className="w-5 h-5 text-[#EED8BE]" />
                          </div>
                          <span className="text-[10px] tracking-wider uppercase font-semibold text-[#C49F74]/80">
                            {t('عالم السجاد', 'Alamelsgad')}
                          </span>
                        </div>
                      )}

                      {/* Product Count Badge */}
                      <span className="absolute bottom-2.5 start-2.5 bg-[#1F150F]/85 backdrop-blur-xs text-[#EED8BE] text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                        {subcatProductsCount} {t('قطع', 'items')}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="text-xs sm:text-base font-bold text-[#251811] group-hover:text-[#A27B5C] transition-colors leading-snug line-clamp-1">
                          {subTitle}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-[#7A6A5E] mt-1 font-normal line-clamp-1">
                          {t('تصفح منتجات هذا القسم', 'View items in this section')}
                        </p>
                      </div>

                      <div className="pt-2 sm:pt-3 border-t border-[#F2EDE5] flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#A27B5C]">
                        <span>{t('عرض المنتجات', 'Explore Items')}</span>
                        <div className="w-6 h-6 rounded-full bg-[#FAF5EB] group-hover:bg-[#241710] group-hover:text-white flex items-center justify-center transition-colors">
                          <ArrowIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STAGE 2 / STAGE 0: PRODUCTS VIEW */}
        {!isCatalogLoading && !isShowingSubcategoriesHub && (
          <div>
            {/* Header / Subcategory Bar */}
            <div className="pb-6 border-b border-[#EAE3D8] space-y-3">
              {/* Back to subcategories hub button if inside a specific subcategory */}
              {selectedSubcategoryObj && selectedCategoryObj && (
                <div>
                  <button
                    onClick={() => {
                      setActiveSubcategoryFilter('all');
                      setSelectedSubcategoryId('all');
                      setShowAllCategoryProducts(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A27B5C] hover:text-[#251811] transition-colors cursor-pointer py-1"
                  >
                    <ArrowIcon className="w-3.5 h-3.5" />
                    <span>{t(`العودة إلى أقسام ${getName(selectedCategoryObj)}`, `Back to ${getName(selectedCategoryObj)} Subcategories`)}</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
                    {selectedCategoryObj ? getName(selectedCategoryObj) : t('تشكيلات عالم السجاد الحصرية', 'Alamelsgad Carpet Archive')}
                  </span>
                  <div className="flex items-center gap-2.5 mt-1">
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
                      {selectedSubcategoryObj
                        ? getName(selectedSubcategoryObj)
                        : selectedCategoryObj
                        ? showAllCategoryProducts
                          ? t(`جميع منتجات ${getName(selectedCategoryObj)}`, `All ${getName(selectedCategoryObj)} Items`)
                          : getName(selectedCategoryObj)
                        : arawalOnlyFilter
                        ? t('مشايات وأروال بالمتر', 'Arawal Runners by Meter')
                        : offersOnlyFilter
                        ? t('العروض والتخفيضات النشطة', 'Active Offers & Discounts')
                        : t('كتالوج السجاد والأروال', 'Carpet Collections & Runners')}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFE9DF] text-[#6E5D50] text-xs font-bold">
                      {filteredProducts.length} {t('قطعة', 'items')}
                    </span>
                  </div>
                </div>

                {/* Return to Subcategories Grid toggle if currently viewing all category items */}
                {showAllCategoryProducts && availableSubcategories.length > 0 && (
                  <button
                    onClick={() => setShowAllCategoryProducts(false)}
                    className="text-xs font-bold text-[#A27B5C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t('عرض كأقسام فرعية', 'Show as Subcategories')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Offers Banner */}
            {activeOffers.length > 0 && !offersOnlyFilter && (
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#2A1D15] to-[#402B1F] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-[#A27B5C]/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#A27B5C]/20 border border-[#A27B5C]/40 text-[#EED8BE]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#FAF5EB]">
                      {t(
                        `عروض حصرية نشطة (${activeOffers.length} عرض متوفر حالياً)`,
                        `Active Special Offers (${activeOffers.length} offers available)`
                      )}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#EED8BE]/80">
                      {getName(activeOffers[0])}
                      {activeOffers[0]?.percentage ? ` · ${t('خصم', 'Discount')} ${activeOffers[0].percentage}%` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOffersOnlyFilter(true);
                    setActiveCategoryFilter('all');
                    setActiveSubcategoryFilter('all');
                    setArawalOnlyFilter(false);
                  }}
                  className="px-4 py-2 rounded-full bg-[#FAF5EB] hover:bg-white text-[#251811] text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer"
                >
                  {t('تصفح العروض الآن', 'Browse Offers Now')}
                </button>
              </div>
            )}

            {/* Primary Filter & Category Bar */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category / Subcategory Navigation Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {/* If inside a category, show Sister Subcategories pills */}
                {selectedCategoryObj && availableSubcategories.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        setActiveSubcategoryFilter('all');
                        setSelectedSubcategoryId('all');
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeSubcategoryFilter === 'all'
                          ? 'bg-[#251811] text-white shadow-xs'
                          : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
                      }`}
                    >
                      {t('كل أقسام', 'All')} {getName(selectedCategoryObj)} ({categoryProductsCount})
                    </button>

                    {availableSubcategories.map((subcat) => (
                      <button
                        key={subcat.id}
                        onClick={() => {
                          setActiveSubcategoryFilter(String(subcat.id));
                          setSelectedSubcategoryId(String(subcat.id));
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          activeSubcategoryFilter === String(subcat.id)
                            ? 'bg-[#251811] text-white shadow-xs'
                            : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
                        }`}
                      >
                        {getName(subcat)}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Root Level: All Carpets Tab */}
                    <button
                      onClick={() => {
                        setActiveCategoryFilter('all');
                        setSelectedCategoryId(null);
                        setActiveSubcategoryFilter('all');
                        setSelectedSubcategoryId(null);
                        setArawalOnlyFilter(false);
                        setOffersOnlyFilter(false);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeCategoryFilter === 'all' && !arawalOnlyFilter && !offersOnlyFilter
                          ? 'bg-[#251811] text-white shadow-xs'
                          : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
                      }`}
                    >
                      {t('جميع التشكيلات', 'All Carpets')} ({products.length})
                    </button>

                    {/* Dedicated Offers Tab */}
                    {activeOffers.length > 0 && (
                      <button
                        onClick={() => {
                          setOffersOnlyFilter(!offersOnlyFilter);
                          setActiveCategoryFilter('all');
                          setSelectedCategoryId(null);
                          setActiveSubcategoryFilter('all');
                          setSelectedSubcategoryId(null);
                          setArawalOnlyFilter(false);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          offersOnlyFilter
                            ? 'bg-[#94622D] text-white shadow-xs'
                            : 'bg-[#FFF9F2] text-[#94622D] border border-[#E8DEC0] hover:bg-[#FBEEDC]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{t('العروض والتخفيضات', 'Special Offers')}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#94622D]/15 text-[10px] font-mono">
                          {activeOffers.length}
                        </span>
                      </button>
                    )}

                    {/* Dedicated ARAWAL runner tab */}
                    <button
                      onClick={() => {
                        setArawalOnlyFilter(!arawalOnlyFilter);
                        setActiveCategoryFilter('all');
                        setSelectedCategoryId(null);
                        setActiveSubcategoryFilter('all');
                        setSelectedSubcategoryId(null);
                        setOffersOnlyFilter(false);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        arawalOnlyFilter
                          ? 'bg-[#A27B5C] text-white shadow-xs'
                          : 'bg-[#FAF5EB] text-[#865F3E] border border-[#E8DEC0] hover:bg-[#F2E8D7]'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>{t('أروال بالمتر (٦٠ - ١٢٠ سم)', 'Arawal Runners')}</span>
                    </button>

                    {/* Backend Categories */}
                    {visibleCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategoryFilter(String(category.id));
                          setSelectedCategoryId(String(category.id));
                          setActiveSubcategoryFilter('all');
                          setSelectedSubcategoryId('all');
                          setShowAllCategoryProducts(false);
                          setArawalOnlyFilter(false);
                          setOffersOnlyFilter(false);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          activeCategoryFilter === String(category.id) && !arawalOnlyFilter && !offersOnlyFilter
                            ? 'bg-[#251811] text-white shadow-xs'
                            : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
                        }`}
                      >
                        {getName(category)}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <span className="text-xs text-[#8A796B] font-medium">{t('الترتيب:', 'Sort:')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2 rounded-xl border border-[#DED4C7] bg-white text-xs font-bold text-[#251811] focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                >
                  <option value="featured">{t('المميز أولاً', 'Featured First')}</option>
                  <option value="newest">{t('الأحدث إضافة', 'Newest Added')}</option>
                  <option value="price-asc">{t('السعر: من الأقل للأعلى', 'Price: Low to High')}</option>
                  <option value="price-desc">{t('السعر: من الأعلى للأقل', 'Price: High to Low')}</option>
                </select>
              </div>
            </div>

            {/* Active Search Query Notice */}
            {searchQuery.trim() && (
              <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-[#FAF5EB] border border-[#E8DEC0] text-xs text-[#5C4A3E]">
                <span>
                  {t('نتائج البحث عن:', 'Showing search results for:')} <strong>«{searchQuery}»</strong> ({filteredProducts.length})
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#A27B5C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('إلغاء البحث', 'Clear')}</span>
                </button>
              </div>
            )}

            {/* Empty Products State */}
            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-white rounded-2xl border border-[#EAE3D8] p-8 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-full bg-[#EFE9DF] text-[#8A796B] flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7 text-[#A27B5C]" />
                </div>
                <h3 className="text-base font-bold text-[#251811]">
                  {selectedSubcategoryObj
                    ? t(`لا توجد منتجات متاحة في قسم «${getName(selectedSubcategoryObj)}» حالياً`, 'No products in this subcategory')
                    : selectedCategoryObj
                    ? t(`لا توجد منتجات متاحة في قسم «${getName(selectedCategoryObj)}» حالياً`, 'No products in this category')
                    : t('لا توجد قطع مطابقة للبحث حالياً', 'No products found')}
                </h3>
                <p className="text-xs text-[#8A796B]">
                  {t('يمكنك اختيار قسم آخر أو العودة لتصفح جميع التشكيلات.', 'Try selecting another section or browsing all collections.')}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {selectedCategoryObj && (
                    <button
                      onClick={() => {
                        setActiveSubcategoryFilter('all');
                        setSelectedSubcategoryId('all');
                        setShowAllCategoryProducts(false);
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#FAF5EB] border border-[#DED4C7] text-[#251811] text-xs font-bold cursor-pointer"
                    >
                      {t(`العودة لأقسام ${getName(selectedCategoryObj)}`, `Back to ${getName(selectedCategoryObj)}`)}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveCategoryFilter('all');
                      setSelectedCategoryId(null);
                      setActiveSubcategoryFilter('all');
                      setSelectedSubcategoryId(null);
                      setShowAllCategoryProducts(false);
                      setArawalOnlyFilter(false);
                      setOffersOnlyFilter(false);
                      setSearchQuery('');
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#251811] text-white text-xs font-bold cursor-pointer"
                  >
                    {t('عرض جميع السجاد', 'View All Carpets')}
                  </button>
                </div>
              </div>
            ) : (
              /* Product Cards Grid: 2 cols mobile, 4 cols desktop with dual-axis pan touch */
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
                style={{ touchAction: 'pan-x pan-y' }}
              >
                {filteredProducts.map((product) => {
                  const isArawal =
                    product.isArawal || /أروال|arawal|رول/i.test(`${product.name_ar || ''} ${product.name_en || ''} ${product.name || ''}`);
                  const pricing = getProductPricing(product);
                  const hasDiscount = pricing.hasDiscount;
                  const hasImage = Boolean(product.images?.[0] && !product.images[0].includes('unsplash.com'));

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DEC0] hover:shadow-xl transition-all duration-300"
                    >
                      {/* Product Image / Brand Fallback (natural height, zero dead space) */}
                      <div
                        className="relative w-full overflow-hidden cursor-pointer rounded-t-2xl bg-[#F7F5F0]"
                        onClick={() => navigateTo('product', { productId: product.id })}
                      >
                        {hasImage ? (
                          <ProductCardImage
                            src={product.images[0]}
                            alt={getName(product)}
                          />
                        ) : (
                          <div className="w-full aspect-[4/3] rounded-t-2xl bg-gradient-to-br from-[#2C1C13] to-[#1C120B] text-white flex flex-col items-center justify-center p-3 text-center">
                            <div className="w-10 h-10 rounded-full bg-[#C49F74]/20 border border-[#C49F74]/40 flex items-center justify-center mb-1.5 shadow-inner">
                              <Sparkles className="w-5 h-5 text-[#EED8BE]" />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-[#C49F74] font-bold">عالم السجاد</span>
                            <span className="text-[11px] font-bold mt-0.5 line-clamp-1 text-[#FAF5EB]">{getName(product)}</span>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-2.5 end-2.5 bg-[#94622D] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            {pricing.discountPercentage > 0 ? `-${pricing.discountPercentage}%` : t('خصم خاص', 'Sale')}
                          </div>
                        )}

                        {/* ARAWAL Badge */}
                        {isArawal && (
                          <div className="absolute top-2.5 start-2.5 bg-[#251811]/90 backdrop-blur-xs text-[#EED8BE] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Ruler className="w-3 h-3 text-[#C49F74]" />
                            <span>{t('أروال بالمتر', 'Custom Roll')}</span>
                          </div>
                        )}
                      </div>

                      {/* Info Body */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                        <div>
                          {/* Category Label */}
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A796B] block mb-1">
                            {isArawal ? t('أروال وممرات', 'Runners') : t('سجاد فاخر', 'Luxury Carpet')}
                          </span>

                          <h3
                            onClick={() => navigateTo('product', { productId: product.id })}
                            className="text-xs sm:text-sm font-bold text-[#251811] group-hover:text-[#A27B5C] transition-colors cursor-pointer line-clamp-1 leading-snug"
                          >
                            {getName(product)}
                          </h3>

                          <p className="text-[11px] text-[#7A6A5E] line-clamp-1 mt-1 font-normal">
                            {getDescription(product) ||
                              (isArawal
                                ? t('رول أروال بالمتر - عروض ٦٠، ٨٠، ١٠٠، ١٢٠ سم', 'Arawal roll by meter')
                                : t('خيوط تركية ناعمة وعالية المتانة', 'Premium carpet'))}
                          </p>
                        </div>

                        {/* Price & Action Button */}
                        <div className="pt-2 border-t border-[#F2EDE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              {isArawal ? (
                                <span className="text-xs sm:text-sm font-extrabold text-[#251811]">
                                  {t('يبدأ من', 'Starts from')}{' '}
                                  {pricing.finalPrice?.toLocaleString()} {t('جنيه / متر', 'EGP / m')}
                                </span>
                              ) : (
                                <span className="text-xs sm:text-sm font-extrabold text-[#251811]">
                                  {pricing.finalPrice?.toLocaleString()} {t('ج.م', 'EGP')}
                                </span>
                              )}
                              {pricing.hasDiscount && pricing.originalPrice && (
                                <span className="text-[10px] sm:text-xs text-[#A09386] line-through font-normal">
                                  {pricing.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => navigateTo('product', { productId: product.id })}
                            className="w-full sm:w-auto px-3 py-1.5 rounded-full bg-[#FAF5EB] hover:bg-[#251811] text-[#251811] hover:text-white border border-[#DED4C7] text-[11px] font-bold transition-all text-center shrink-0 touch-manipulation min-h-[32px] flex items-center justify-center cursor-pointer"
                          >
                            {isArawal ? t('اختر الطول', 'Select Length') : t('التفاصيل', 'Details')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
