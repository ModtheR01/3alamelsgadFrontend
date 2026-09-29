'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToccoStore } from '@/lib/store';
import { useLanguage } from '@/lib/context/LanguageContext';
import { normalizeApiError } from '@/lib/api/errors';
import { colorService } from '@/lib/api/services/colorService';
import { toWhatsAppNumber } from '@/lib/utils';
import { BRAND_CONFIG, ArawalWidth, ArawalSelection } from '@/lib/brandConfig';
import { ProductFinish, ProductColor, ProductSize } from '@/types';
import { BackendColor } from '@/types/product';
import Image from '@/components/SafeImage';
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
  Ruler,
  Maximize2,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Info,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function ProductDetailView() {
  const {
    selectedProductId,
    getProductById,
    navigateTo,
    addToCart,
    categories,
    settings,
  } = useToccoStore();

  const { t, isRtl } = useLanguage();

  const product = useMemo(() => {
    return selectedProductId ? getProductById(selectedProductId) : null;
  }, [selectedProductId, getProductById]);

  // Is this an ARAWAL product?
  const isArawalProduct = useMemo(() => {
    if (!product) return false;
    return (
      product.isArawal ||
      /أروال|arawal|رول|مشاية بالمتر/i.test(product.name) ||
      /أروال|arawal|رول/i.test(product.description || '')
    );
  }, [product]);

  // Active state for configurable attributes
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish>(
    product?.finishes?.[0] || 'MATTE'
  );
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product?.colors?.[0] || { id: 'c-default', name: 'البيج الطبيعي', hex: '#D2C1AF' }
  );

  // Dynamic Available Widths defined by Admin
  const availableWidths = useMemo(() => {
    if (product?.availableWidths && product.availableWidths.length > 0) {
      return product.availableWidths;
    }
    const rawDims = product?.dimensions || '';
    const parsed = (rawDims.match(/\d+(\.\d+)?/g) || []).map(Number).filter((n) => n >= 30 && n <= 500);
    if (parsed.length > 0) {
      return Array.from(new Set(parsed)).sort((a, b) => a - b);
    }
    return [80];
  }, [product]);

  // ARAWAL State (Width defined by admin per product, customer selects length)
  const [selectedArawalWidth, setSelectedArawalWidth] = useState<number | null>(null);
  const arawalWidth =
    selectedArawalWidth !== null && availableWidths.includes(selectedArawalWidth)
      ? selectedArawalWidth
      : availableWidths[0] || 80;
  const [arawalLengthMeters, setArawalLengthMeters] = useState<number>(3);

  // Safe fallback images array
  const productImages = useMemo(() => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85'];
  }, [product]);

  // Standard Product Size State
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(
    product?.sizes?.[0]
  );

  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // If no product selected, redirect to shop
  if (!product) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <p className="text-lg text-[#251811] font-medium">
          {t('لم يتم العثور على المنتج المطلوب', 'Product not found')}
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-7 py-3 rounded-full bg-[#251811] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#402B1F] transition-all"
        >
          {t('العودة لتشكيلات السجاد', 'Return to Carpet Collections')}
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  // Price calculations:
  // For ARAWAL: Total price = Unit-length price × selected length
  // For Standard carpet: Base price + size delta
  const unitPricePerMeter = product.arawalUnitPricePerMeter || product.price || 500;
  const arawalCalculatedTotal = Math.round(unitPricePerMeter * arawalLengthMeters);

  const effectiveUnitPrice = isArawalProduct
    ? arawalCalculatedTotal
    : (product.price || 0) + (selectedSize?.priceDelta || 0);

  const totalCalculatedPrice = effectiveUnitPrice * quantity;

  // Deposit calculation
  const depositRatio = (settings.depositPercentage || 50) / 100;
  const depositDue = Math.round(totalCalculatedPrice * depositRatio);
  const remainingDue = totalCalculatedPrice - depositDue;

  // Construct Arawal selection object if applicable
  const currentArawalConfig: ArawalSelection | undefined = isArawalProduct
    ? {
        isArawal: true,
        width: arawalWidth,
        lengthMeters: arawalLengthMeters,
        unitPricePerMeter,
        totalPrice: arawalCalculatedTotal,
      }
    : undefined;

  // Contextual WhatsApp enquiry text
  const whatsappPrefill = isArawalProduct
    ? `مرحباً عالم السجاد، استفسار عن رول أروال بالمتر:
القطعة: ${product.name}
العرض المختار: ${arawalWidth} سم
الطول المطلوب: ${arawalLengthMeters} متر
السعر الإجمالي المحسوب: ${effectiveUnitPrice} ج.م
برجاء تأكيد التوفر والتوصيل.`
    : `مرحباً عالم السجاد، استفسار بخصوص سجادة:
الاسم: ${product.name}
اللون: ${selectedColor.name}
${selectedSize ? `المقاس: ${selectedSize.name}` : ''}
السعر: ${effectiveUnitPrice} ج.م`;

  const whatsappUrl = `https://wa.me/${toWhatsAppNumber(BRAND_CONFIG.whatsappNumber)}?text=${encodeURIComponent(
    whatsappPrefill
  )}`;

  const handleAddToCart = async () => {
    setCartError(null);
    setIsAddingToCart(true);
    try {
      const displayName = isArawalProduct
        ? `${product.name} (رول أروال: عرض ${arawalWidth} سم × طول ${arawalLengthMeters} م)`
        : product.name;

      await addToCart({
        productId: product.id,
        productName: displayName,
        productImage: product.images[0] || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85',
        unitPrice: effectiveUnitPrice,
        selectedFinish,
        selectedColor,
        selectedSize,
        arawalConfig: currentArawalConfig,
        quantity,
      });

      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    } catch (err) {
      setCartError(normalizeApiError(err).message);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const ArrowIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div id="product-detail-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="py-2.5 sm:py-4 flex items-center gap-2 text-xs text-[#8A796B] overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => navigateTo('shop')}
            className="flex items-center gap-1 hover:text-[#251811] transition-colors shrink-0 font-medium"
          >
            <span>{t('تشكيلات السجاد', 'Carpet Collections')}</span>
          </button>
          <span>/</span>
          {category && (
            <>
              <button
                onClick={() => navigateTo('shop', { categoryId: category.id })}
                className="hover:text-[#251811] transition-colors shrink-0"
              >
                {category.name}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-[#251811] font-semibold truncate max-w-[220px]">
            {product.name}
          </span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14 pt-4 sm:pt-6">
          {/* Left: Product Imagery Showcase (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Main Image with Clean Framing */}
            <div className="relative aspect-[4/3] sm:aspect-[5/4] w-full rounded-2xl overflow-hidden bg-[#EFE9DF] border border-[#E4DACD] shadow-[0_12px_36px_rgba(40,25,15,0.06)]">
              <Image
                src={productImages[selectedImageIdx] || productImages[0]}
                alt={product.name}
                fill
                priority
                className="object-cover object-center transition-all duration-500 hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />

              {/* ARAWAL Badge on Image */}
              {isArawalProduct && (
                <div className="absolute top-4 start-4 bg-[#251811]/90 backdrop-blur-md text-[#EED8BE] text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-[#C49F74]/30">
                  <Ruler className="w-3.5 h-3.5 text-[#C49F74]" />
                  <span>{t('رول أروال بالمتر', 'Arawal Runner by Meter')}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIdx === idx
                        ? 'border-[#A27B5C] ring-2 ring-[#A27B5C]/20 shadow-md'
                        : 'border-[#E4DACD] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Guarantees Ribbon */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#EAE2D5] text-center">
              <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E8DEC0]">
                <Truck className="w-5 h-5 mx-auto text-[#A27B5C] mb-1" />
                <span className="text-[11px] font-semibold text-[#251811] block">
                  {t('شحن لكافة المحافظات', 'All Governorates')}
                </span>
                <span className="text-[10px] text-[#7A6A5E]">
                  {t('توصيل ٢-٤ أيام', '2–4 business days')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E8DEC0]">
                <Sparkles className="w-5 h-5 mx-auto text-[#A27B5C] mb-1" />
                <span className="text-[11px] font-semibold text-[#251811] block">
                  {t('جودة عالية وخيوط فاخرة', 'Premium Weave')}
                </span>
                <span className="text-[10px] text-[#7A6A5E]">
                  {t('مقاوم للهبوط والاهتراء', 'High durability')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E8DEC0]">
                <ShieldCheck className="w-5 h-5 mx-auto text-[#A27B5C] mb-1" />
                <span className="text-[11px] font-semibold text-[#251811] block">
                  {t('معاينة عند الاستلام', 'Inspection on Delivery')}
                </span>
                <span className="text-[10px] text-[#7A6A5E]">
                  {t('تأكيد الطلب بعد المراجعة', 'Verified orders')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Product Customization & Ordering (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A27B5C] uppercase tracking-wider">
                {isArawalProduct ? (
                  <span>{t('أروال ومشايات بالمتر', 'Custom Arawal Runners')}</span>
                ) : (
                  <span>{category?.name || t('سجاد فاخر', 'Luxury Carpet')}</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#251811] tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price Presentation */}
              <div className="pt-2">
                {isArawalProduct ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#251811]">
                        {effectiveUnitPrice.toLocaleString()}
                      </span>
                      <span className="text-base font-semibold text-[#665448]">
                        {t('جنيه مصري', 'EGP')}
                      </span>
                      <span className="text-xs text-[#8A796B] font-normal">
                        ({arawalLengthMeters} {t('متر طول', 'meters length')})
                      </span>
                    </div>
                    <p className="text-xs text-[#8A796B]">
                      {t('سعر المتر الطولي:', 'Price per linear meter:')}{' '}
                      <span className="font-bold text-[#A27B5C]">
                        {unitPricePerMeter.toLocaleString()} {t('ج.م', 'EGP')}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#251811]">
                      {effectiveUnitPrice.toLocaleString()}
                    </span>
                    <span className="text-base font-semibold text-[#665448]">
                      {t('جنيه مصري', 'EGP')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ARAWAL CONFIGURATION SECTION (NORMAL PRODUCT SOLD BY LENGTH) */}
            {isArawalProduct && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F1E8] border border-[#E5DACD] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5DACD]">
                  <Ruler className="w-4 h-4 text-[#A27B5C]" />
                  <h3 className="text-sm font-bold text-[#251811]">
                    {t('مواصفات الرول', 'Roll Options')}
                  </h3>
                </div>

                {/* Step 1: Admin-Controlled Available Width(s) */}
                {availableWidths.length === 1 ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E0D5C6] text-xs">
                    <span className="font-bold text-[#251811]">{t('العرض المتوفر:', 'Available Width:')}</span>
                    <span className="font-extrabold text-[#A27B5C] text-sm">
                      {arawalWidth} {t('سم', 'cm')}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#251811]">
                        {t('اختر العرض:', 'Select Width:')}
                      </span>
                      <span className="text-[#8A796B] font-bold">
                        {arawalWidth} {t('سم', 'cm')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableWidths.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedArawalWidth(w)}
                          className={`py-2 px-3.5 rounded-xl text-center font-bold text-xs transition-all ${
                            arawalWidth === w
                              ? 'bg-[#251811] text-white shadow-md ring-2 ring-[#A27B5C]/30'
                              : 'bg-white text-[#251811] border border-[#DED4C7] hover:border-[#A27B5C]'
                          }`}
                        >
                          <div>{w} {t('سم', 'cm')}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Length Selection in Meters */}
                <div className="space-y-2 pt-2 border-t border-[#E5DACD]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#251811]">
                      {t('اختر الطول المطلوب (بالمتر):', 'Choose length needed (meters):')}
                    </span>
                    <span className="font-extrabold text-[#A27B5C] text-sm">
                      {arawalLengthMeters} {t('متر', 'meters')}
                    </span>
                  </div>

                  {/* Stepper Control */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setArawalLengthMeters((prev) =>
                          Math.max(BRAND_CONFIG.arawal.minMeterLength, Number((prev - 0.5).toFixed(1)))
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-white border border-[#DED4C7] text-[#251811] flex items-center justify-center font-bold hover:bg-[#EFE9DF] active:scale-95 transition-all"
                      aria-label="Decrease Length"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="flex-1 bg-white border border-[#DED4C7] rounded-xl py-2 px-3 text-center">
                      <input
                        type="number"
                        min={BRAND_CONFIG.arawal.minMeterLength}
                        max={BRAND_CONFIG.arawal.maxMeterLength}
                        step={BRAND_CONFIG.arawal.lengthStep}
                        value={arawalLengthMeters}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setArawalLengthMeters(Math.min(BRAND_CONFIG.arawal.maxMeterLength, Math.max(1, val)));
                          }
                        }}
                        className="w-full text-center text-base font-extrabold text-[#251811] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setArawalLengthMeters((prev) =>
                          Math.min(BRAND_CONFIG.arawal.maxMeterLength, Number((prev + 0.5).toFixed(1)))
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-white border border-[#DED4C7] text-[#251811] flex items-center justify-center font-bold hover:bg-[#EFE9DF] active:scale-95 transition-all"
                      aria-label="Increase Length"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#8A796B]">{t('أطوال شائعة:', 'Common lengths:')}</span>
                    {[1.5, 2, 2.5, 3, 4, 5, 6].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setArawalLengthMeters(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-medium ${
                          arawalLengthMeters === preset
                            ? 'bg-[#A27B5C] text-white'
                            : 'bg-white text-[#5C4A3E] border border-[#DFD6C9] hover:bg-[#F0EAE0]'
                        }`}
                      >
                        {preset} {t('م', 'm')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Transparency Box */}
                <div className="p-3 rounded-xl bg-white border border-[#E0D5C6] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#5C4A3E]">
                    <span>{t('العرض المحدد:', 'Selected width:')}</span>
                    <span className="font-semibold">{arawalWidth} {t('سم', 'cm')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C4A3E]">
                    <span>{t('سعر المتر:', 'Price per meter:')}</span>
                    <span className="font-semibold">
                      {unitPricePerMeter.toLocaleString()} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C4A3E]">
                    <span>{t('الطول المحدد:', 'Selected length:')}</span>
                    <span className="font-semibold">
                      {arawalLengthMeters} {t('متر', 'meters')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-extrabold text-[#251811] text-sm pt-1 border-t border-[#F2ECE3]">
                    <span>{t('الإجمالي:', 'Subtotal:')}</span>
                    <span className="text-[#A27B5C]">
                      {arawalCalculatedTotal.toLocaleString()} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Sizes (if NOT ARAWAL and product has sizes) */}
            {!isArawalProduct && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#251811]">
                  {t('المقاس:', 'Select Size:')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`p-3 rounded-xl text-start text-xs border transition-all ${
                        selectedSize?.id === s.id
                          ? 'border-[#A27B5C] bg-[#FAF5EB] font-bold text-[#251811] ring-1 ring-[#A27B5C]'
                          : 'border-[#E4DACD] bg-white text-[#5C4A3E] hover:border-[#A27B5C]'
                      }`}
                    >
                      <div className="font-bold">{s.name}</div>
                      <div className="text-[11px] text-[#8A796B]">{s.dimensions}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Swatches (if product has colors) */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#251811]">{t('اللون:', 'Color:')}</span>
                  <span className="text-[#8A796B] font-medium">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-9 px-3 rounded-full flex items-center gap-2 border text-xs font-medium transition-all ${
                        selectedColor.id === c.id
                          ? 'border-[#251811] bg-white shadow-sm ring-2 ring-[#A27B5C]/20'
                          : 'border-[#E4DACD] bg-white text-[#5C4A3E] hover:border-[#A27B5C]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-2 border-t border-b border-[#EAE2D5]">
              <span className="text-xs font-bold text-[#251811]">{t('الكمية:', 'Quantity:')}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#DED4C7] text-[#251811] flex items-center justify-center hover:bg-[#F2ECE3]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold text-sm text-[#251811] min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#DED4C7] text-[#251811] flex items-center justify-center hover:bg-[#F2ECE3]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add to Cart & WhatsApp CTAs */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`w-full py-4 px-6 rounded-full font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                  addedAnimation
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#251811] hover:bg-[#3D291D] text-white active:scale-[0.99]'
                }`}
              >
                {isAddingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : addedAnimation ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>{t('تمت الإضافة إلى السلة بنجاح!', 'Added to Bag!')}</span>
                  </>
                ) : (
                  <span>
                    {t('إضافة إلى السلة', 'Add to Cart')} · {totalCalculatedPrice.toLocaleString()} {t('ج.م', 'EGP')}
                  </span>
                )}
              </button>

              {cartError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cartError}</span>
                </div>
              )}

              {/* Direct WhatsApp Concierge CTA */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 rounded-full bg-white border border-[#25D366]/40 hover:border-[#25D366] text-[#1E7E34] hover:bg-[#25D366]/5 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{t('طلب أو استفسار عبر واتساب مباشرة', 'Inquire or Order via WhatsApp')}</span>
              </a>
            </div>

            {/* Description & Specifications Accordion/Card */}
            <div className="pt-4 border-t border-[#EAE2D5] space-y-3 text-xs leading-relaxed text-[#5C4A3E]">
              <div>
                <h4 className="font-bold text-[#251811] mb-1">{t('وصف السجاد:', 'Description:')}</h4>
                <p>{product.description || t('سجاد فاخر مصنوع بأعلى معايير الحرفة والدقة ليمنح منزلك لمسة دافئة وفخمة تدوم طويلاً.', 'Luxury carpet crafted with precision and craftsmanship.')}</p>
              </div>

              {product.dimensions && !isArawalProduct && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#251811]">{t('الأبعاد:', 'Dimensions:')}</span>
                  <span>{product.dimensions}</span>
                </div>
              )}

              {product.material && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#251811]">{t('الخامة والنسيج:', 'Material:')}</span>
                  <span>{product.material}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
