'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, ProductColor, ProductSize } from '@/types';
import { BackendSubcategory } from '@/types/category';
import { BackendProduct, BackendArwal } from '@/types/product';
import { productService } from '@/lib/api/services/productService';
import SafeImage from '@/components/SafeImage';
import {
  X,
  Package,
  Layers,
  Palette,
  Ruler,
  Clock,
  Calendar,
  Tag,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Scissors,
  FileText,
  DollarSign,
  Truck,
  Eye,
} from 'lucide-react';
import { getProductTypeLabel } from './ProductsSection';

interface ViewProductModalProps {
  product: Product | null;
  categories: Category[];
  subcategories?: BackendSubcategory[];
  onClose: () => void;
}

export default function ViewProductModal({
  product,
  categories,
  subcategories = [],
  onClose,
}: ViewProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [freshDetail, setFreshDetail] = useState<BackendProduct | BackendArwal | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setFreshDetail(null);
  }, [product?.id, product?.isArawal]);

  // Fetch full detail if available to ensure up-to-date created_at/updated_at and relations
  useEffect(() => {
    if (!product?.id) return;
    const numId = Number(product.id);
    if (!Number.isFinite(numId)) return;

    let isMounted = true;
    setIsLoadingDetail(true);

    const fetchDetail = product.isArawal
      ? productService.getArwal(numId)
      : productService.getProduct(numId);

    fetchDetail
      .then((res) => {
        if (isMounted) setFreshDetail(res);
      })
      .catch(() => {
        // Silently use the passed product data if backend detail fails
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id, product?.isArawal]);

  // Handle ESC key to close modal & prevent background scroll
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomModalOpen) {
          setIsZoomModalOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [product, onClose, isZoomModalOpen]);

  // Category and Subcategory matching
  const { matchedCategory, matchedSubcategory } = useMemo(() => {
    if (!product) return { matchedCategory: null, matchedSubcategory: null };

    // Subcategory matching
    const subcatId = product.subcategoryIds?.[0] || (freshDetail as any)?.subcategory?.id;
    const subcat = subcategories.find((s) => String(s.id) === String(subcatId)) || null;

    // Category matching
    let cat = categories.find((c) => String(c.id) === String(product.categoryId)) || null;
    if (!cat && subcat?.category_id) {
      cat = categories.find((c) => String(c.id) === String(subcat.category_id)) || null;
    }

    return { matchedCategory: cat, matchedSubcategory: subcat };
  }, [product, freshDetail, categories, subcategories]);

  // Images list
  const allImages = useMemo<string[]>(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img): img is string => Boolean(img));
    }
    if (freshDetail && Array.isArray((freshDetail as any).images)) {
      return (freshDetail as any).images
        .map((img: any) => String(img?.image || ''))
        .filter((url: string) => Boolean(url));
    }
    return [];
  }, [product, freshDetail]);

  const activeImage = allImages[selectedImageIndex] || allImages[0] || null;

  // Format dates safely
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'غير محدد';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'غير محدد';
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'غير محدد';
    }
  };

  if (!product) return null;

  const isArwal = Boolean(product.isArawal);
  const createdDate = formatDateTime(freshDetail?.created_at || product.createdAt);
  const updatedDate = formatDateTime(freshDetail?.updated_at || product.updatedAt);

  // Arwal widths with pricing
  const arwalWidthsData = isArwal
    ? (product.widthsWithPrices && product.widthsWithPrices.length > 0
        ? product.widthsWithPrices
        : (product.availableWidths || [60, 80, 100, 120]).map((w) => ({
            width: w,
            price_per_length: product.arawalUnitPricePerMeter || product.price,
          })))
    : [];

  return (
    <>
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-product-title"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in overflow-y-auto"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-3xl w-full border border-[#EAE3D8] shadow-2xl text-right overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#EAE3D8] bg-[#FAF8F5]/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#241710] text-[#FAF5EB] flex items-center justify-center shrink-0 shadow-xs">
                <Package className="w-5 h-5 text-[#FAF5EB]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="view-product-title" className="text-base sm:text-lg font-bold text-[#241710]">
                    {product.name_ar || product.name}
                  </h2>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                      isArwal
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isArwal ? 'رول أروال (بالمتر)' : 'سجاد بالقطعة'}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B] font-mono mt-0.5">
                  معرف المنتج في النظام: #{product.id}
                  {product.name_en && ` • ${product.name_en}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-[#241710] divide-y divide-[#F5EFE6]">
            {/* 1. Images Gallery Section */}
            <div className="space-y-3 pt-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#A27B5C]" />
                  <span>معرض الصور ({allImages.length})</span>
                </h3>
                {activeImage && (
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="text-xs text-[#A27B5C] hover:text-[#241710] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>تكبير الصورة</span>
                  </button>
                )}
              </div>

              {activeImage ? (
                <div className="space-y-3">
                  {/* Main Preview */}
                  <div
                    onClick={() => setIsZoomModalOpen(true)}
                    className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#EAE3D8] p-3 flex items-center justify-center cursor-zoom-in group shadow-inner"
                  >
                    <SafeImage
                      src={activeImage}
                      alt={product.name_ar || product.name}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-xs rounded-lg text-[10px] text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3 h-3" />
                      <span>انقر للتكبير</span>
                    </div>
                  </div>

                  {/* Thumbnails row if multiple images */}
                  {allImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {allImages.map((imgUrl, idx) => {
                        const isPrimary = idx === 0;
                        const isSelected = idx === selectedImageIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border shrink-0 transition-all ${
                              isSelected
                                ? 'border-[#241710] ring-2 ring-[#241710]/20 scale-102'
                                : 'border-[#EAE3D8] hover:border-[#A27B5C] opacity-70 hover:opacity-100'
                            }`}
                          >
                            <SafeImage
                              src={imgUrl}
                              alt={`صورة ${idx + 1}`}
                              fill
                              className="object-contain p-1"
                            />
                            {isPrimary && (
                              <span className="absolute bottom-0 inset-x-0 bg-[#241710]/80 text-[#FAF5EB] text-[8px] py-0.5 text-center font-bold">
                                رئيسية
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] w-full rounded-2xl bg-[#FAF8F5] border border-dashed border-[#EAE3D8] flex flex-col items-center justify-center text-[#8C7A6B] p-6 text-center">
                  <Package className="w-10 h-10 mb-2 opacity-30 text-[#241710]" />
                  <p className="font-bold text-xs">لا توجد صور مرفوعة لهذا المنتج</p>
                  <p className="text-[10px] mt-1">يمكنك رفع صور للمنتج من خلال زر التعديل.</p>
                </div>
              )}
            </div>

            {/* 2. Basic Information Section */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#A27B5C]" />
                <span>المعلومات الأساسية والتصنيف</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Product Name (AR) */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">الاسم بالعربية:</span>
                  <span className="font-bold text-xs text-[#241710]">{product.name_ar || product.name || 'غير محدد'}</span>
                </div>

                {/* Product Name (EN) */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">الاسم بالإنجليزية:</span>
                  <span className="font-bold text-xs text-[#241710] font-sans" dir="ltr">
                    {product.name_en || 'غير محدد'}
                  </span>
                </div>

                {/* Main Category */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">القسم الرئيسي:</span>
                  <span className="font-bold text-xs text-[#241710]">
                    {matchedCategory?.name_ar || matchedCategory?.name || 'غير محدد'}
                  </span>
                </div>

                {/* Subcategory */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">القسم الفرعي:</span>
                  <span className="font-bold text-xs text-[#241710]">
                    {matchedSubcategory?.name_ar || matchedSubcategory?.name || getProductTypeLabel(product, subcategories)}
                  </span>
                </div>

                {/* Status & Visibility */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-1">حالة العرض والظهور:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>نشط ومعروض بالمتجر</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" />
                        <span>مؤرشف / غير معروض</span>
                      </span>
                    )}

                    {product.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>مميز (Featured)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-1">حالة المخزون:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      product.inStock !== false
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {product.inStock !== false ? 'متوفر للطلب' : 'غير متوفر حالياً'}
                  </span>
                </div>

                {/* Creation Date */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>تاريخ الإضافة:</span>
                  </span>
                  <span className="font-bold text-xs text-[#241710]">{createdDate}</span>
                </div>

                {/* Last Updated Date */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>آخر تعديل:</span>
                  </span>
                  <span className="font-bold text-xs text-[#241710]">{updatedDate}</span>
                </div>
              </div>
            </div>

            {/* 3. Pricing Section */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#A27B5C]" />
                <span>التسعير والعروض</span>
              </h3>

              {isArwal ? (
                <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-900 font-bold">طريقة التسعير:</span>
                    <span className="text-xs font-bold text-purple-950">سعر متر طولي لكل عرض</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-purple-200/60 pt-2">
                    <span className="text-xs text-purple-900">سعر البداية في الكتالوج:</span>
                    <span className="text-sm font-bold text-[#241710]">
                      يبدأ من {(product.arawalUnitPricePerMeter || product.price).toLocaleString('ar-EG')} ج.م / متر
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed pt-1">
                    يتم احتساب السعر النهائي بناءً على العرض الذي يختاره العميل مضروباً في الطول الإجمالي بالأمتار (انظر جدول العروض بالأسفل).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                    <span className="text-[11px] text-[#8C7A6B] block mb-1">سعر البيع الحالي:</span>
                    <span className="font-bold text-base text-[#241710]">
                      {product.price.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                    <span className="text-[11px] text-[#8C7A6B] block mb-1">السعر الأصلي قبل الخصم:</span>
                    {product.originalPrice ? (
                      <span className="font-bold text-sm text-stone-500 line-through">
                        {product.originalPrice.toLocaleString('ar-EG')} ج.م
                      </span>
                    ) : (
                      <span className="text-xs text-[#8C7A6B]">لا يوجد خصم نشط</span>
                    )}
                  </div>

                  <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                    <span className="text-[11px] text-[#8C7A6B] block mb-1">نسبة الخصم / التوفير:</span>
                    {product.discountPercentage ? (
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <span>خصم {product.discountPercentage}%</span>
                        {product.originalPrice && (
                          <span>(وفر {(product.originalPrice - product.price).toLocaleString('ar-EG')} ج.م)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-[#8C7A6B]">السعر القياسي</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Arwal-Specific Widths & Pricing (if roll product) */}
            {isArwal && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-700" />
                    <span>عروض الرول المتاحة وأسعار المتر المستقلة</span>
                  </h3>
                  <span className="text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md font-bold">
                    {arwalWidthsData.length} عروض مفعلة
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-purple-200 shadow-2xs">
                  <table className="w-full text-xs text-right bg-white">
                    <thead className="bg-purple-50/80 border-b border-purple-200 text-purple-950 text-[11px] font-bold">
                      <tr>
                        <th className="py-2.5 px-4 text-right">عرض الرول</th>
                        <th className="py-2.5 px-4 text-right">سعر المتر الطولي</th>
                        <th className="py-2.5 px-4 text-right">الحالة</th>
                        <th className="py-2.5 px-4 text-right">مثال (طول 5 أمتار)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {arwalWidthsData.map((wItem, idx) => {
                        const priceNum = Number(wItem.price_per_length) || 0;
                        return (
                          <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[#241710]">
                              {wItem.width} سم
                            </td>
                            <td className="py-2.5 px-4 font-bold text-purple-900">
                              {priceNum.toLocaleString('ar-EG')} ج.م / متر
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>متاح للطلب</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-stone-600 font-mono">
                              {(priceNum * 5).toLocaleString('ar-EG')} ج.م
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-[#FAF8F5] border border-[#EAE3D8] rounded-xl text-[11px] text-[#5C4A3E] flex items-center justify-between">
                  <span>طول الرول المدعوم: <strong>طول حر يحدده العميل بالمتر</strong></span>
                  <span>معادلة الحساب: <strong>سعر المتر للعرض × الطول المطلوب</strong></span>
                </div>
              </div>
            )}

            {/* 5. Sizes Section (if regular carpet) */}
            {!isArwal && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[#A27B5C]" />
                    <span>المقاسات المتوفرة ({product.sizes?.length || 0})</span>
                  </h3>
                </div>

                {product.sizes && product.sizes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {product.sizes.map((s: ProductSize) => (
                      <div
                        key={s.id}
                        className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-xs text-[#241710] block">
                            {s.width && s.length ? `${s.width} × ${s.length} سم` : s.dimensions || s.name}
                          </span>
                          <span className="text-[10px] text-[#8C7A6B]">
                            {s.dimensions && s.name !== s.dimensions ? s.name : 'مقاس قياسي'}
                          </span>
                        </div>
                        {s.priceDelta !== 0 && (
                          <span className="text-[11px] font-bold text-[#A27B5C]">
                            {s.priceDelta > 0 ? `+${s.priceDelta}` : s.priceDelta} ج.م
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] text-xs text-[#8C7A6B]">
                    {product.dimensions ? (
                      <span>الأبعاد المسجلة: <strong className="text-[#241710]">{product.dimensions}</strong></span>
                    ) : (
                      <span>لا توجد مقاسات متعددة مسجلة (مقاس قياسي موحد).</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6. Colors Section */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#A27B5C]" />
                  <span>الألوان المرتبطة بالمنتج ({product.colors?.length || 0})</span>
                </h3>
              </div>

              {product.colors && product.colors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.colors.map((c: ProductColor) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] flex items-center gap-2.5"
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-black/15 shadow-2xs shrink-0"
                        style={{ backgroundColor: c.hex }}
                        title={c.hex}
                      />
                      <div className="overflow-hidden">
                        <span className="font-bold text-xs text-[#241710] block truncate">
                          {c.name_ar || c.name || c.name_en || 'لون'}
                        </span>
                        <span className="text-[10px] text-[#8C7A6B] font-mono block uppercase">
                          {c.hex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] text-xs text-[#8C7A6B]">
                  لا توجد ألوان محددة لهذا المنتج.
                </div>
              )}
            </div>

            {/* 7. Materials & Descriptive Attributes */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A27B5C]" />
                <span>الخامات والمواصفات الإضافية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">الخامة:</span>
                  <span className="font-bold text-xs text-[#241710]">
                    {product.material && product.material.trim() !== '' ? product.material : 'غير محدد'}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>مدة التوصيل والإنتاج:</span>
                  </span>
                  <span className="font-bold text-xs text-[#241710]">
                    {product.deliveryDays
                      ? `${product.deliveryDays} أيام عمل`
                      : product.leadTime && product.leadTime.trim() !== ''
                      ? product.leadTime
                      : 'غير محدد'}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8]">
                  <span className="text-[11px] text-[#8C7A6B] block mb-0.5">نوع التشطيب:</span>
                  <span className="font-bold text-xs text-[#241710]">
                    {product.finishes && product.finishes.length > 0
                      ? product.finishes
                          .map((f) => (f === 'MATTE' ? 'مطفي (Matte)' : f === 'GLOSSY' ? 'لامع (Glossy)' : f))
                          .join('، ')
                      : 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. Descriptions Section */}
            <div className="space-y-3 pt-4">
              <h3 className="font-bold text-sm text-[#241710] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#A27B5C]" />
                <span>الأوصاف والبيانات التعريفية</span>
              </h3>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[11px] text-[#8C7A6B] block mb-1">الوصف باللغة العربية:</span>
                  <p className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] text-xs leading-relaxed text-[#5C4A3E] whitespace-pre-line">
                    {product.description_ar || product.description || 'لا يوجد وصف باللغة العربية.'}
                  </p>
                </div>

                {product.description_en && (
                  <div>
                    <span className="text-[11px] text-[#8C7A6B] block mb-1">الوصف باللغة الإنجليزية:</span>
                    <p
                      dir="ltr"
                      className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D8] text-xs leading-relaxed text-[#5C4A3E] font-sans whitespace-pre-line text-left"
                    >
                      {product.description_en}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-[#EAE3D8] bg-[#FAF8F5]/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#8C7A6B]">
              وضع المعاينة للقراءة فقط • لا يمكن إجراء تعديلات من هذه النافذة
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#241710] text-[#FAF5EB] text-xs font-bold hover:bg-[#3D281D] transition-colors shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomModalOpen && activeImage && (
        <div
          dir="rtl"
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full h-[80vh] flex items-center justify-center"
          >
            <SafeImage
              src={activeImage}
              alt={product.name_ar || product.name}
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              title="إغلاق التكبير"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
