'use client';

import React from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import SafeImage from '@/components/SafeImage';
import { ArrowLeft, ArrowRight, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export default function HomeCategoriesSection() {
  const {
    categories,
    isCatalogLoading,
    catalogError,
    reloadCatalog,
    navigateTo,
  } = useToccoStore();

  const { t, isRtl, getName } = useLanguage();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const visibleCategories = React.useMemo(() => {
    return (categories || []).filter((cat) => cat.isVisible !== false);
  }, [categories]);

  return (
    <section
      id="home-categories-section"
      className="py-10 sm:py-16 bg-[#FBF9F5] border-y border-[#EAE3D8]/80 select-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE9DF] text-[#A27B5C] text-[11px] sm:text-xs font-bold tracking-wider uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>{t('المجموعات والأقسام', 'Categories & Collections')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#241710] tracking-tight">
            {t('تسوق حسب القسم', 'Shop by Category')}
          </h2>
          <p className="text-xs sm:text-sm text-[#736357] font-normal leading-relaxed">
            {t(
              'اختر من تشكيلات السجاد والأروال الفاخرة لتصفح الأقسام الفرعية والقطع المصممة خصيصاً لمساحتك.',
              'Browse luxury carpets, rugs, and runner rolls categorized to help you find the perfect piece.'
            )}
          </p>
        </div>

        {/* Loading State: Skeletons */}
        {isCatalogLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden bg-white border border-[#EAE3D8] p-3 space-y-3 animate-pulse"
              >
                <div className="aspect-[4/3] w-full bg-[#EFE9DF] rounded-xl" />
                <div className="h-4 bg-[#EFE9DF] rounded w-3/4 mx-auto" />
                <div className="h-3 bg-[#EFE9DF] rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry Button */}
        {!isCatalogLoading && catalogError && visibleCategories.length === 0 && (
          <div className="p-8 rounded-2xl bg-[#FFF6F3] border border-[#F6D0C5] text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FCE2DB] text-[#C04928] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#241710]">
              {t('تعذر تحميل الأقسام من الخادم', 'Unable to load categories')}
            </h3>
            <p className="text-xs text-[#7A6A5E]">
              {catalogError}
            </p>
            <button
              onClick={() => reloadCatalog()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#241710] hover:bg-[#3D2619] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('إعادة المحاولة', 'Try Again')}</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isCatalogLoading && !catalogError && visibleCategories.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-[#EAE3D8] text-center max-w-md mx-auto space-y-3">
            <Layers className="w-10 h-10 text-[#C49F74] mx-auto opacity-70" />
            <p className="text-sm font-bold text-[#241710]">
              {t('لا توجد أقسام متاحة حالياً', 'No categories currently available')}
            </p>
            <p className="text-xs text-[#7A6A5E]">
              {t('سيتم تحديث الأقسام والتشكيلات قريباً.', 'Categories will be updated soon.')}
            </p>
          </div>
        )}

        {/* Real Categories Grid */}
        {!isCatalogLoading && visibleCategories.length > 0 && (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            {visibleCategories.map((cat) => {
              const catTitle = getName(cat) || cat.name || cat.name_ar || '';
              const hasImage = Boolean(cat.image && cat.image.trim() !== '');

              return (
                <div
                  key={cat.id}
                  onClick={() =>
                    navigateTo('shop', {
                      categoryId: String(cat.id),
                      subcategoryId: 'all',
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigateTo('shop', {
                        categoryId: String(cat.id),
                        subcategoryId: 'all',
                      });
                    }
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#EAE3D8] hover:border-[#D5C6B5] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col focus:outline-none focus:ring-2 focus:ring-[#A27B5C]/50 active:scale-[0.99] touch-manipulation"
                >
                  {/* Category Image or Elegant Brand Placeholder */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#2D1E15] via-[#21160F] to-[#170E0A] flex items-center justify-center p-3">
                    {hasImage ? (
                      <>
                        <SafeImage
                          src={cat.image}
                          alt={catTitle}
                          fill
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-108"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="relative w-full h-full rounded-xl flex flex-col items-center justify-center text-center p-3 border border-[#C49F74]/25 bg-gradient-to-br from-[#332218] to-[#1E130D]">
                        {/* Woven Geometric Brand Emblem */}
                        <div className="w-11 h-11 rounded-full bg-[#C49F74]/15 border border-[#C49F74]/35 flex items-center justify-center mb-1.5 shadow-inner">
                          <Layers className="w-5 h-5 text-[#EED8BE]" />
                        </div>
                        <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C49F74]/80">
                          {t('عالم السجاد', 'Alamelsgad')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="text-xs sm:text-base font-bold text-[#241710] group-hover:text-[#A27B5C] transition-colors leading-snug line-clamp-1">
                        {catTitle}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#7A6A5E] mt-1 font-normal line-clamp-1">
                        {t('استكشف الأقسام الفرعية والمنتجات', 'Browse subcategories & pieces')}
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-[#F2EDE5] flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#A27B5C]">
                      <span>{t('تصفح القسم', 'Explore Category')}</span>
                      <div className="w-6 h-6 rounded-full bg-[#FAF5EB] group-hover:bg-[#241710] group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
