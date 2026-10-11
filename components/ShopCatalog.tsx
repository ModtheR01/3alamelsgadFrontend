'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToccoStore, mapBackendProduct } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { productService } from '@/lib/api/services/productService';
import { offerService } from '@/lib/api/services/offerService';
import { Product } from '@/types';
import { BackendOffer } from '@/types/offer';
import Image from '@/components/SafeImage';
import {
  Search,
  Filter,
  Ruler,
  Sparkles,
  X,
  Tag,
  ArrowRight,
  ArrowLeft,
  Layers,
  ChevronDown,
} from 'lucide-react';

export default function ShopCatalog() {
  const {
    products,
    categories,
    subcategories,
    selectedCategoryId,
    navigateTo,
    searchQuery,
    setSearchQuery,
  } = useToccoStore();

  const { t, isRtl } = useLanguage();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(
    selectedCategoryId || 'all'
  );
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string>('all');
  const [arawalOnlyFilter, setArawalOnlyFilter] = useState<boolean>(false);
  const [offersOnlyFilter, setOffersOnlyFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');

  // Backend Offers state for catalog
  const [offers, setOffers] = useState<BackendOffer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);

  // Server-side search results (debounced)
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Read URL query parameters on mount to support shareable & refresh-safe links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const subcat = params.get('subcategory');
    const isOffers = params.get('offers');
    const isArawal = params.get('arawal');

    if (cat) {
      setActiveCategoryFilter(cat);
    } else if (selectedCategoryId) {
      setActiveCategoryFilter(selectedCategoryId);
    }
    if (subcat) setActiveSubcategoryFilter(subcat);
    if (isOffers === 'true') setOffersOnlyFilter(true);
    if (isArawal === 'true') setArawalOnlyFilter(true);
  }, [selectedCategoryId]);

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
        if (arawalOnlyFilter && !product.isArawal && !/أروال|arawal|رول/i.test(product.name)) {
          return false;
        }

        // Offers filter
        if (offersOnlyFilter) {
          const hasDiscount = Boolean(
            (product.discountPercentage && product.discountPercentage > 0) ||
              (product.originalPrice && product.originalPrice > product.price)
          );
          const inActiveOffer = offerProductIds.has(Number(product.id));
          if (!hasDiscount && !inActiveOffer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price-asc') {
          return (a.price || 999999) - (b.price || 999999);
        }
        if (sortBy === 'price-desc') {
          return (b.price || 0) - (a.price || 0);
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
    offerProductIds,
    searchQuery,
    sortBy,
  ]);

  const visibleCategories = categories.filter((c) => c.isVisible);
  const selectedCategoryObj = visibleCategories.find((c) => String(c.id) === String(activeCategoryFilter));

  return (
    <div id="shop-catalog-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pb-8 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('تشكيلات عالم السجاد الحصرية', 'Alamelsgad Carpet Archive')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
            {selectedCategoryObj
              ? selectedCategoryObj.name
              : arawalOnlyFilter
              ? t('مشايات وأروال بالمتر', 'Arawal Runners by Meter')
              : offersOnlyFilter
              ? t('العروض والتخفيضات النشطة', 'Active Offers & Discounts')
              : t('كتالوج السجاد والأروال', 'Carpet Collections & Runners')}
          </h1>
          <p className="text-xs sm:text-sm text-[#736357] font-normal max-w-2xl leading-relaxed">
            {selectedCategoryObj?.description ||
              t(
                'سجاد تركي فاخر، سجاد شرقي، بدائل سجاد عصرية، ورولات أروال ومشايات بالمتر مع توصيل سريع لكافة محافظات مصر.',
                'Luxury Turkish carpets, oriental rugs, modern alternatives, and runner rolls sold by meter with fast Egypt-wide delivery.'
              )}
          </p>
        </div>

        {/* Active Offers Banner (if offers exist) */}
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
                  {activeOffers[0]?.name}
                  {activeOffers[0]?.percentage ? ` · خصم ${activeOffers[0].percentage}%` : ''}
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
              className="px-4 py-2 rounded-full bg-[#FAF5EB] hover:bg-white text-[#251811] text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              {t('تصفح العروض الآن', 'Browse Offers Now')}
            </button>
          </div>
        )}

        {/* Primary Filter & Category Bar */}
        <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs (Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {/* All Carpets Tab */}
            <button
              onClick={() => {
                setActiveCategoryFilter('all');
                setActiveSubcategoryFilter('all');
                setArawalOnlyFilter(false);
                setOffersOnlyFilter(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
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
                  setActiveSubcategoryFilter('all');
                  setArawalOnlyFilter(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
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
                setActiveSubcategoryFilter('all');
                setOffersOnlyFilter(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
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
                  setActiveSubcategoryFilter('all');
                  setArawalOnlyFilter(false);
                  setOffersOnlyFilter(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeCategoryFilter === String(category.id) && !arawalOnlyFilter && !offersOnlyFilter
                    ? 'bg-[#251811] text-white shadow-xs'
                    : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
                }`}
              >
                {category.name}
              </button>
            ))}
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

        {/* Secondary Subcategory Filter Pills (When Category has Subcategories) */}
        {availableSubcategories.length > 0 && (
          <div className="mb-6 p-3 rounded-2xl bg-white border border-[#EAE3D8] shadow-2xs">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Layers className="w-3.5 h-3.5 text-[#A27B5C]" />
              <span className="text-xs font-bold text-[#251811]">
                {t(`الأقسام الفرعية في ${selectedCategoryObj?.name}:`, `Subcategories in ${selectedCategoryObj?.name}:`)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveSubcategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  activeSubcategoryFilter === 'all'
                    ? 'bg-[#A27B5C] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#5C4A3E] border border-[#EAE3D8] hover:border-[#A27B5C]'
                }`}
              >
                {t('الكل', 'All')}
              </button>
              {availableSubcategories.map((subcat) => (
                <button
                  key={subcat.id}
                  onClick={() => setActiveSubcategoryFilter(String(subcat.id))}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                    activeSubcategoryFilter === String(subcat.id)
                      ? 'bg-[#A27B5C] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#5C4A3E] border border-[#EAE3D8] hover:border-[#A27B5C]'
                  }`}
                >
                  {subcat.name || subcat.name_ar || subcat.name_en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Search Query Notice */}
        {searchQuery.trim() && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-[#FAF5EB] border border-[#E8DEC0] text-xs text-[#5C4A3E]">
            <span>
              {t('نتائج البحث عن:', 'Showing search results for:')} <strong>«{searchQuery}»</strong> ({filteredProducts.length})
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#A27B5C] font-bold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('إلغاء البحث', 'Clear')}</span>
            </button>
          </div>
        )}

        {/* Product Cards Grid: 2 cols on mobile, 4 cols on desktop */}
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#EFE9DF] text-[#8A796B] flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 text-[#A27B5C]" />
            </div>
            <p className="text-base font-bold text-[#251811]">
              {t('لا توجد قطع مطابقة للبحث حالياً', 'No products found matching your criteria')}
            </p>
            <p className="text-xs text-[#8A796B]">
              {t('جرب اختيار قسم آخر أو إلغاء فلاتر التصفية.', 'Try selecting another category or clearing filters.')}
            </p>
            <button
              onClick={() => {
                setActiveCategoryFilter('all');
                setActiveSubcategoryFilter('all');
                setArawalOnlyFilter(false);
                setOffersOnlyFilter(false);
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-full bg-[#251811] text-white text-xs font-bold"
            >
              {t('عرض جميع السجاد', 'View All Carpets')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const isArawal =
                product.isArawal || /أروال|arawal|رول/i.test(product.name);
              const hasDiscount = Boolean(
                (product.discountPercentage && product.discountPercentage > 0) ||
                  (product.originalPrice && product.originalPrice > product.price)
              );

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DEC0] hover:shadow-xl transition-all duration-300"
                >
                  {/* Image with High Resolution and Preserved Aspect Ratio (object-contain on neutral background) */}
                  <div
                    className="relative aspect-[4/5] bg-[#F7F5F0] overflow-hidden cursor-pointer p-3 flex items-center justify-center rounded-t-2xl"
                    onClick={() => navigateTo('product', { productId: product.id })}
                  >
                    <Image
                      src={
                        product.images[0] ||
                        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'
                      }
                      alt={product.name}
                      fill
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2.5 end-2.5 bg-[#94622D] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        {product.discountPercentage ? `-${product.discountPercentage}%` : t('خصم خاص', 'Sale')}
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
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Quiet Category Label */}
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A796B] block mb-1">
                        {isArawal ? t('أروال وممرات', 'Runners') : t('سجاد فاخر', 'Luxury Carpet')}
                      </span>

                      <h3
                        onClick={() => navigateTo('product', { productId: product.id })}
                        className="text-xs sm:text-sm font-bold text-[#251811] group-hover:text-[#A27B5C] transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <p className="text-[11px] text-[#7A6A5E] line-clamp-1 mt-1 font-normal">
                        {product.description ||
                          (isArawal
                            ? t('رول أروال بالمتر - عروض ٦٠، ٨٠، ١٠٠، ١٢٠ سم', 'Arawal roll by meter - 60, 80, 100, 120 cm')
                            : t('خيوط تركية ناعمة مقاومة للانزلاق', 'Non-slip premium weave'))}
                      </p>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-2 border-t border-[#F2EDE5] flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-[#251811]">
                            {product.price?.toLocaleString()} {t('ج.م', 'EGP')}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] sm:text-xs text-[#A09386] line-through font-normal">
                              {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {isArawal && (
                          <span className="text-[10px] text-[#8A796B] block">
                            {t('/ للمتر', '/ meter')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => navigateTo('product', { productId: product.id })}
                        className="px-3 py-1.5 rounded-full bg-[#FAF5EB] hover:bg-[#251811] text-[#251811] hover:text-white border border-[#DED4C7] text-[11px] font-bold transition-all"
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
    </div>
  );
}
