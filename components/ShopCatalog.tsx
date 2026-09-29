'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToccoStore, mapBackendProduct } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { productService } from '@/lib/api/services/productService';
import { Product } from '@/types';
import Image from '@/components/SafeImage';
import { Search, Filter, SlidersHorizontal, ArrowRight, ArrowLeft, Ruler, Sparkles, X } from 'lucide-react';

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
  const [arawalOnlyFilter, setArawalOnlyFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');

  // Server-side search results (debounced)
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const baseList = searchQuery.trim() ? searchResults || [] : products;
    return baseList
      .filter((product) => {
        if (!product.isPublished) return false;

        // Category filter
        if (activeCategoryFilter !== 'all' && product.categoryId !== activeCategoryFilter) {
          return false;
        }

        // Arawal specific filter
        if (arawalOnlyFilter && !product.isArawal && !/أروال|arawal|رول/i.test(product.name)) {
          return false;
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
  }, [products, searchResults, activeCategoryFilter, arawalOnlyFilter, searchQuery, sortBy]);

  const visibleCategories = categories.filter((c) => c.isVisible);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div id="shop-catalog-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pb-8 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('تشكيلات عالم السجاد الحصرية', 'Alamelsgad Carpet Archive')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#251811] tracking-tight">
            {t('كتالوج السجاد والأروال', 'Carpet Collections & Runners')}
          </h1>
          <p className="text-xs sm:text-sm text-[#736357] font-normal max-w-2xl leading-relaxed">
            {t(
              'سجاد تركي فاخر، سجاد شرقي، بدائل سجاد عصرية، ورولات أروال ومشايات بالمتر مع توصيل سريع لكافة محافظات مصر.',
              'Luxury Turkish carpets, oriental rugs, modern alternatives, and runner rolls sold by meter with fast Egypt-wide delivery.'
            )}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs (Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => {
                setActiveCategoryFilter('all');
                setArawalOnlyFilter(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategoryFilter === 'all' && !arawalOnlyFilter
                  ? 'bg-[#251811] text-white shadow-xs'
                  : 'bg-white text-[#5C4A3E] border border-[#DED4C7] hover:border-[#A27B5C]'
              }`}
            >
              {t('جميع التشكيلات', 'All Carpets')} ({products.length})
            </button>

            {/* Dedicated ARAWAL runner tab */}
            <button
              onClick={() => {
                setArawalOnlyFilter(!arawalOnlyFilter);
                setActiveCategoryFilter('all');
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

            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategoryFilter(category.id);
                  setArawalOnlyFilter(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeCategoryFilter === category.id && !arawalOnlyFilter
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
              {t('جرب اختيار قسم آخر أو إلغاء فلتر البحث.', 'Try selecting another category or clearing search.')}
            </p>
            <button
              onClick={() => {
                setActiveCategoryFilter('all');
                setArawalOnlyFilter(false);
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

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DEC0] hover:shadow-xl transition-all duration-300"
                >
                  {/* Image with High Resolution and Consistent Aspect Ratio */}
                  <div
                    className="relative aspect-[4/5] bg-[#EFE9DF] overflow-hidden cursor-pointer"
                    onClick={() => navigateTo('product', { productId: product.id })}
                  >
                    <Image
                      src={product.images[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

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
                      {/* Zero-Pill Quiet Category Label */}
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
                        {product.description || (isArawal ? t('رول أروال بالمتر - عروض ٦٠، ٨٠، ١٠٠، ١٢٠ سم', 'Arawal roll by meter - 60, 80, 100, 120 cm') : t('خيوط تركية ناعمة مقاومة للانزلاق', 'Non-slip premium weave'))}
                      </p>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-2 border-t border-[#F2EDE5] flex items-center justify-between">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-[#251811]">
                          {product.price?.toLocaleString()} {t('ج.م', 'EGP')}
                        </span>
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
